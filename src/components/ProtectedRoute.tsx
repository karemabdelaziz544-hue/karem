import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  // لو مفيش يوزر، ارجع لصفحة الدخول فوراً
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // لو فيه يوزر، اعرض الصفحة المطلوبة (الداشبورد)
  return <Outlet />;
};

export default ProtectedRoute;