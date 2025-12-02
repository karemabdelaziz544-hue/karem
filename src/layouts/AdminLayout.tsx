import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { Users, FileText, LayoutDashboard, LogOut } from 'lucide-react';

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
    { name: 'أرشيف الأنظمة', icon: FileText, path: '/admin/plans' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col flex-shrink-0 z-50">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-gray-50">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-40">
           <Logo className="h-8 w-8" />
           <button onClick={handleLogout}><LogOut size={20} className="text-gray-500"/></button>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;