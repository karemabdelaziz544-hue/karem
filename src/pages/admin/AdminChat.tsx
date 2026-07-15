import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Send, Search, MessageSquare, Check, CheckCircle, X, Crown, Baby,
  Paperclip, Mic, StopCircle, FileText, Image as ImageIcon,
  Loader2, Headset, Stethoscope, ShieldCheck, Play, Pause, Volume2,
  Globe, Users
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import InquiryList, { CATEGORY_MAP, STATUS_MAP, type InquiryWithClient } from '../../components/InquiryList';
import InquiryHeader from '../../components/InquiryHeader';
import ProfileSidebar from '../../components/ProfileSidebar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { Profile, Message, InquiryStatus, ThreadedMessage } from '../../types';

// ─── Customer Chat Item (flat messages approach) ────────────────────────
interface CustomerChatItem {
  kind: 'customer';
  id: string;            // profile id
  full_name: string;
  avatar_url: string | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_text: string | null;
}

// ─── Visitor Conversation Item (conversations table approach) ────────────
interface VisitorConvItem {
  kind: 'visitor';
  id: string;            // conversation id
  visitor_token: string | null;
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  visitor_subject: string | null;
  landing_page_url: string | null;
  status: 'waiting' | 'assigned' | 'in_progress' | 'closed';
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  unread_count: number;
  last_message_at: string | null;
  last_message_text: string | null;
}

type SidebarItem = CustomerChatItem | VisitorConvItem;

