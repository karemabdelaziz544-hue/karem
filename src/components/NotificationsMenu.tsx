import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Check, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  type?: 'system' | 'subscription' | 'chat';
}

interface Props {
    isAdmin?: boolean; // خاصية اختيارية عشان نستخدم نفس المكون للادمن والعميل
}

const NotificationsMenu: React.FC<Props> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
        fetchNotifications();
        subscribeToNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    // جلب آخر 20 إشعار
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
        setNotifications(data);
        // حساب غير المقروء محلياً
        setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${user?.id}` 
        }, 
        (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // تشغيل صوت تنبيه خفيف (اختياري)
            const audio = new Audio('/notification.mp3'); // تأكد من وجود ملف صوتي أو احذف السطر
            audio.play().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const markAsRead = async (id: string, link?: string) => {
    // 1. تحديث الواجهة فوراً (Optimistic Update)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 2. تحديث قاعدة البيانات
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);

    // 3. التوجيه لو فيه رابط
    if (link) {
        navigate(link);
        setIsOpen(false);
    }
  };

  const markAllRead = async () => {
    // 1. تحديث الواجهة
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // 2. تحديث قاعدة البيانات (تحديث الكل لهذا المستخدم)
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
  };

return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                {unreadCount > 9 ? '+9' : unreadCount}
            </span>
        )}
      </button>

      {isOpen && (
        // 👇👇 التعديل هنا: شيلنا md:right-0 وخليناها left-0 عشان تفتح مظبوط
        <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] overflow-hidden animate-in zoom-in-95 origin-top-left">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800">الإشعارات</h3>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllRead}
                        className="text-xs text-forest font-bold hover:underline flex items-center gap-1"
                    >
                        <CheckCircle size={12} /> تحديد الكل كمقروء
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Bell className="mx-auto mb-2 opacity-20" size={32}/>
                        <p className="text-sm">لا توجد إشعارات جديدة</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div 
                            key={notif.id}
                            onClick={() => markAsRead(notif.id, notif.link)}
                            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 ${!notif.is_read ? 'bg-forest/5' : 'bg-white'}`}
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-orange' : 'bg-transparent'}`}></div>
                            <div className="flex-1">
                                <h4 className={`text-sm mb-1 ${!notif.is_read ? 'font-bold text-black' : 'font-medium text-gray-600'}`}>
                                    {notif.title}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed mb-1">
                                    {notif.message}
                                </p>
                                <span className="text-[10px] text-gray-400 font-bold">
                                    {format(new Date(notif.created_at), 'p - P', { locale: ar })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 font-bold w-full py-1">
                    إغلاق القائمة
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;