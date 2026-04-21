import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import toast from 'react-hot-toast'; 
import Logo from '../components/Logo';
import { 
  Users, FileText, LayoutDashboard, LogOut, MessageSquare, 
  CreditCard, Settings, Calendar, Ticket, Tag, TrendingUp, 
  Quote, Layout, Menu, X 
} from 'lucide-react';
import NotificationsMenu from '../components/NotificationsMenu';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  const handleLogout = async () => {
    const loadingToast = toast.loading('جاري تسجيل الخروج...');
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        toast.success('تم تسجيل الخروج بنجاح', { id: loadingToast });
        navigate('/login', { replace: true });
    } catch (error: any) {
        toast.error('حدث خطأ أثناء تسجيل الخروج', { id: loadingToast });
    }
  };

  const navItems = [
    { name: 'نظرة عامة', icon: LayoutDashboard, path: '/admin' },
    { name: 'إدارة الواجهة (Home)', icon: Layout, path: '/admin/home-editor' },
    { name: 'العملاء', icon: Users, path: '/admin/clients' },
    { name: 'متابعة الالتزام', icon: TrendingUp, path: '/admin/performance' },
    { name: 'محادثات العملاء', icon: MessageSquare, path: '/admin/chat' },
    { name: 'إدارة الآراء', icon: Quote, path: '/admin/feedback' },
    { name: 'طلبات الدفع', icon: CreditCard, path: '/admin/transactions' },
    { name: 'إدارة الفعاليات', icon: Calendar, path: '/admin/events' },
    { name: 'حجوزات الفعاليات', icon: Ticket, path: '/admin/event-bookings' },
    { name: 'المدونة والمقالات', icon: FileText, path: '/admin/blog' },
    { name: 'أكواد الخصم', icon: Tag, path: '/admin/promocodes' },
    { name: 'الإعدادات', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden" dir="rtl">
      
      <aside className={`
        fixed inset-y-0 right-0 w-64 bg-white border-l border-gray-200 z-[100] flex flex-col transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between h-[73px]">
            <div className="flex items-center gap-3">
              <div className="bg-forest p-1.5 rounded-lg"><Logo className="h-8 w-8" /></div>
              <span className="font-bold text-forest text-lg">لوحة الإدارة</span>
            </div>
            <button className="md:hidden text-gray-400" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map(item => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                end={item.path === '/admin'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                  ${isActive 
                    ? 'bg-forest text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-forest'
                  }
                `}
              >
                <item.icon size={18} />
                {item.name}
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
          >
            <LogOut size={18} /> تسجيل خروج
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center shadow-sm z-40 h-[73px] shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(true);
                }}
                className="p-2 bg-gray-50 rounded-xl text-forest md:hidden relative z-[70] active:scale-95 transition-transform"
              >
                <Menu size={24} />
              </button>              
              <div className="hidden md:block">
                  <h2 className="font-bold text-gray-700">مرحباً بك، دكتور 👋</h2>
                  <p className="text-xs text-gray-400">تابع نشاط عملائك اليوم</p>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-2">
                <div className="bg-forest p-1 rounded"><Logo className="h-6 w-6" /></div>
                <span className="font-bold text-forest">هيليكس</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-0.5">
                    <NotificationsMenu isAdmin={true} />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;