import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';

const MainAccountOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProfile, loading } = useFamily();

  if (loading) return null; // أو سبينر

  // لو الحساب فرعي (عنده مدير)، ارجع للداشبورد فوراً
  if (currentProfile?.manager_id) {
    return <Navigate to="/dashboard" replace />;
  }

  // لو حساب رئيسي، اعرض الصفحة
  return <>{children}</>;
};

export default MainAccountOnly;