const AdminChat: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'admin' | 'doctor'>('admin');

  // ── Admin mode state ──
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SidebarItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'customers' | 'visitors'>('customers');

  // ── Doctor mode state (inquiry threading) ──
  const [inquiries, setInquiries] = useState<InquiryWithClient[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithClient | null>(null);
  const [inquiryMessages, setInquiryMessages] = useState<ThreadedMessage[]>([]);
  const [inquirySearchTerm, setInquirySearchTerm] = useState('');
  const [inquiryTab, setInquiryTab] = useState<'active' | 'archived' | 'all'>('active');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [showInquiryProfile, setShowInquiryProfile] = useState(false);

  // ── Shared state ──
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loadingAudio, setLoadingAudio] = useState<Record<string, boolean>>({});
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ══════════════════════════════════════════════════════════
  // ADMIN MODE — CUSTOMERS TAB (flat messages, original approach)
  // ══════════════════════════════════════════════════════════

  const fetchCustomersList = async () => {
    try {
      // Get the admin user id
      const { data: adminData } = await supabase.auth.getUser();
      const adminId = adminData.user?.id;
      if (!adminId) return;

      // Fetch all support messages (recipient_type = 'admin')
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, is_read, attachment_type, recipient_type')
        .eq('recipient_type', 'admin')
        .order('created_at', { ascending: false });

      if (error || !allMessages) { setSidebarItems([]); return; }

      // Group messages by customer profile id
      const usersMap = new Map<string, { msgs: any[] }>();
      for (const msg of allMessages) {
        // Determine the customer id (the one that is NOT the admin)
        const customerId: string | null = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id;
        if (!customerId || customerId === adminId) continue;
        if (!usersMap.has(customerId)) usersMap.set(customerId, { msgs: [] });
        usersMap.get(customerId)!.msgs.push(msg);
      }

      // Fetch profile info for all customer ids
      const customerIds = [...usersMap.keys()];
      if (customerIds.length === 0) { setSidebarItems([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', customerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const items: CustomerChatItem[] = customerIds.map(cid => {
        const { msgs } = usersMap.get(cid)!;
        const profile = profileMap.get(cid);
        const lastMsg = msgs[0]; // already sorted desc
        const unreadCount = msgs.filter(m => !m.is_read && m.sender_id !== adminId).length;

        return {
          kind: 'customer' as const,
          id: cid,
          full_name: profile?.full_name || 'مستخدم بدون اسم',
          avatar_url: profile?.avatar_url || null,
          unread_count: unreadCount,
          last_message_at: lastMsg?.created_at || null,
          last_message_text: lastMsg ? (lastMsg.attachment_type ? `[${lastMsg.attachment_type}]` : lastMsg.content) : null
        };
      });

      // Sort: unread first, then by last message time
      items.sort((a, b) => {
        if (a.unread_count !== b.unread_count) return b.unread_count - a.unread_count;
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      setSidebarItems(items);
    } catch (err) {
      console.error('Error fetching customers list:', err);
    }
  };

  const fetchCustomerMessages = async (customerId: string) => {
    const { data: adminData } = await supabase.auth.getUser();
    const adminId = adminData.user?.id;
    if (!adminId) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_type', 'admin')
      .or(`and(sender_id.eq.${customerId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${customerId})`)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    scrollToBottom();
  };

  const handleSelectCustomer = async (item: CustomerChatItem) => {
    setSelectedItem(item);
    setShowProfile(false);
    fetchCustomerMessages(item.id);

    // Mark messages as read
    const { data: adminData } = await supabase.auth.getUser();
    const adminId = adminData.user?.id;
    if (adminId && item.unread_count > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_type', 'admin')
        .eq('sender_id', item.id)
        .eq('receiver_id', adminId)
        .eq('is_read', false);

      setSidebarItems(prev => prev.map(i => i.id === item.id ? { ...i, unread_count: 0 } : i));
    }
  };

  const sendCustomerMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const item = selectedItem;
    if (!item || item.kind !== 'customer') return;
    if (!newMessage.trim() && !attachment) return;

    setUploading(true);
    let attachmentPath = null;
    let attachmentType = null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id ?? '';

      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const filePath = `admin_${currentUserId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachment);
        if (uploadError) throw uploadError;
        attachmentPath = filePath;
        if (attachment.type.startsWith('image/')) attachmentType = 'image';
        else if (attachment.type.startsWith('audio/')) attachmentType = 'audio';
        else attachmentType = 'file';
      }

      const { error } = await supabase.from('messages').insert([{
        sender_id: currentUserId,
        receiver_id: item.id,
        content: attachmentType === 'audio' ? '🎤 رسالة صوتية' : (newMessage || (attachmentType === 'image' ? '📷 صورة' : '📎 ملف')),
        attachment_url: attachmentPath,
        attachment_type: attachmentType,
        recipient_type: 'admin',
        is_read: false
      }]);

      if (error) throw error;
      setNewMessage('');
      setAttachment(null);
      fetchCustomerMessages(item.id);
    } catch { toast.error('فشل الإرسال'); }
    finally { setUploading(false); }
  };

  // ══════════════════════════════════════════════════════════
  // ADMIN MODE — VISITORS TAB (conversations table approach)
  // ══════════════════════════════════════════════════════════

  const fetchVisitorsList = async () => {
    try {
      const { data: convData, error } = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('owner_type', 'visitor')
        .order('updated_at', { ascending: false });

      if (error || !convData) { setSidebarItems([]); return; }

      const convIds = (convData as any[]).map(c => c.id);
      const { data: msgsData } = await (supabase as any)
        .from('messages')
        .select('conversation_id, content, created_at, is_read, attachment_type, sender_type')
        .in('conversation_id', convIds.length > 0 ? convIds : ['__none__'])
        .order('created_at', { ascending: false });

      const msgsMap = new Map<string, any[]>();
      if (msgsData) {
        for (const m of (msgsData as any[])) {
          if (!msgsMap.has(m.conversation_id)) msgsMap.set(m.conversation_id, []);
          msgsMap.get(m.conversation_id)!.push(m);
        }
      }

      const items: VisitorConvItem[] = (convData as any[]).map(c => {
        const cMsgs = msgsMap.get(c.id) || [];
        const lastMsg = cMsgs[0] || null;
        const unreadCount = cMsgs.filter(m => !m.is_read && m.sender_type !== 'support_agent').length;

        return {
          kind: 'visitor' as const,
          id: c.id,
          visitor_token: c.visitor_token,
          visitor_name: c.visitor_name,
          visitor_phone: c.visitor_phone,
          visitor_email: c.visitor_email,
          visitor_subject: c.visitor_subject,
          landing_page_url: c.landing_page_url,
          status: c.status,
          assigned_agent_id: c.assigned_agent_id,
          created_at: c.created_at,
          updated_at: c.updated_at,
          full_name: c.visitor_name || 'زائر بدون اسم',
          unread_count: unreadCount,
          last_message_at: lastMsg?.created_at || c.updated_at,
          last_message_text: lastMsg ? (lastMsg.attachment_type ? `[${lastMsg.attachment_type}]` : lastMsg.content) : null
        };
      });

      items.sort((a, b) => {
        if (a.unread_count !== b.unread_count) return b.unread_count - a.unread_count;
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      setSidebarItems(items);
    } catch (err) {
      console.error('Error fetching visitors list:', err);
    }
  };

  const fetchVisitorMessages = async (convId: string) => {
    const { data } = await (supabase as any)
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const handleSelectVisitor = async (item: VisitorConvItem) => {
    setSelectedItem(item);
    setShowProfile(false);
    fetchVisitorMessages(item.id);

    if (item.unread_count > 0) {
      await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', item.id)
        .neq('sender_type', 'support_agent')
        .eq('is_read', false);

      setSidebarItems(prev => prev.map(i => i.id === item.id ? { ...i, unread_count: 0 } : i));
    }
  };

  const sendVisitorMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const item = selectedItem;
    if (!item || item.kind !== 'visitor') return;
    if (!newMessage.trim() && !attachment) return;

    setUploading(true);
    let attachmentPath = null;
    let attachmentType = null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id ?? '';

      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const filePath = `admin_${currentUserId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachment);
        if (uploadError) throw uploadError;
        attachmentPath = filePath;
        if (attachment.type.startsWith('image/')) attachmentType = 'image';
        else if (attachment.type.startsWith('audio/')) attachmentType = 'audio';
        else attachmentType = 'file';
      }

      const { error } = await (supabase as any).from('messages').insert([{
        conversation_id: item.id,
        sender_id: currentUserId,
        receiver_id: null,
        sender_type: 'support_agent',
        sender_profile_id: currentUserId,
        content: attachmentType === 'audio' ? '🎤 رسالة صوتية' : (newMessage || (attachmentType === 'image' ? '📷 صورة' : '📎 ملف')),
        attachment_url: attachmentPath,
        attachment_type: attachmentType,
        recipient_type: 'admin',
        is_read: false
      }]);

      if (error) throw error;
      setNewMessage('');
      setAttachment(null);
      fetchVisitorMessages(item.id);
    } catch { toast.error('فشل الإرسال'); }
    finally { setUploading(false); }
  };

  const handleVisitorStatusChange = async (newStatus: 'waiting' | 'assigned' | 'in_progress' | 'closed') => {
    if (!selectedItem || selectedItem.kind !== 'visitor') return;
    try {
      const { error } = await (supabase as any)
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', selectedItem.id);
      if (error) throw error;
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } as VisitorConvItem : null);
      fetchVisitorsList();
      toast.success('تم تحديث حالة المحادثة بنجاح ⚡');
    } catch (err) {
      toast.error('فشل تحديث حالة المحادثة');
    }
  };

  // ══════════════════════════════════════════════════════════
  // DOCTOR MONITOR MODE LOGIC (inquiry-based)
  // ══════════════════════════════════════════════════════════

  const fetchInquiries = useCallback(async () => {
    setInquiryLoading(true);
    try {
      let query = supabase.from('inquiries').select('*').order('updated_at', { ascending: false });
      if (inquiryTab === 'active') query = query.in('status', ['open', 'under_review', 'replied']);
      else if (inquiryTab === 'archived') query = query.eq('status', 'closed');

      const { data: rawInquiries } = await query;
      if (!rawInquiries) { setInquiries([]); return; }

      const userIds = [...new Set(rawInquiries.map(i => i.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds.length > 0 ? userIds : ['__none__']);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const inquiryIds = rawInquiries.map(i => i.id);
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('inquiry_id, sender_id, content, created_at, is_read, attachment_type')
        .in('inquiry_id', inquiryIds.length > 0 ? inquiryIds : ['__none__'])
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
        return {
          ...inq,
          client_name: profile?.full_name || 'مستخدم',
          client_avatar: profile?.avatar_url || null,
          unread_count: msgs.filter((m: any) => !m.is_read).length,
          last_message_text: lastMsg ? (lastMsg.attachment_type ? `[${lastMsg.attachment_type}]` : lastMsg.content) : null,
          last_message_at: lastMsg?.created_at || inq.updated_at,
        };
      });

      enriched.sort((a, b) => (b.unread_count - a.unread_count) || (new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()));
      setInquiries(enriched);
    } catch (err) { console.error(err); } finally { setInquiryLoading(false); }
  }, [inquiryTab]);

  const fetchInquiryMessages = async (inquiryId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .eq('recipient_type', 'doctor')
      .order('created_at', { ascending: true });
    setInquiryMessages((data as ThreadedMessage[]) || []);
    scrollToBottom();
  };

  const handleSelectInquiry = (inquiry: InquiryWithClient) => {
    setSelectedInquiry(inquiry);
    setShowInquiryProfile(false);
    fetchInquiryMessages(inquiry.id);
  };

  const handleInquiryStatusChange = (newStatus: InquiryStatus) => {
    setInquiries(prev => prev.map(i => i.id === selectedInquiry?.id ? { ...i, status: newStatus } : i));
    if (selectedInquiry) setSelectedInquiry({ ...selectedInquiry, status: newStatus });
  };

  // ══════════════════════════════════════════════════════════
  // SHARED LOGIC
  // ══════════════════════════════════════════════════════════

  useEffect(() => {
    if (viewMode === 'admin') {
      if (adminSubTab === 'customers') {
        fetchCustomersList();
      } else {
        fetchVisitorsList();
      }
      setSelectedInquiry(null);
    } else {
      fetchInquiries();
      setSelectedItem(null);
    }
  }, [viewMode, fetchInquiries, adminSubTab]);

  // Realtime for admin mode
  useEffect(() => {
    if (viewMode !== 'admin') return;
    const channel = supabase.channel(`admin_msgs_${adminSubTab}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (adminSubTab === 'customers') {
          fetchCustomersList();
          if (selectedItem && selectedItem.kind === 'customer') fetchCustomerMessages(selectedItem.id);
        } else {
          fetchVisitorsList();
          if (selectedItem && selectedItem.kind === 'visitor') fetchVisitorMessages(selectedItem.id);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedItem?.id, viewMode, adminSubTab]);

  // Realtime for doctor monitor mode
  useEffect(() => {
    if (viewMode !== 'doctor' || !selectedInquiry?.id) return;
    const channel = supabase.channel(`admin_inquiry_${selectedInquiry.id}_${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `inquiry_id=eq.${selectedInquiry.id}`,
      }, (payload) => {
        const newMsg = payload.new as ThreadedMessage;
        if (newMsg.recipient_type === 'doctor') {
          setInquiryMessages(prev => [...prev, newMsg]);
          setInquiries(prev => prev.map(i =>
            i.id === selectedInquiry.id ? { ...i, last_message_text: newMsg.content, last_message_at: newMsg.created_at } : i
          ));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [viewMode, selectedInquiry?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => setAttachment(new File([new Blob(audioChunksRef.current, { type: 'audio/webm' })], 'voice-message.webm', { type: 'audio/webm' }));
      mr.start();
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
      if (error || !data) throw new Error('لا يمكن الوصول للملف');
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

  // Dispatch send based on selected item kind
  const sendAdminMessage = async (e?: React.FormEvent) => {
    if (!selectedItem) return;
    if (selectedItem.kind === 'customer') return sendCustomerMessage(e);
    if (selectedItem.kind === 'visitor') return sendVisitorMessage(e);
  };

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const filteredItems = sidebarItems.filter(item =>
    item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.kind === 'visitor' && item.visitor_phone && item.visitor_phone.includes(searchQuery))
  );

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  const currentMessages = viewMode === 'admin' ? messages : inquiryMessages;

  // Determine if the current message is from the admin
  const isMessageFromMe = (msg: any): boolean => {
    if (viewMode === 'doctor') {
      return msg.sender_id !== selectedInquiry?.user_id;
    }
    // Admin mode
    if (selectedItem?.kind === 'visitor') {
      return (msg as any).sender_type === 'support_agent';
    }
    // Customer mode: the admin is the receiver_id when client sends, or sender_id when admin sends
    // Use: if sender_id !== selectedItem.id, then it's from the admin
    if (selectedItem?.kind === 'customer') {
      return msg.sender_id !== selectedItem.id;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] font-tajawal">
      {/* Mode Switcher */}
      <div className="flex gap-4 p-4 bg-white border-b border-gray-100">
        <button
          onClick={() => { setViewMode('admin'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs transition-all ${viewMode === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
        >
          <Headset size={18} /> الرسائل الإدارية 🛠️
        </button>
        <button
          onClick={() => { setViewMode('doctor'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs transition-all ${viewMode === 'doctor' ? 'bg-forest text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
        >
          <Stethoscope size={18} /> متابعة استفسارات الدكاترة 🩺
        </button>
      </div>

      <div className="flex-1 bg-white rounded-b-3xl border-x border-b border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in">

        {/* ── LEFT SIDEBAR ── */}
        {viewMode === 'admin' ? (
          /* Admin: chat list */
          <div className={`w-full md:w-80 border-l border-gray-100 flex flex-col bg-white z-20 ${selectedItem ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => { setAdminSubTab('customers'); setSelectedItem(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black transition-all ${adminSubTab === 'customers' ? 'bg-white border-b-2 border-b-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Users size={14} /> العملاء
              </button>
              <button
                onClick={() => { setAdminSubTab('visitors'); setSelectedItem(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black transition-all ${adminSubTab === 'visitors' ? 'bg-white border-b-2 border-b-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Globe size={14} /> زوار الموقع
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={adminSubTab === 'customers' ? "بحث باسم العميل..." : "بحث باسم الزائر..."} 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest" 
                />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-bold">لا يوجد محادثات</div>
              ) : (
                filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (item.kind === 'customer') handleSelectCustomer(item);
                      else handleSelectVisitor(item as VisitorConvItem);
                    }} 
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 relative ${selectedItem?.id === item.id ? 'bg-forest/5 border-r-4 border-r-forest' : 'border-r-4 border-r-transparent'}`}
                  >
                    <div className="relative">
                      <Avatar src={item.kind === 'customer' ? item.avatar_url : null} name={item.full_name} size="md" />
                      {item.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                          {item.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className={`font-bold text-sm truncate flex items-center gap-1 ${item.unread_count > 0 ? 'text-black' : 'text-gray-700'}`}>
                          {item.full_name}
                          {item.kind === 'visitor' && (
                            <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">🌐</span>
                          )}
                        </h3>
                        <span className="text-[10px] text-gray-400">
                          {item.last_message_at ? format(new Date(item.last_message_at), 'p', { locale: ar }) : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${item.unread_count > 0 ? 'text-forest font-bold' : 'text-gray-400'}`}>
                        {item.last_message_text || 'لا توجد رسائل'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Doctor Monitor: inquiry list */
          <InquiryList
            inquiries={inquiries}
            selectedInquiryId={selectedInquiry?.id || null}
            onSelectInquiry={handleSelectInquiry}
            loading={inquiryLoading}
            searchTerm={inquirySearchTerm}
            onSearchChange={setInquirySearchTerm}
            activeTab={inquiryTab}
            onTabChange={setInquiryTab}
          />
        )}

        {/* ── CHAT AREA ── */}
        <div className={`flex-1 flex flex-col bg-gray-50 relative ${(viewMode === 'admin' ? !selectedItem : !selectedInquiry) ? 'hidden md:flex' : 'flex'}`}>
          {(viewMode === 'admin' ? selectedItem : selectedInquiry) ? (
            <>
              {/* Header */}
              {viewMode === 'admin' ? (
                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectedItem!.kind === 'customer' && setShowProfile(!showProfile)}>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedItem(null); }} className="md:hidden p-2 hover:bg-gray-100 rounded-full">➜</button>
                    <Avatar src={selectedItem!.kind === 'customer' ? (selectedItem as CustomerChatItem).avatar_url : null} name={selectedItem!.full_name} size="sm" />
                    <div>
                      <h3 className="font-bold text-forest flex items-center gap-2">
                        {selectedItem!.full_name}
                        {selectedItem!.kind === 'visitor' && (
                          <span className="bg-orange/10 text-orange text-[9px] font-black px-2.5 py-0.5 rounded-full">زائر 🌐</span>
                        )}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                        {selectedItem!.kind === 'customer' 
                          ? 'عميل مسجل (اضغط لعرض الملف)' 
                          : `جوال: ${(selectedItem as VisitorConvItem).visitor_phone} | بريد: ${(selectedItem as VisitorConvItem).visitor_email || 'لا يوجد'}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Conversation Status selector — visitors only */}
                  {selectedItem!.kind === 'visitor' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={(selectedItem as VisitorConvItem).status}
                        onChange={(e) => handleVisitorStatusChange(e.target.value as any)}
                        className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-forest text-gray-700 cursor-pointer shadow-sm"
                      >
                        <option value="waiting">⏳ قيد الانتظار</option>
                        <option value="assigned">👤 مُعيّن</option>
                        <option value="in_progress">⚡ قيد المعالجة</option>
                        <option value="closed">🔒 مغلق</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <InquiryHeader
                  inquiry={selectedInquiry!}
                  onStatusChange={handleInquiryStatusChange}
                  onToggleProfile={() => setShowInquiryProfile(!showInquiryProfile)}
                  showProfile={showInquiryProfile}
                />
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((msg, idx) => {
                  const isMe = isMessageFromMe(msg);

                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm relative group ${isMe ? (viewMode === 'admin' ? 'bg-blue-600' : 'bg-forest') + ' text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
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
                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.created_at ? format(new Date(msg.created_at), 'p', { locale: ar }) : ''}
                          {isMe && (msg.is_read ? <CheckCircle size={10} /> : <Check size={10} />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input (only for admin mode) */}
              {viewMode === 'admin' && (
                <div className="p-4 bg-white border-t border-gray-100">
                  {attachment && (
                    <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        {attachment.type.startsWith('image') ? <ImageIcon size={16} /> : attachment.type.startsWith('audio') ? <Mic size={16} /> : <FileText size={16} />}
                        {attachment.name}
                      </div>
                      <button onClick={() => setAttachment(null)} className="text-red-500 hover:bg-red-100 rounded-full p-1"><X size={14} /></button>
                    </div>
                  )}
                  <form onSubmit={sendAdminMessage} className="flex gap-2 items-end">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-forest hover:bg-gray-50 rounded-xl transition-colors" disabled={isRecording}><Paperclip size={20} /></button>
                    {isRecording ? (
                      <div className="flex-1 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-red-600 font-bold animate-pulse">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 bg-red-600 rounded-full" /> جاري التسجيل...</span>
                      </div>
                    ) : (
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest" />
                    )}
                    <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-xl ${isRecording ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-forest hover:bg-gray-50'}`}>
                      {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>
                    <button type="submit" disabled={uploading} className="bg-blue-600 text-white p-3 rounded-xl hover:opacity-90 transition-colors">
                      {uploading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </form>
                </div>
              )}

              {/* Doctor monitor mode: read-only notice */}
              {viewMode === 'doctor' && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs font-bold text-slate-400">
                  🔒 وضع المتابعة — لا يمكن إرسال رسائل في هذا الوضع
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>{viewMode === 'admin' ? 'اختر محادثة لبدء الرد' : 'اختر استفساراً لمتابعته'}</p>
            </div>
          )}
        </div>

        {/* ── PROFILE SIDEBAR ── */}
        {viewMode === 'admin' && selectedItem && selectedItem.kind === 'customer' && showProfile && (
          <ProfileSidebar
            userId={selectedItem.id}
            userName={selectedItem.full_name || 'مستخدم بدون اسم'}
            userAvatar={(selectedItem as CustomerChatItem).avatar_url || null}
            onClose={() => setShowProfile(false)}
            detailsLink={`/admin/clients/${selectedItem.id}`}
          />
        )}
        {viewMode === 'doctor' && selectedInquiry && showInquiryProfile && (
          <ProfileSidebar
            userId={selectedInquiry.user_id}
            userName={selectedInquiry.client_name}
            userAvatar={selectedInquiry.client_avatar}
            onClose={() => setShowInquiryProfile(false)}
            detailsLink={`/admin/clients/${selectedInquiry.user_id}`}
          />
        )}
      </div>
    </div>
  );
};

export default AdminChat;