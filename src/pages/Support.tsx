import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import SubscriptionGuard from '../components/SubscriptionGuard';
import { Send, MessageSquare, User, Check, CheckCircle, Paperclip, Mic, StopCircle, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Support: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useFamily(); 
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Media States
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // منطق الحماية
  const isSubscribed = currentProfile?.subscription_status === 'active' && 
                       (!currentProfile.subscription_end_date || new Date(currentProfile.subscription_end_date) > new Date());

  if (currentProfile && !isSubscribed) {
      return <SubscriptionGuard />;
  }

  // 1. جلب الأدمن والرسائل
  useEffect(() => {
    const initChat = async () => {
        if (!currentProfile) return;

        // 👇 محاولة جلب الأدمن
        try {
            const { data: adminData, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1)
                .single();
            
            if (error || !adminData) {
                console.error("Admin not found:", error);
                // لو فشل، ممكن يكون بسبب السياسات، بس الكود SQL اللي فوق هيحلها
            } else {
                setAdminId(adminData.id);
                fetchMessages(currentProfile.id); // نمرر بروفايل العميل
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    initChat();

    const subscription = supabase.channel('public:messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        // تحديث الشات لو الرسالة تخص البروفايل الحالي
        if (newMsg && (newMsg.sender_id === currentProfile?.id || newMsg.receiver_id === currentProfile?.id)) {
             if (currentProfile) fetchMessages(currentProfile.id);
        }
    }).subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [currentProfile]);

  const fetchMessages = async (profileId: string) => {
    const { data } = await supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
        .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
    scrollToBottom();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]);
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioFile = new File([audioBlob], "voice-message.webm", { type: 'audio/webm' });
              setAttachment(audioFile);
          };
          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) { toast.error("لا يمكن الوصول للميكروفون"); }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    
    // 👇 التحقق من وجود الأدمن قبل الإرسال
    if (!adminId) {
        toast.error("جاري الاتصال بالدعم... حاول مرة أخرى بعد ثوانٍ");
        // محاولة أخيرة لجلب الأدمن
        const { data } = await supabase.from('profiles').select('id').eq('role', 'admin').single();
        if (data) setAdminId(data.id);
        else return; // لو مفيش فايدة نوقف
    }

    if ((!newMessage.trim() && !attachment) || !currentProfile) return;

    setUploading(true);
    let attachmentUrl = null;
    let attachmentType = null;

    try {
      if (attachment) {
          const fileExt = attachment.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(fileName, attachment);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);
          attachmentUrl = data.publicUrl;
          if (attachment.type.startsWith('image/')) attachmentType = 'image';
          else if (attachment.type.startsWith('audio/')) attachmentType = 'audio';
          else attachmentType = 'file';
      }

      const { error } = await supabase.from('messages').insert([{
        sender_id: currentProfile.id, // 👈 بنبعت بـ ID البروفايل الحالي
        receiver_id: adminId,         // 👈 بنبعت للأدمن اللي جبناه
        content: attachmentType === 'audio' ? '🎤 رسالة صوتية' : (newMessage || (attachmentType === 'image' ? '📷 صورة' : '📎 ملف')),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        is_read: false
      }]);

      if (error) throw error;
      setNewMessage('');
      setAttachment(null);
      // تحديث فوري
      fetchMessages(currentProfile.id);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("فشل الإرسال: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const renderAttachment = (msg: any) => {
      if (!msg.attachment_url) return null;
      if (msg.attachment_type === 'image') return <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full h-auto mt-2 border border-white/20" />;
      else if (msg.attachment_type === 'audio') return <audio controls src={msg.attachment_url} className="mt-2 w-48 h-8" />;
      else return <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 bg-black/10 p-2 rounded-lg text-xs hover:bg-black/20 transition-colors"><FileText size={16} /> فتح المرفق</a>;
  };

  if (!currentProfile) return <div className="p-10 text-center text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
        <div className="bg-forest/10 p-2 rounded-full text-forest"><User size={24} /></div>
        <div>
          <h3 className="font-bold text-forest">الدعم الطبي (د. هيليكس)</h3>
          <span className="text-xs text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> متاح الآن</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60"><MessageSquare size={48} className="mb-2"/><p>ابدأ المحادثة مع طبيبك الآن</p></div>
        ) : (
            messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentProfile.id;
                return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm relative group ${isMe ? 'bg-forest text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {renderAttachment(msg)}
                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {format(new Date(msg.created_at), 'p', { locale: ar })}
                        {isMe && (msg.is_read ? <CheckCircle size={10} /> : <Check size={10} />)}
                    </div>
                    </div>
                </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        {attachment && (
            <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    {attachment.type.startsWith('image') ? <ImageIcon size={16}/> : attachment.type.startsWith('audio') ? <Mic size={16}/> : <FileText size={16}/>}
                    {attachment.name}
                </div>
                <button onClick={() => setAttachment(null)} className="text-red-500 hover:bg-red-100 rounded-full p-1"><X size={14}/></button>
            </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-forest hover:bg-gray-50 rounded-xl transition-colors" disabled={isRecording}>
            <Paperclip size={20} />
          </button>
          
          {isRecording ? (
             <div className="flex-1 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-red-600 font-bold animate-pulse">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-red-600 rounded-full"></div> جاري التسجيل...</span>
                <span className="text-xs">اضغط للإرسال</span>
             </div>
          ) : (
             <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب استفسارك هنا..." className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest" />
          )}

          {newMessage.trim() || attachment ? (
              <button type="submit" disabled={uploading} className="bg-forest text-white p-3 rounded-xl hover:bg-forest/90 transition-colors">
                 {uploading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
              </button>
          ) : (
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                 {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
              </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Support;