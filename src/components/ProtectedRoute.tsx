import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext'; 
import Preloader from './Preloader';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'doctor' | 'client')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentProfile, loading: familyLoading } = useFamily(); 
  const location = useLocation();

  // 1. الانتظار حتى يتم تحميل البيانات
  if (authLoading || familyLoading) {
    return <Preloader />;
  }

  // 2. التحقق من تسجيل الدخول
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. التحقق من الصلاحيات (Role-Based Access Control)
if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role as 'admin' | 'doctor' | 'client')) {    // لو حاول يدخل صفحة مش بتاعته، رجعه للمكان اللي يخصه
    const fallbackMap = {
      admin: '/admin',
      doctor: '/doctor-dashboard',
      client: '/dashboard'
    };
    return <Navigate to={fallbackMap[profile?.role as keyof typeof fallbackMap] || '/'} replace />;
  }

  // 4. منطق الاشتراكات (خاص بالعملاء فقط)
  if (profile?.role === 'client') {
    if (location.pathname === '/dashboard/subscriptions') {
      return <Outlet />;
    }

    const isExpired = profile?.subscription_status === 'expired' || currentProfile?.subscription_status === 'expired';
    if (isExpired) {
      return <Navigate to="/dashboard/subscriptions" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;