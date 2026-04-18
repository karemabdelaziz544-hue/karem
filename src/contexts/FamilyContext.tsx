import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, Profile } from './AuthContext';

interface FamilyContextType {
  currentProfile: Profile | null;
  familyMembers: Profile[];
  switchProfile: (profileId: string) => void;
  refreshFamily: () => void;
  loading: boolean;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFamily = async () => {
    if (!user) return;
    
    try {
      // 1. جلب العائلة كلها
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${user.id},manager_id.eq.${user.id}`);

      if (error) throw error;

      if (data) {
        // 2. تحديد الحساب الرئيسي (الأب/الأم)
        const manager = data.find(p => p.id === user.id);

        // 3. "توريث" حالة الاشتراك للأبناء
        // بنعدل البيانات في الذاكرة (Frontend) بس، مش في الداتابيز، عشان العرض يبقى صح
// داخل ملف FamilyContext.tsx - ابحث عن قسم الـ map واستبدله بهذا:
const processedMembers = data.map(member => {
    if (member.manager_id && manager) {
        // المنطق الجديد:
        // 1. لو الأب نفسه منتهي (expired)، يبقى الابن أكيد منتهي زيه.
        // 2. لو الأب نشط، بنشوف حالة الابن في الداتابيز: 
        //    لو الأدمن قفله (expired)، يفضل مقفول. لو هو نشط، يفضل نشط.
        
        const isManagerExpired = manager.subscription_status === 'expired';
        const isMemberManuallyExpired = member.subscription_status === 'expired';

        return {
            ...member,
            // الابن يكون active فقط لو الأب active وكمان الابن نفسه مش expired
            subscription_status: (isManagerExpired || isMemberManuallyExpired) ? 'expired' : 'active',
            subscription_end_date: manager.subscription_end_date,
            plan_tier: manager.plan_tier 
        };
    }
    return member;
});
        setFamilyMembers(processedMembers);

        // الحفاظ على البروفايل المختار، أو اختيار الرئيسي
        if (!currentProfile) {
            setCurrentProfile(processedMembers.find(p => p.id === user.id) || processedMembers[0]);
        } else {
            // تحديث بيانات البروفايل المختار حالياً بالبيانات الجديدة
            const updatedCurrent = processedMembers.find(p => p.id === currentProfile.id);
            if (updatedCurrent) setCurrentProfile(updatedCurrent);
        }
      }
    } catch (err) {
      console.error("Error fetching family:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [user]);

  const switchProfile = (profileId: string) => {
    const profile = familyMembers.find(p => p.id === profileId);
    if (profile) setCurrentProfile(profile);
  };

  return (
    <FamilyContext.Provider value={{ 
      currentProfile, 
      familyMembers, 
      switchProfile, 
      refreshFamily: fetchFamily, 
      loading 
    }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) throw new Error("useFamily must be used within a FamilyProvider");
  return context;
};