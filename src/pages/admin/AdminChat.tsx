import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Search, MessageSquare, Check, CheckCircle, Info, X, Crown, Baby, Link as LinkIcon, ExternalLink, Paperclip, Mic, StopCircle, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import Avatar from '../../components/Avatar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type ChatUser = {
  id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  unread_count: number;
  last_message_at: string | null;
  last_message_text: string | null;
  manager_id: string | null;
  manager_name?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  gender?: string;
};

const AdminChat: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  
  // Media & Upload States
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsersList = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').neq('role', 'admin');
      if (profilesError || !profiles) return;

      const { data: allMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, is_read, attachment_type')
        .order('created_at', { ascending: false });

      const safeMessages = allMessages || [];

      // 👇 تحسين: إنشاء خريطة (Map) للبروفايلات لسرعة ودقة البحث عن المدير
      const profilesMap = new Map(profiles.map(p => [p.id, p]));

      const usersWithStats = profiles.map(profile => {
        const userMsgs = safeMessages.filter(m => m.sender_id === profile.id || m.receiver_id === profile.id);
        const lastMsg = userMsgs.length > 0 ? userMsgs[0] : null;
        const unreadCount = userMsgs.filter(m => m.sender_id === profile.id && !m.is_read).length;

        // 👇 البحث عن المدير باستخدام الخريطة (دقيق 100%)
        let managerName = undefined;
        if (profile.manager_id) {
            const manager = profilesMap.get(profile.manager_id);
            managerName = manager?.full_name;
        }

        return {
          ...profile,
          full_name: profile.full_name || 'مستخدم بدون اسم',
          unread_count: unreadCount,
          last_message_at: lastMsg ? lastMsg.created_at : null,
          last_message_text: lastMsg ? (lastMsg.attachment_type ? `[${lastMsg.attachment_type}]` : lastMsg.content) : null,
          manager_name: managerName
        };
      });

      const sortedUsers = usersWithStats.sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return timeB - timeA;
      });

      setUsers(sortedUsers);
    } catch (error) { 
      console.error("Error fetching users:", error); 
    }
  };

  useEffect(() => {
    fetchUsersList();
    const subscription = supabase.channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUsersList();
        if (selectedUser) fetchMessages(selectedUser.id);
      }).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [selectedUser]);

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const handleSelectUser = async (user: ChatUser) => {
    setSelectedUser(user);
    setShowProfile(false);
    fetchMessages(user.id);
    if (user.unread_count > 0) {
        await supabase.from('messages').update({ is_read: true }).eq('sender_id', user.id).eq('is_read', false);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, unread_count: 0 } : u));
    }
  };

  // --- Attachments & Recording ---
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setAttachment(e.target.files[0]);
      }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioFile = new File([audioBlob], "voice-message.webm", { type: 'audio/webm' });
              setAttachment(audioFile);
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          toast.error("لا يمكن الوصول للميكروفون");
      }
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
    if ((!newMessage.trim() && !attachment) || !selectedUser) return;

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
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        receiver_id: selectedUser.id,
        content: attachmentType === 'audio' ? '🎤 رسالة صوتية' : (newMessage || (attachmentType === 'image' ? '📷 صورة' : '📎 ملف')),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        is_read: false
      }]);

      if (error) throw error;
      setNewMessage('');
      setAttachment(null);
      fetchMessages(selectedUser.id);
    } catch (error) {
      console.error('Error sending:', error);
      toast.error("فشل الإرسال");
    } finally {
        setUploading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const filteredUsers = users.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  const renderAttachment = (msg: any) => {
      if (!msg.attachment_url) return null;
      if (msg.attachment_type === 'image') {
          return <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full h-auto mt-2 border border-white/20" />;
      } else if (msg.attachment_type === 'audio') {
          return <audio controls src={msg.attachment_url} className="mt-2 w-48 h-8" />;
      } else {
          return (
              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 bg-black/10 p-2 rounded-lg text-xs hover:bg-black/20 transition-colors">
                  <FileText size={16} /> فتح المرفق
              </a>
          );
      }
  };

  return (
    <div className="h-[calc(100vh-100px)] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-l border-gray-100 flex flex-col bg-white z-20 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
            <div className="relative">
                <input type="text" placeholder="بحث باسم العميل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest" />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.length === 0 ? <div className="p-8 text-center text-gray-400">لا يوجد عملاء</div> : filteredUsers.map(user => (
              <div key={user.id} onClick={() => handleSelectUser(user)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 relative ${selectedUser?.id === user.id ? 'bg-forest/5 border-r-4 border-r-forest' : 'border-r-4 border-r-transparent'}`}>
                <div className="relative">
                    <Avatar src={user.avatar_url} name={user.full_name} size="md" />
                    {user.unread_count > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{user.unread_count}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold text-sm truncate flex items-center gap-1 ${user.unread_count > 0 ? 'text-black' : 'text-gray-700'}`}>
                        {user.full_name}
                        {user.manager_id ? <Baby size={14} className="text-blue-400"/> : <Crown size={14} className="text-orange"/>}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                        {user.last_message_at && !isNaN(new Date(user.last_message_at).getTime()) ? format(new Date(user.last_message_at), 'p', { locale: ar }) : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${user.unread_count > 0 ? 'text-forest font-bold' : 'text-gray-400'}`}>{user.last_message_text || 'لا توجد رسائل'}</p>
                </div>
              </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(!showProfile)}>
                <button onClick={(e) => {e.stopPropagation(); setSelectedUser(null);}} className="md:hidden p-2 hover:bg-gray-100 rounded-full"><span className="text-xl">➜</span></button>
                <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size="sm" />
                <div>
                  <h3 className="font-bold text-forest flex items-center gap-2">{selectedUser.full_name}</h3>
                  <span className="text-xs text-green-600">اضغط لعرض الملف</span>
                </div>
              </div>
              <button onClick={() => setShowProfile(!showProfile)} className={`p-2 rounded-xl transition-colors ${showProfile ? 'bg-forest text-white' : 'bg-gray-100'}`}><Info size={20} /></button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id !== selectedUser.id; 
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm relative group ${isMe ? 'bg-forest text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {renderAttachment(msg)}
                      <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                         {msg.created_at && !isNaN(new Date(msg.created_at).getTime()) ? format(new Date(msg.created_at), 'p', { locale: ar }) : ''}
                         {isMe && (msg.is_read ? <CheckCircle size={10} /> : <Check size={10} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
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
                        <span className="text-xs">حرر للإلغاء</span>
                    </div>
                ) : (
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest" />
                )}

                {newMessage.trim() || attachment ? (
                    <button type="submit" disabled={uploading} className="bg-forest text-white p-3 rounded-xl hover:bg-forest/90 transition-colors">
                      {uploading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                    </button>
                ) : (
                    <button 
                        type="button" 
                        onClick={isRecording ? stopRecording : startRecording} 
                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>اختر عميلاً لبدء المحادثة</p>
          </div>
        )}
      </div>

      {/* Profile Side Panel */}
      {selectedUser && showProfile && (
        <div className="w-80 bg-white border-r border-gray-100 animate-in slide-in-from-left duration-300 absolute md:relative z-30 h-full flex flex-col shadow-xl md:shadow-none">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-forest">بيانات العميل</h3>
                <button onClick={() => setShowProfile(false)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg"><X size={20}/></button>
            </div>
            <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gray-50/50">
                <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size="lg" />
                <h2 className="text-lg font-black text-forest mt-3">{selectedUser.full_name}</h2>
                <div className="flex gap-2 mt-2">
                    {selectedUser.manager_id ? <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><Baby size={12}/> تابع</span> : <span className="px-3 py-1 bg-orange/10 text-orange rounded-full text-xs font-bold flex items-center gap-1"><Crown size={12}/> رئيسي</span>}
                </div>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {selectedUser.manager_id && selectedUser.manager_name && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="text-xs text-blue-500 font-bold block mb-2 flex items-center gap-1"><LinkIcon size={12} /> تابع للحساب الرئيسي:</span>
                        <div onClick={() => navigate(`/admin/clients/${selectedUser.manager_id}`)} className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 p-1 rounded-lg transition-colors">
                            <div className="bg-white p-1 rounded-full text-blue-600"><Crown size={14}/></div>
                            <span className="text-sm font-black text-blue-900 underline decoration-blue-300 underline-offset-4">{selectedUser.manager_name}</span>
                        </div>
                    </div>
                )}
                <button onClick={() => navigate(`/admin/clients/${selectedUser.id}`)} className="w-full py-3 bg-forest text-white rounded-xl font-bold text-sm hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-forest/20">
                    <ExternalLink size={18} /> عرض الملف الكامل للعميل
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminChat;