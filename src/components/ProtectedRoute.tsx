import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Preloader from './Preloader';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  // لو لسه بيحمل بيانات الدخول، اعرض شاشة تحميل
  if (loading) {
    return <Preloader />;
  }

  // لو مش مسجل دخول، وديه لصفحة الدخول
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ لو مسجل دخول، دخله فوراً (وسيب الداشبورد هي اللي تعرضله اشترك الآن)
  return <Outlet />;
};

export default ProtectedRoute;