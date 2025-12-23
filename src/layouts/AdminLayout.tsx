import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

// 👇 استيراد الأيقونات (تمت إضافة TrendingUp للصفحة الجديدة)
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  Calendar, 
  Ticket,
  Tag,
  TrendingUp // 👈 الأيقونة الجديدة
} from 'lucide-react';
import NotificationsMenu from '../components/NotificationsMenu';

const AdminLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'نظرة عامة', icon: LayoutDashboard, path: '/admin' },
    { name: 'العملاء', icon: Users, path: '/admin/clients' },
    { name: 'متابعة الالتزام', icon: TrendingUp, path: '/admin/performance' }, // 👈 الرابط الجديد (هام جداً)
    { name: 'محادثات العملاء', icon: MessageSquare, path: '/admin/chat' },
    { name: 'أرشيف الأنظمة', icon: FileText, path: '/admin/plans' },
    { name: 'طلبات الدفع', icon: CreditCard, path: '/admin/transactions' },
    { name: 'إدارة الفعاليات', icon: Calendar, path: '/admin/events' },
    { name: 'حجوزات الفعاليات', icon: Ticket, path: '/admin/event-bookings' },
    { name: 'المدونة والمقالات', icon: FileText, path: '/admin/blog' },
    { name: 'أكواد الخصم', icon: Tag, path: '/admin/promocodes' },
    { name: 'الإعدادات', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden" dir="rtl">
      
      {/* القائمة الجانبية */}
      <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col flex-shrink-0 z-50">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 h-[73px]">
           <div className="bg-forest p-1.5 rounded-lg"><Logo className="h-8 w-8" /></div>
           <span className="font-bold text-forest text-lg">لوحة الإدارة</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
           {navItems.map(item => (
             <NavLink 
               key={item.path} 
               to={item.path}
               end={item.path === '/admin'}
               className={({ isActive }) => `
                 flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold
                 ${isActive 
                   ? 'bg-forest text-white shadow-md' 
                   : 'text-gray-500 hover:bg-gray-50 hover:text-forest'
                 }
               `}
             >
               <item.icon size={20} />
               {item.name}
             </NavLink>
           ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold"
          >
            <LogOut size={20} /> تسجيل خروج
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-40 h-[73px]">
            <div className="hidden md:block">
                <h2 className="font-bold text-gray-700">مرحباً بك، دكتور 👋</h2>
                <p className="text-xs text-gray-400">تابع نشاط عملائك اليوم</p>
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

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;