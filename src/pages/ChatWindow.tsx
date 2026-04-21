import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { 
  Send, Check, CheckCircle, Paperclip, Mic, 
  StopCircle, X, Image as ImageIcon, FileText, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  type: 'doctor' | 'admin';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ type }) => {
  const { user } = useAuth();
  const { currentProfile } = useFamily();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. جلب المستلم والاشتراك اللحظي المحمي
  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const initChat = async () => {
      if (!currentProfile) return;
      try {
        const roleToFetch = type === 'admin' ? 'admin' : 'doctor';
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', roleToFetch)
          .limit(1)
          .single();
        
        if (data && isMounted) {
          setReceiverId(data.id);
          fetchMessages(currentProfile.id, data.id);

          // 🧹 إنشاء القناة والاشتراك (محمية بفلتر قوي لمنع التسريب)
          const channelName = `chat_${type}_${currentProfile.id}_${Date.now()}`;
          channel = supabase.channel(channelName)
            .on('postgres_changes', 
              { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                // 🧹 فلترة لاستقبال رسائل هذا المحادثة فقط
                filter: `or(and(sender_id.eq.${currentProfile.id},receiver_id.eq.${data.id}),and(sender_id.eq.${data.id},receiver_id.eq.${currentProfile.id}))`
              }, 
              (payload: any) => {
                // تحديث الرسائل في لحظتها
                if (isMounted) {
                    setMessages(prev => [...prev, payload.new]);
                    scrollToBottom();
                }
              }
            ).subscribe();
        }
      } catch (err) { 
          console.error(err); 
      } finally { 
          if (isMounted) setLoading(false); 
      }
    };

    initChat();

    // 🧹 دالة التنظيف الفورية عند إغلاق الشات
    return () => { 
        isMounted = false;
        if (channel) supabase.removeChannel(channel); 
    };
  }, [currentProfile, type]); // شيلنا receiverId عشان ميعملش Loop

  const fetchMessages = async (profileId: string, rId: string | null) => {
    if (!rId) return;
    const { data } = await supabase.from('messages')
      .select('*')
      .eq('recipient_type', type) 
      .or(`and(sender_id.eq.${profileId},receiver_id.eq.${rId}),and(sender_id.eq.${rId},receiver_id.eq.${profileId})`)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
    scrollToBottom();
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!receiverId || (!newMessage.trim() && !attachment) || !currentProfile) return;

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
        attachmentType = attachment.type.startsWith('image/') ? 'image' : attachment.type.startsWith('audio/') ? 'audio' : 'file';
      }

      const { error } = await supabase.from('messages').insert([{
        sender_id: currentProfile.id,
        receiver_id: receiverId,
        content: attachmentType === 'audio' ? '🎤 رسالة صوتية' : (newMessage || (attachmentType === 'image' ? '📷 صورة' : '📎 ملف')),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        recipient_type: type, 
        is_read: false
      }]);

      if (error) throw error;

      if (type === 'doctor') {
        await supabase.from('profiles').update({ chat_status_with_doctor: 'active' }).eq('id', currentProfile.id);
      }

      setNewMessage('');
      setAttachment(null);
      
      // مش محتاجين نعمل fetchMessages لأن הـ Realtime (payload.new) هيضيفها لوحده سريعاً
      // fetchMessages(currentProfile.id, receiverId); 
      
    } catch (error: any) {
      toast.error("فشل الإرسال");
    } finally { setUploading(false); }
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

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-forest" /></div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentProfile?.id;
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-forest text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.attachment_url && (
                   <div className="mt-2">
                     {msg.attachment_type === 'image' ? <img src={msg.attachment_url} className="rounded-lg max-w-full" /> : 
                      msg.attachment_type === 'audio' ? <audio controls src={msg.attachment_url} className="w-48 h-8" /> : 
                      <a href={msg.attachment_url} target="_blank" className="flex items-center gap-2 underline font-bold"><FileText size={14}/> تحميل المرفق</a>}
                   </div>
                )}
                <div className={`text-[10px] mt-1 flex justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {format(new Date(msg.created_at), 'p', { locale: ar })}
                  {isMe && (msg.is_read ? <CheckCircle size={10} /> : <Check size={10} />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        {attachment && (
            <div className="mb-2 p-2 bg-gray-100 rounded-xl flex items-center justify-between text-xs font-bold border border-gray-200">
                <span className="flex items-center gap-2">
                  {attachment.type.startsWith('image') ? <ImageIcon size={14} className="text-forest"/> : attachment.type.startsWith('audio') ? <Mic size={14} className="text-blue-500"/> : <FileText size={14} className="text-gray-500"/>}
                  {attachment.name}
                </span>
                <button onClick={() => setAttachment(null)} className="text-red-500 bg-red-50 p-1 rounded-full hover:bg-red-100 transition-colors"><X size={14}/></button>
            </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setAttachment(e.target.files[0])} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-50 text-gray-400 hover:text-forest hover:bg-forest/5 rounded-xl transition-all border border-transparent hover:border-forest/20">
            <Paperclip size={20} />
          </button>
          
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="اكتب رسالتك..." 
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest focus:bg-white transition-all shadow-inner" 
            disabled={isRecording}
          />

          <button 
            type="button" 
            onClick={isRecording ? stopRecording : startRecording} 
            className={`p-3 rounded-xl transition-all border ${isRecording ? 'bg-red-50 border-red-500 text-red-500 animate-pulse' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>

          {(newMessage.trim() || attachment) && (
            <button type="submit" disabled={uploading} className="bg-forest text-white p-3 rounded-xl hover:bg-forest/90 transition-colors shadow-lg shadow-forest/20 active:scale-95">
              {uploading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;