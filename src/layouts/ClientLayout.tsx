import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';
import { supabase } from '../lib/supabase'; 
import toast from 'react-hot-toast'; 
import Logo from '../components/Logo';
import { LayoutDashboard, History, CreditCard, LogOut, Menu, X, MessageSquare, FileText, Users, ChevronDown, Check, Settings, Loader2 } from 'lucide-react';
import NotificationsMenu from '../components/NotificationsMenu';
import Avatar from '../components/Avatar';

const ClientLayout: React.FC = () => {
  const { familyMembers, currentProfile, switchProfile, loading } = useFamily();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

  if (loading || !currentProfile) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
              <Loader2 className="h-10 w-10 text-forest animate-spin" />
              <p className="text-gray-500 font-bold text-sm">جاري تحميل بياناتك...</p>
          </div>
      );
  }

  const isDependent = !!currentProfile.manager_id;

  const navItems = [
    { name: 'لوحة التحكم', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'أرشيف الرحلة', icon: History, path: '/dashboard/history' },
    { name: 'سجلات InBody', icon: FileText, path: '/dashboard/medical-records' },
    { name: 'الدعم الطبي', icon: MessageSquare, path: '/dashboard/support' },
    ...(!isDependent ? [
        { name: 'الاشتراكات', icon: CreditCard, path: '/dashboard/subscriptions' },
        { name: 'إدارة العائلة', icon: Users, path: '/dashboard/family' },
        { name: 'الإعدادات', icon: Settings, path: '/dashboard/settings' },
    ] : [
        { name: 'الإعدادات', icon: Settings, path: '/dashboard/settings' },
    ])
  ];

  return (
    <div className="flex h-screen bg-cream font-sans overflow-hidden" dir="rtl">
      
      <aside className={`
        fixed md:relative z-50 w-64 h-full bg-white border-l border-sage/30 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-50 h-[73px] flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="bg-forest p-1.5 rounded-lg"><Logo className="h-6 w-6" /></div>
             <span className="font-bold text-forest text-lg">هيليكس</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400"><X size={24} /></button>
        </div>

        <div className="p-4 border-b border-gray-50">
           <div className="relative">
             <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange transition-colors"
             >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar src={currentProfile?.avatar_url} name={currentProfile?.full_name} size="sm" />
                    <div className="text-right truncate">
                        <span className="block text-xs text-gray-400">
                            {isDependent ? 'حساب تابع' : 'الحساب الرئيسي'}
                        </span>
                        <span className="block text-sm font-bold text-gray-800 truncate">{currentProfile?.full_name}</span>
                    </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
             </button>

             {isProfileMenuOpen && (
                 <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {familyMembers.map(member => (
                          <button
                            key={member.id}
                            onClick={() => {
                                switchProfile(member.id);
                                setIsProfileMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-right transition-colors border-b border-gray-50 last:border-0"
                          >
                              <div className="flex items-center gap-2">
                                 <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                                 <span className={`text-sm ${member.id === currentProfile?.id ? 'font-bold text-orange' : 'text-gray-600'}`}>
                                     {member.full_name}
                                 </span>
                              </div>
                              {member.id === currentProfile?.id && <Check size={14} className="text-orange" />}
                          </button>
                      ))}
                      
                      {!isDependent && (
                        <button 
                            onClick={() => {
                                navigate('/dashboard/family');
                                setIsProfileMenuOpen(false);
                            }}
                            className="w-full p-3 text-center text-xs font-bold text-orange hover:bg-orange/5 transition-colors"
                        >
                            + إضافة فرد جديد
                        </button>
                      )}
                 </div>
             )}
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
           {navItems.map((item) => (
             <NavLink 
               key={item.path} 
               to={item.path}
               end={item.path === '/dashboard'}
               onClick={() => setIsMobileMenuOpen(false)}
               className={({ isActive }) => `
                 flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                 ${isActive 
                   ? 'bg-orange text-white shadow-md shadow-orange/20' 
                   : 'text-gray-500 hover:bg-orange/5 hover:text-orange'
                 }
               `}
             >
               <item.icon size={20} />
               {item.name}
             </NavLink>
           ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
          >
            <LogOut size={20} /> تسجيل خروج
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-cream">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-40 h-[73px]">
            <div className="hidden md:block">
                <h2 className="font-bold text-gray-700">مرحباً، {currentProfile?.full_name?.split(' ')[0]} 👋</h2>
                <p className="text-xs text-gray-400">أتمنى لك يوماً صحياً!</p>
            </div>
            <div className="md:hidden flex items-center gap-2">
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-forest">
                    <Menu size={24} />
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-0.5">
                    <NotificationsMenu />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <Outlet />
        </div>
      </main>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ClientLayout;