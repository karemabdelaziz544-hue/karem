import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Profile } from '../types';

interface FamilyContextType {
  currentProfile: Profile | null;
  familyMembers: Profile[];
  switchProfile: (profileId: string) => void;
  refreshFamily: (silent?: boolean) => void;
  loading: boolean;
  error: Error | null;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFamily = useCallback(async (silent = false) => {
    if (!user) {
      setCurrentProfile(null);
      setFamilyMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${user.id},manager_id.eq.${user.id}`);

      if (dbError) throw dbError;

      if (data) {
        const profilesData = data as Profile[];
        const manager = profilesData.find(p => p.id === user.id);

        const processedMembers = profilesData.map(member => {
          const safeMember = { ...member, is_onboarded: !!member.is_onboarded };

          if (safeMember.manager_id && manager) {
            const managerStatus = manager.subscription_status;
            const memberStatus = safeMember.subscription_status;
            let inheritedStatus = memberStatus;
            
            // Align subscription inheritance rules to match mobile exactly
            if (managerStatus === 'new') inheritedStatus = 'new';
            else if (managerStatus === 'expired' || memberStatus === 'expired') inheritedStatus = 'expired';
            else if (managerStatus === 'active') inheritedStatus = 'active';

            return {
              ...safeMember,
              subscription_status: inheritedStatus,
              subscription_end_date: manager.subscription_end_date,
              plan_tier: manager.plan_tier 
            } as Profile;
          }
          return safeMember as Profile;
        });

        setFamilyMembers(processedMembers);

        // Update current selected profile
        setCurrentProfile(prev => {
          if (!prev) {
            return processedMembers.find(p => p.id === user.id) || processedMembers[0];
          }
          const updatedCurrent = processedMembers.find(p => p.id === prev.id);
          return updatedCurrent || processedMembers.find(p => p.id === user.id) || processedMembers[0];
        });
      }
    } catch (err: any) {
      console.error("Error fetching family inside FamilyContext:", err);
      setError(err instanceof Error ? err : new Error('Failed to load family data'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFamily();

    if (!user) return;

    // Real-time listener for profiles changes (Manager + Sub accounts)
    const channel = supabase.channel(`web-family-changes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchFamily(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `manager_id=eq.${user.id}` }, () => fetchFamily(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFamily]);

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
      loading,
      error 
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