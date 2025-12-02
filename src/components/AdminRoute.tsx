import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AdminRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error fetching role:", error);
            setIsAdmin(false);
          } else {
            // التحقق الصارم من أن الدور هو "admin"
            setIsAdmin(data?.role === 'admin');
          }
        } catch (err) {
          console.error("Unexpected error in AdminRoute:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setChecking(false);
    };

    if (!authLoading) {
      checkRole();
    }
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-forest font-bold">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  // إذا لم يكن مسجلاً، يذهب لصفحة الدخول
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // إذا كان مسجلاً ولكن ليس أدمن، يذهب للداشبورد العادية
  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  // إذا كان أدمن، يسمح له بالمرور
  return <Outlet />;
};

export default AdminRoute;