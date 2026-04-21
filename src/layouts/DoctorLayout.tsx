import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // 👈 أضفنا استدعاء supabase
import toast from 'react-hot-toast'; // 👈 أضفنا التنبيهات
import { LayoutDashboard, Users, ClipboardList, MessageSquare, Menu, X, LogOut } from 'lucide-react';

const DoctorLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 التعديل هنا: دالة تسجيل خروج متكاملة للدكتور
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

  const menuItems = [
    { label: 'الرئيسية', icon: <LayoutDashboard size={20} />, path: '/doctor-dashboard' },
    { label: 'أبطالي', icon: <Users size={20} />, path: '/doctor-dashboard/clients' },
    { label: 'المتابعة اليومية', icon: <ClipboardList size={20} />, path: '/doctor-dashboard/performance' },
    { label: 'المحادثات', icon: <MessageSquare size={20} />, path: '/doctor-dashboard/chat' },
  ];  

  return (
    <div className="flex h-screen bg-gray-50 font-tajawal text-right" dir="rtl">
      
      {/* Sidebar - القائمة الجانبية */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} 
        lg:relative lg:translate-x-0
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center font-black text-white">D</div>
            <h1 className="text-xl font-black">لوحة الدكتور</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all
                  ${location.pathname === item.path ? 'bg-forest text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl font-bold transition-all"
            >
              <LogOut size={20} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <button className="lg:hidden p-2 text-slate-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="text-xs font-bold text-slate-400">نظام إدارة العيادة الذكي</div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet /> 
        </main>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DoctorLayout;