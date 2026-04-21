import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext'; 
import { 
  Send, User, Loader2, CheckCheck, Archive, 
  MessageSquare, Inbox, Users, History, Search, Clock, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import type { Profile, Message } from '../../types';

interface ChatClient extends Profile {
  unread_count: number;
  last_message_at: string | null;
  last_message_text: string | null;
}

const DoctorChat: React.FC = () => {
  const { user } = useAuth();
  const [activeListTab, setActiveListTab] = useState<'active' | 'archived' | 'all'>('active');
  const [clients, setClients] = useState<ChatClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ChatClient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isUpdatingStatus = useRef(false);

  // 1. جلب القائمة
  const fetchClients = useCallback(async () => {
    if (!user || isUpdatingStatus.current) return;
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*').eq('role', 'client');
      if (activeListTab === 'active') query = query.eq('chat_status_with_doctor', 'active');
      else if (activeListTab === 'archived') query = query.eq('chat_status_with_doctor', 'archived');
      
      const { data: profiles } = await query;
      if (!profiles) return;

      // This is a much more efficient way to process messages without N*M complexity.
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_type', 'doctor')
        .order('created_at', { ascending: false });

      const messagesByClientId = new Map<string, Message[]>();
      if (allMsgs) {
        for (const msg of allMsgs) {
          // Associate message with the client, whether they are sender or receiver
          const clientId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (!messagesByClientId.has(clientId)) {
            messagesByClientId.set(clientId, []);
          }
          messagesByClientId.get(clientId)!.push(msg);
        }
      }

      const formatted = profiles.map(p => {
        const userMsgs = messagesByClientId.get(p.id) || [];
        const unreadCount = userMsgs.filter(m => m.sender_id === p.id && m.receiver_id === user.id && !m.is_read).length;
        return { ...p, unread_count: unreadCount, last_message_at: userMsgs[0]?.created_at, last_message_text: userMsgs[0]?.content };
      });
      
      setClients(formatted.sort((a, b) => (b.unread_count - a.unread_count) || (new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user, activeListTab]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // 2. دالة Seen
  const markAsRead = async (clientId: string) => {
    if (!user || !clientId) return;
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, unread_count: 0 } : c));
    await supabase.from('messages').update({ is_read: true }).match({ sender_id: clientId, receiver_id: user.id, recipient_type: 'doctor', is_read: false });
  };

  // 3. الأرشفة (المحسنة جداً)
  const toggleArchive = async (clientId: string, currentStatus: string) => {
    if (isUpdatingStatus.current) return;
    isUpdatingStatus.current = true;

    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    
    // إخفاء فوري
    setClients(prev => prev.filter(c => activeListTab === 'all' ? true : c.id !== clientId));
    setSelectedClient(null);

    const { error } = await supabase.from('profiles').update({ chat_status_with_doctor: newStatus }).eq('id', clientId);

    if (error) {
      toast.error("فشل التحديث");
      fetchClients();
    } else {
      toast.success(newStatus === 'archived' ? 'تمت الأرشفة' : 'تم التنشيط');
    }
    
    setTimeout(() => { isUpdatingStatus.current = false; }, 1000);
  };

  // 4. الـ Real-time (السر هنا)
// استبدل الـ useEffect رقم 4 الخاص بالـ Real-time بهذا الكود

  // 4. الـ Real-time (إصلاح تسريب الذاكرة)
  useEffect(() => {
    if (!selectedClient?.id || !user?.id) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null; // 🧹 مرجع للقناة

    const fetchInitialMessages = async () => {
      setMessages([]);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedClient.id}),and(sender_id.eq.${selectedClient.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (isMounted) {
        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('فشل تحميل الرسائل');
        } else {
          setMessages(data || []);
        }
      }
    };

    fetchInitialMessages();
    markAsRead(selectedClient.id);

    // 🧹 إنشاء قناة اتصال باسم فريد للعميل ده بالذات عشان نسمع رسايله هو بس!
    channel = supabase.channel(`doc_realtime_${selectedClient.id}_${Date.now()}`)
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            // 🧹 الأهم: فلتر الـ Realtime عشان متجيش رسايل من عملاء تانيين وتعمل Load
            filter: `or(and(sender_id.eq.${selectedClient.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${selectedClient.id}))`
          }, 
          async (payload) => {
        const newMsg = payload.new as Message;

        if (newMsg.recipient_type === 'doctor') {
            setMessages(prev => [...prev, newMsg]);
            
            if (newMsg.sender_id === selectedClient.id) {
                markAsRead(selectedClient.id);
            }

            if (newMsg.sender_id !== user.id) {
                await supabase.from('profiles').update({ chat_status_with_doctor: 'active' }).eq('id', newMsg.sender_id);
                setClients(prevClients => {
                  const clientIndex = prevClients.findIndex(c => c.id === newMsg.sender_id);
                  if (clientIndex === -1) {
                    fetchClients();
                    return prevClients;
                  }
                  const newClients = [...prevClients];
                  newClients[clientIndex] = {
                      ...newClients[clientIndex],
                      last_message_text: newMsg.content,
                      last_message_at: newMsg.created_at,
                      unread_count: 0, // إحنا فاتحين الشات ده فخلاص مقرية
                      chat_status_with_doctor: 'active'
                  };
                  return newClients.sort((a, b) => (b.unread_count - a.unread_count) || (new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()));
                });
            } else {
                setClients(prev => prev.map(c => 
                    c.id === selectedClient.id ? { ...c, last_message_text: newMsg.content, last_message_at: newMsg.created_at } : c
                ));
            }
        }
      })
      .subscribe();

    // 🧹 دالة التنظيف الصارمة
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [selectedClient?.id, user?.id, fetchClients]);
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient || !user) return;
    const content = newMessage.trim();
    setNewMessage(''); 
    await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: selectedClient.id, content: content, recipient_type: 'doctor', related_doctor_id: user.id, is_read: false
    });
  };

  const filteredClients = clients.filter(c => c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden font-tajawal text-right">
      <div className="w-96 border-l border-slate-50 flex flex-col bg-slate-50/30">
        <div className="p-6 space-y-4 bg-white border-b border-slate-50">
          <div className="flex justify-between items-center w-full">
             <h2 className="font-black text-slate-800 text-xl tracking-tight">محادثات الأبطال</h2>
             <div className="bg-forest/10 p-2 rounded-xl text-forest"><MessageSquare size={20}/></div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <TabButton active={activeListTab === 'active'} onClick={() => setActiveListTab('active')} label="النشطة" icon={<Inbox size={14}/>} color="bg-forest" />
            <TabButton active={activeListTab === 'all'} onClick={() => setActiveListTab('all')} label="الكل" icon={<Users size={14}/>} color="bg-slate-700" />
            <TabButton active={activeListTab === 'archived'} onClick={() => setActiveListTab('archived')} label="الأرشيف" icon={<History size={14}/>} color="bg-orange" />
          </div>
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="ابحث عن بطل..." className="w-full pr-12 pl-4 py-3 bg-slate-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-forest/10 focus:bg-white transition-all shadow-inner text-right" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loading && clients.length === 0 ? <div className="p-10 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-forest mb-2" /></div> : filteredClients.map((client) => (
            <div key={client.id} onClick={() => setSelectedClient(client)} className={`p-4 flex items-center gap-4 rounded-[2rem] cursor-pointer transition-all relative ${selectedClient?.id === client.id ? 'bg-white shadow-lg border-r-4 border-forest' : 'hover:bg-white/60'}`}>
              <div className="relative shrink-0">
                <Avatar src={client.avatar_url} name={client.full_name} size="md" />
                {client.unread_count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{client.unread_count}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-slate-800 text-sm truncate">{client.full_name}</h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{client.last_message_at ? format(new Date(client.last_message_at), 'p', { locale: ar }) : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[11px] truncate flex-1 ${client.unread_count > 0 ? 'text-forest font-black' : 'text-slate-400 font-bold'}`}>{client.last_message_text || 'ابدأ المحادثة الآن'}</p>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ml-2 ${client.chat_status_with_doctor === 'active' ? 'bg-forest/10 text-forest' : 'bg-slate-200 text-slate-500'}`}>{client.chat_status_with_doctor === 'active' ? 'نشط' : 'مؤرشف'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {selectedClient ? (
          <>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-4 text-right">
                  <Avatar src={selectedClient.avatar_url} name={selectedClient.full_name} size="sm" />
                  <div>
                    <h3 className="font-black text-slate-800 text-base leading-tight">{selectedClient.full_name}</h3>
                    <span className="text-[10px] font-bold text-slate-400">متابعة طبية مباشرة</span>
                  </div>
               </div>
               <button onClick={() => toggleArchive(selectedClient.id, selectedClient.chat_status_with_doctor ?? '')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs ${selectedClient.chat_status_with_doctor === 'active' ? 'bg-slate-100 text-slate-500' : 'bg-forest text-white'}`}>
                 <Archive size={16} /> {selectedClient.chat_status_with_doctor === 'active' ? 'نقل للأرشيف' : 'تنشيط البطل'}
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${msg.sender_id === user?.id ? 'bg-forest text-white rounded-br-none shadow-forest/10' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100 text-right'}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-[9px] mt-2 opacity-50 flex items-center gap-1 ${msg.sender_id === user?.id ? 'justify-start' : 'justify-end'}`}>
                        {format(new Date(msg.created_at), 'p', { locale: ar })}
                        {msg.sender_id === user?.id && (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-slate-50 flex gap-4">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب ردك الطبي هنا..." className="flex-1 bg-slate-50 border-2 border-transparent rounded-[1.8rem] px-8 py-4 text-sm font-black outline-none focus:border-forest/20 focus:bg-white transition-all text-right" />
              <button className="bg-forest text-white p-5 rounded-2xl shadow-xl active:scale-95 transition-transform"><Send size={24} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <MessageSquare size={80} className="text-slate-200" />
            <p className="font-black mt-4 text-lg">اختر بطلاً لمتابعته</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatAvatar = ({ src, name, size }: { src?: string | null; name?: string | null; size: 'sm' | 'md' }) => (
    <div className={`${size === 'md' ? 'w-14 h-14' : 'w-12 h-12'} rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm`}>
        {src ? <img src={src} loading="lazy" className="w-full h-full object-cover" /> : <span className="text-slate-400 font-black">{name?.[0] ?? '?'}</span>}
    </div>
);

const TabButton = ({ active, onClick, icon, label, color }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string }) => (
  <button onClick={onClick} className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${active ? `${color} text-white shadow-lg` : 'text-slate-400 hover:bg-white'}`}>
    {icon} <span className="text-[9px] font-black">{label}</span>
  </button>
);

export default DoctorChat;