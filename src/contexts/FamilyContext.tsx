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
    if (!user) {
      setCurrentProfile(null);
      setFamilyMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${user.id},manager_id.eq.${user.id}`);

      if (error) throw error;

      if (data) {
        // 👇 التعديل هنا: إخبار TypeScript بأن البيانات العائدة هي من نوع Profile
        const profilesData = data as Profile[];
        const manager = profilesData.find(p => p.id === user.id);

        const processedMembers = profilesData.map(member => {
            if (member.manager_id && manager) {
                const isManagerExpired = manager.subscription_status === 'expired';
                const isMemberManuallyExpired = member.subscription_status === 'expired';

                return {
                    ...member,
                    subscription_status: (isManagerExpired || isMemberManuallyExpired) ? 'expired' : 'active',
                    subscription_end_date: manager.subscription_end_date,
                    plan_tier: manager.plan_tier 
                } as Profile;
            }
            return member;
        });

        setFamilyMembers(processedMembers);

        if (!currentProfile) {
            setCurrentProfile(processedMembers.find(p => p.id === user.id) || processedMembers[0]);
        } else {
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