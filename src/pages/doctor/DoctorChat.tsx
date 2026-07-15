import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Send, Loader2, CheckCheck, Check, MessageSquare,
  Paperclip, Mic, StopCircle, FileText, Image as ImageIcon,
  ShieldCheck, X, Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import InquiryList, { type InquiryWithClient } from '../../components/InquiryList';
import InquiryHeader from '../../components/InquiryHeader';
import ProfileSidebar from '../../components/ProfileSidebar';
import type { InquiryStatus, ThreadedMessage } from '../../types';

const DoctorChat: React.FC = () => {
  const { user } = useAuth();
  const [activeListTab, setActiveListTab] = useState<'active' | 'archived' | 'all'>('active');
  const [inquiries, setInquiries] = useState<InquiryWithClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithClient | null>(null);
  const [messages, setMessages] = useState<ThreadedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  // Attachments
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Inquiries ──────────────────────────────────────
  const fetchInquiries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Build inquiry query based on tab
      let query = supabase
        .from('inquiries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (activeListTab === 'active') {
        query = query.in('status', ['open', 'under_review', 'replied']);
      } else if (activeListTab === 'archived') {
        query = query.eq('status', 'closed');
      }

      const { data: rawInquiries } = await query;
      if (!rawInquiries) { setInquiries([]); return; }

      // Fetch client profiles for all inquiry user_ids
      const userIds = [...new Set(rawInquiries.map(i => i.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Fetch all doctor messages for unread counts and last message
      const inquiryIds = rawInquiries.map(i => i.id);
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('inquiry_id, sender_id, content, created_at, is_read, attachment_type')
        .in('inquiry_id', inquiryIds)
        .eq('recipient_type', 'doctor')
        .order('created_at', { ascending: false });

      const msgsByInquiry = new Map<string, any[]>();
      if (allMsgs) {
        for (const msg of allMsgs) {
          if (!msg.inquiry_id) continue;
          if (!msgsByInquiry.has(msg.inquiry_id)) msgsByInquiry.set(msg.inquiry_id, []);
          msgsByInquiry.get(msg.inquiry_id)!.push(msg);
        }
      }

      const enriched: InquiryWithClient[] = rawInquiries.map(inq => {
        const profile = profileMap.get(inq.user_id);
        const msgs = msgsByInquiry.get(inq.id) || [];
        const lastMsg = msgs[0] || null;
        const unreadCount = msgs.filter((m: any) => m.sender_id !== user.id && !m.is_read).length;

        return {
          ...inq,
          client_name: profile?.full_name || 'مستخدم بدون اسم',
          client_avatar: profile?.avatar_url || null,
          unread_count: unreadCount,
          last_message_text: lastMsg ? (lastMsg.attachment_type ? `[${lastMsg.attachment_type}]` : lastMsg.content) : null,
          last_message_at: lastMsg?.created_at || inq.updated_at,
        };
      });

      // Sort: unread first, then by last message time
      enriched.sort((a, b) => (b.unread_count - a.unread_count) || (new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()));

      setInquiries(enriched);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeListTab]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  // ─── Fetch Messages for Selected Inquiry ──────────────────
  useEffect(() => {
    if (!selectedInquiry?.id || !user?.id) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchMessages = async () => {
      setMessages([]);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('inquiry_id', selectedInquiry.id)
        .eq('recipient_type', 'doctor')
        .order('created_at', { ascending: true });

      if (isMounted) setMessages((data as ThreadedMessage[]) || []);

      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('inquiry_id', selectedInquiry.id)
        .eq('recipient_type', 'doctor')
        .neq('sender_id', user.id)
        .eq('is_read', false);

      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? { ...i, unread_count: 0 } : i));
    };

    fetchMessages();

    // Realtime subscription for this inquiry
    channel = supabase.channel(`doc_inquiry_${selectedInquiry.id}_${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `inquiry_id=eq.${selectedInquiry.id}`,
      }, async (payload) => {
        const newMsg = payload.new as ThreadedMessage;
        if (newMsg.recipient_type === 'doctor') {
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_id !== user.id) {
            await supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
          }
          setInquiries(prev => prev.map(i =>
            i.id === selectedInquiry.id
              ? { ...i, last_message_text: newMsg.content, last_message_at: newMsg.created_at, unread_count: 0 }
              : i
          ));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedInquiry?.id, user?.id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Attachment Handling ───────────────────────────────────
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
        setAttachment(new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' }));
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { toast.error('لا يمكن الوصول للميكروفون'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleViewAttachment = async (pathOrUrl: string) => {
    if (!pathOrUrl) return;
    const tid = toast.loading('جاري تحميل المرفق...');
    try {
      if (pathOrUrl.startsWith('http')) { toast.dismiss(tid); window.open(pathOrUrl, '_blank'); return; }
      const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(pathOrUrl, 3600);
      if (error || !data) throw new Error('لا يمكن الوصول للملف المحمي');
      toast.dismiss(tid);
      window.open(data.signedUrl, '_blank');
    } catch (err: any) { toast.error(err.message, { id: tid }); }
  };

  // 🎵 تشغيل الصوت داخل المحادثة بدلاً من فتح تاب جديد
  const handlePlayAudio = async (msgId: string, pathOrUrl: string) => {
    if (!pathOrUrl) return;
    if (audioUrls[msgId]) return;
    setLoadingAudio(prev => ({ ...prev, [msgId]: true }));
    try {
      if (pathOrUrl.startsWith('http')) {
        setAudioUrls(prev => ({ ...prev, [msgId]: pathOrUrl }));
        return;
      }
      const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(pathOrUrl, 3600);
      if (error || !data) throw new Error('لا يمكن الوصول للملف الصوتي');
      setAudioUrls(prev => ({ ...prev, [msgId]: data.signedUrl }));
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingAudio(prev => ({ ...prev, [msgId]: false })); }
  };

  // ─── Send Message ─────────────────────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedInquiry || !user) return;

    setUploading(true);
    let attachmentPath = null;
    let attachmentType = null;

    try {
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const filePath = `doctor_${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachment);
        if (uploadError) throw uploadError;
        attachmentPath = filePath;
        if (attachment.type.startsWith('image/')) attachmentType = 'image';
        else if (attachment.type.startsWith('audio/')) attachmentType = 'audio';
        else attachmentType = 'file';
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedInquiry.user_id,
        content: attachmentType === 'audio' ? '🎤 رسالة صوتية' : (newMessage || (attachmentType === 'image' ? '📷 صورة' : '📎 ملف')),
        attachment_url: attachmentPath,
        attachment_type: attachmentType,
        recipient_type: 'doctor',
        inquiry_id: selectedInquiry.id,
        related_doctor_id: user.id,
        is_read: false,
      });

      if (error) throw error;

      // Update inquiry status to 'replied' if it was 'open' or 'under_review'
      if (selectedInquiry.status === 'open' || selectedInquiry.status === 'under_review') {
        await supabase.from('inquiries').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', selectedInquiry.id);
        handleStatusChange('replied');
      }

      setNewMessage('');
      setAttachment(null);
    } catch {
      toast.error('فشل الإرسال');
    } finally {
      setUploading(false);
    }
  };

  // ─── Inquiry Status Change ────────────────────────────────
  const handleStatusChange = (newStatus: InquiryStatus) => {
    setInquiries(prev => prev.map(i => i.id === selectedInquiry?.id ? { ...i, status: newStatus } : i));
    if (selectedInquiry) setSelectedInquiry({ ...selectedInquiry, status: newStatus });
  };

  const handleSelectInquiry = (inquiry: InquiryWithClient) => {
    setSelectedInquiry(inquiry);
    setShowProfile(false);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden font-tajawal text-right">
      {/* Inquiry Sidebar */}
      <InquiryList
        inquiries={inquiries}
        selectedInquiryId={selectedInquiry?.id || null}
        onSelectInquiry={handleSelectInquiry}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeListTab}
        onTabChange={setActiveListTab}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedInquiry ? (
          <>
            <InquiryHeader
              inquiry={selectedInquiry}
              onStatusChange={handleStatusChange}
              onToggleProfile={() => setShowProfile(!showProfile)}
              showProfile={showProfile}
            />

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${isMe ? 'bg-forest text-white rounded-br-none shadow-forest/10' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100 text-right'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {msg.attachment_url && (
                        <div className="mt-3">
                          {msg.attachment_type === 'audio' ? (
                            <div className="space-y-2">
                              {audioUrls[msg.id] ? (
                                <audio controls controlsList="nodownload" className="w-full max-w-[280px] h-10 rounded-lg" style={{ filter: isMe ? 'invert(1) brightness(2) hue-rotate(180deg)' : 'none' }}>
                                  <source src={audioUrls[msg.id]} />
                                </audio>
                              ) : (
                                <button
                                  onClick={() => handlePlayAudio(msg.id, msg.attachment_url!)}
                                  disabled={loadingAudio[msg.id]}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 hover:bg-gray-200 text-forest'}`}
                                >
                                  {loadingAudio[msg.id] ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                                  🎤 تشغيل التسجيل الصوتي
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleViewAttachment(msg.attachment_url!)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 hover:bg-gray-200 text-forest'}`}
                            >
                              {msg.attachment_type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                              فتح المرفق الآمن <ShieldCheck size={14} />
                            </button>
                          )}
                        </div>
                      )}

                      <div className={`text-[9px] mt-2 opacity-50 flex items-center gap-1 ${isMe ? 'justify-start' : 'justify-end'}`}>
                        {format(new Date(msg.created_at), 'p', { locale: ar })}
                        {isMe && (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-50">
              {attachment && (
                <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    {attachment.type.startsWith('image') ? <ImageIcon size={16} /> : attachment.type.startsWith('audio') ? <Mic size={16} /> : <FileText size={16} />}
                    {attachment.name}
                  </div>
                  <button onClick={() => setAttachment(null)} className="text-red-500 hover:bg-red-100 rounded-full p-1"><X size={14} /></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-forest hover:bg-gray-50 rounded-xl" disabled={isRecording}>
                  <Paperclip size={20} />
                </button>
                <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-forest hover:bg-gray-50'}`}>
                  {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                </button>
                {isRecording ? (
                  <div className="flex-1 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 font-bold animate-pulse">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-red-600 rounded-full" /> جاري التسجيل...</span>
                  </div>
                ) : (
                  <input
                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب ردك الطبي هنا..."
                    className="flex-1 bg-slate-50 border-2 border-transparent rounded-[1.8rem] px-8 py-4 text-sm font-black outline-none focus:border-forest/20 focus:bg-white transition-all text-right"
                  />
                )}
                <button type="submit" disabled={uploading} className="bg-forest text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-transform">
                  {uploading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <MessageSquare size={80} className="text-slate-200" />
            <p className="font-black mt-4 text-lg">اختر استفساراً لمتابعته</p>
          </div>
        )}
      </div>

      {/* Profile Sidebar */}
      {selectedInquiry && showProfile && (
        <ProfileSidebar
          userId={selectedInquiry.user_id}
          userName={selectedInquiry.client_name}
          userAvatar={selectedInquiry.client_avatar}
          onClose={() => setShowProfile(false)}
          detailsLink={`/doctor-dashboard/client/${selectedInquiry.user_id}`}
        />
      )}
    </div>
  );
};

export default DoctorChat;