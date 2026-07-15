import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, X, Send, Paperclip, Loader2, 
  User, Phone, Mail, FileText, CheckCircle, Check, AlertCircle, ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Conversation {
  id: string;
  visitor_token: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email?: string;
  visitor_subject?: string;
  status: 'waiting' | 'assigned' | 'in_progress' | 'closed';
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  sender_type: 'customer' | 'visitor' | 'support_agent' | 'system';
  created_at: string;
}

const QUICK_REPLIES = [
  { id: 'pricing', label: '💰 أسعار الاشتراك' },
  { id: 'diets', label: '🥗 الأنظمة الغذائية' },
  { id: 'events', label: '📅 الفعاليات' },
  { id: 'app', label: '📱 التطبيق' },
  { id: 'other', label: '❓ سؤال آخر' }
];

const VisitorChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for existing conversation session
    const storedToken = localStorage.getItem('healix_visitor_token');
    const storedConvId = localStorage.getItem('healix_visitor_conv_id');

    if (storedToken && storedConvId) {
      loadExistingConversation(storedToken, storedConvId);
    }
  }, []);

  const loadExistingConversation = async (token: string, convId: string) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .eq('visitor_token', token)
        .maybeSingle();

      if (error || !data) {
        // Clear stale session
        localStorage.removeItem('healix_visitor_token');
        localStorage.removeItem('healix_visitor_conv_id');
        setShowForm(true);
        return;
      }

      setConversation(data as Conversation);
      setShowForm(false);
      await fetchMessages((data as any).id);
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      scrollToBottom();
    }
  };

  // Realtime subscription useEffect
  useEffect(() => {
    if (!conversation?.id) return;

    const convId = conversation.id;
    const channel = supabase.channel(`visitor_chat_${convId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${convId}`
        }, 
        (payload: any) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          scrollToBottom();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${convId}`
        },
        (payload: any) => {
          setConversation(prev => prev ? { ...prev, status: payload.new.status } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const visitorToken = crypto.randomUUID();

      // 1. Create Visitor Conversation row
      const { data: convData, error: convError } = await (supabase as any)
        .from('conversations')
        .insert([{
          conversation_type: 'website_visitor',
          owner_type: 'visitor',
          visitor_token: visitorToken,
          visitor_name: name,
          visitor_phone: phone,
          visitor_email: email || null,
          visitor_subject: subject || null,
          landing_page_url: window.location.href,
          status: 'waiting'
        }])
        .select()
        .single();

      if (convError || !convData) throw convError;

      localStorage.setItem('healix_visitor_token', visitorToken);
      localStorage.setItem('healix_visitor_conv_id', (convData as any).id);
      setConversation(convData as Conversation);

      // 2. Insert Automatic Welcome Message
      const welcomeContent = `👋 أهلاً بك في Healix\nيسعدنا مساعدتك.\nيمكنك الاستفسار عن:\n• الاشتراكات\n• الأنظمة الغذائية\n• التطبيق\n• الفعاليات\n• أي سؤال آخر\nسيقوم أحد أفراد خدمة العملاء بالرد عليك خلال دقائق.`;
      
      const { error: msgError } = await (supabase as any)
        .from('messages')
        .insert([{
          conversation_id: (convData as any).id,
          content: welcomeContent,
          sender_type: 'system',
          recipient_type: 'admin'
        }]);

      if (msgError) throw msgError;

      setShowForm(false);
      await fetchMessages((convData as any).id);
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء بدء المحادثة، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string, isSystemQuickReply = false) => {
    if (!conversation) return;
    if (!text.trim() && !attachment) return;

    setUploading(true);
    let attachmentPath = null;
    let attachmentType = null;

    try {
      if (attachment) {
        // Upload via Edge Function
        const formData = new FormData();
        formData.append('file', attachment);
        formData.append('conversation_id', conversation.id);
        formData.append('visitor_token', conversation.visitor_token);

        const { data, error } = await supabase.functions.invoke('upload-visitor-attachment', {
          body: formData
        });

        if (error || !data || !data.filePath) {
          throw new Error(error?.message || 'فشل تحميل الملف المرفق');
        }

        attachmentPath = data.filePath;
        attachmentType = attachment.type.startsWith('image/') ? 'image' : attachment.type.startsWith('audio/') ? 'audio' : 'file';
      }

      const { error } = await (supabase as any)
        .from('messages')
        .insert([{
          conversation_id: conversation.id,
          content: attachmentType ? (attachmentType === 'image' ? '📷 صورة مرفقة' : '📎 ملف مرفق') : text,
          attachment_url: attachmentPath,
          attachment_type: attachmentType,
          sender_type: isSystemQuickReply ? 'system' : 'visitor',
          recipient_type: 'admin'
        }]);

      if (error) throw error;

      setNewMessage('');
      setAttachment(null);
      // Immediately fetch messages after sending to update the chat UI without waiting for realtime
      await fetchMessages(conversation.id);
    } catch (err: any) {
      toast.error(err.message || 'فشل إرسال الرسالة');
    } finally {
      setUploading(false);
    }
  };

  const handleQuickReply = (label: string) => {
    handleSendMessage(label);
  };

  const startNewConversation = () => {
    localStorage.removeItem('healix_visitor_token');
    localStorage.removeItem('healix_visitor_conv_id');
    setConversation(null);
    setMessages([]);
    setShowForm(true);
  };

  const handleViewAttachment = async (pathOrUrl: string) => {
    if (!pathOrUrl) return;
    const loadToast = toast.loading('جاري تحميل المرفق...');
    try {
      if (pathOrUrl.startsWith('http')) {
        toast.dismiss(loadToast);
        window.open(pathOrUrl, '_blank');
        return;
      }
      const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(pathOrUrl, 3600);
      if (error || !data) throw new Error("لا يمكن فتح المرفق المحمي");
      toast.dismiss(loadToast);
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast.error(err.message, { id: loadToast });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 font-thmanyah">
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => { setIsOpen(true); scrollToBottom(); }}
          className="group bg-forest text-white h-14 w-14 hover:w-48 rounded-full flex items-center justify-center gap-0 hover:gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-sage/20 hover:bg-orange overflow-hidden"
        >
          <div className="flex-shrink-0 flex items-center justify-center">
            <MessageSquare size={22} />
          </div>
          <span className="text-[11px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[130px] transition-all duration-200 ease-out overflow-hidden leading-none select-none">
            تحدث مع خدمة العملاء
          </span>
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="bg-white w-[360px] md:w-[400px] h-[550px] rounded-[2.5rem] shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="bg-forest text-white p-6 flex justify-between items-center relative">
            <div>
              <h3 className="font-black text-sm">خدمة العملاء Healix</h3>
              <p className="text-[10px] text-sage/80 mt-0.5">يسعدنا الرد على جميع استفساراتك</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Modal (Initial setup) */}
          {showForm ? (
            <form onSubmit={handleStartConversation} className="flex-1 p-6 flex flex-col justify-between overflow-y-auto bg-gray-50/50">
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-bold leading-relaxed text-center mb-2">
                  يرجى تزويدنا ببياناتك الأساسية لبدء المحادثة مع الدعم الفني
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-bold block">الاسم الكامل <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="أدخل اسمك" 
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-forest"
                    />
                    <User size={14} className="absolute right-3.5 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-bold block">رقم الجوال <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      required 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="05xxxxxxxx" 
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-forest text-right"
                    />
                    <Phone size={14} className="absolute right-3.5 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-bold block">البريد الإلكتروني (اختياري)</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="name@example.com" 
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-forest"
                    />
                    <Mail size={14} className="absolute right-3.5 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-bold block">موضوع الاستفسار (اختياري)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)} 
                      placeholder="عن ماذا تود الاستفسار؟" 
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-forest"
                    />
                    <FileText size={14} className="absolute right-3.5 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-forest text-white py-3.5 rounded-2xl font-black text-xs hover:bg-orange transition-all duration-300 mt-6 flex items-center justify-center gap-2 shadow-lg shadow-forest/15"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'ابدأ المحادثة'}
              </button>
            </form>
          ) : (
            // Live Chat View
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_type === 'visitor';
                  const isSystem = msg.sender_type === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex flex-col items-center space-y-3 my-2">
                        <div className="max-w-[90%] bg-emerald-50 text-gray-800 p-4 rounded-2xl border border-emerald-100 text-xs font-bold leading-relaxed text-center shadow-sm">
                          {msg.content}
                        </div>
                        {/* Render Quick Replies under System Welcome message */}
                        {idx === 0 && conversation?.status !== 'closed' && (
                          <div className="flex flex-wrap gap-2 justify-center py-1">
                            {QUICK_REPLIES.map(reply => (
                              <button 
                                key={reply.id}
                                onClick={() => handleQuickReply(reply.label)}
                                className="bg-white hover:bg-forest/5 text-forest border border-forest/15 hover:border-forest/30 px-3 py-1.5 rounded-full text-[10px] font-black transition-all shadow-sm active:scale-95"
                              >
                                {reply.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3.5 rounded-2xl shadow-sm text-xs relative leading-relaxed ${isMe ? 'bg-forest text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Attachments */}
                        {msg.attachment_url && (
                          <div className="mt-2.5">
                            <button 
                              onClick={() => handleViewAttachment(msg.attachment_url!)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 hover:bg-gray-200 text-forest'}`}
                            >
                              {msg.attachment_type === 'image' ? <ImageIcon size={12}/> : <FileText size={12}/>}
                              فتح المرفق
                            </button>
                          </div>
                        )}

                        <div className={`text-[8px] mt-1.5 flex justify-end gap-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                          {format(new Date(msg.created_at), 'p', { locale: ar })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview Area */}
              {attachment && (
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} className="text-forest"/> {attachment.name}
                  </span>
                  <button onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-600 bg-red-50 p-1 rounded-full">
                    <X size={12}/>
                  </button>
                </div>
              )}

              {/* Locked/Closed State or Input Form */}
              {conversation?.status === 'closed' ? (
                <div className="p-6 bg-white border-t border-gray-100 text-center space-y-3.5">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs font-black">
                    <AlertCircle size={16} /> تم إغلاق هذه المحادثة.
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold leading-normal px-6">
                    إذا كنت تحتاج إلى مساعدة أخرى، يمكنك بدء محادثة جديدة.
                  </p>
                  <button 
                    onClick={startNewConversation}
                    className="w-full bg-forest text-white py-3 rounded-2xl font-black text-xs hover:bg-orange transition-all duration-300 shadow-md"
                  >
                    ابدأ محادثة جديدة
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(newMessage); }}
                  className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={e => e.target.files && setAttachment(e.target.files[0])} 
                    className="hidden" 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-gray-50 text-gray-400 hover:text-forest hover:bg-forest/5 rounded-xl transition-all border border-gray-100"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..." 
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-forest"
                  />
                  {(newMessage.trim() || attachment) && (
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="bg-forest text-white p-2.5 rounded-xl hover:bg-forest/90 transition-colors shadow-md"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitorChatWidget;
