import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  role: 'admin' | 'doctor' | 'client';
  full_name?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // المتغير ده هو اللي بيحمينا من تداخل React ويمنع التعليق
    let isActive = true;

    const loadUserData = async (sessionUser: User) => {
      try {
        // استخدمنا maybeSingle بدل single عشان لو البروفايل مش موجود ميعملش Crash
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (error) throw error;

        if (isActive) {
          setUser(sessionUser);
          setProfile(data as Profile);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isActive) {
          setUser(sessionUser); 
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // 1. التحقق السريع من الجلسة أول ما الموقع يفتح
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isActive) {
        if (session?.user) {
          loadUserData(session.user);
        } else {
          setLoading(false); // لو مفيش يوزر، وقّف التحميل فوراً
        }
      }
    });

    // 2. مراقبة التغيرات (تسجيل دخول، خروج، تحديث الجلسة في الخلفية)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return;

      if (event === 'SIGNED_IN') {
        if (session?.user) loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // تحديث صامت بدون ما نطرد المستخدم لصفحة التحميل أو الـ Login
        if (session?.user) setUser(session.user);
      }
    });

    return () => {
      isActive = false; // تنظيف الـ Effect لمنع الـ Race Condition
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);