import { supabase } from './supabase';

export const APP_ROLES = ['admin', 'doctor', 'client'] as const;
export type AppRole = typeof APP_ROLES[number];

export const isAppRole = (role: unknown): role is AppRole =>
  typeof role === 'string' && APP_ROLES.includes(role as AppRole);

export const getDefaultRouteForRole = (role: AppRole) => {
  const fallbackMap: Record<AppRole, string> = {
    admin: '/admin',
    doctor: '/doctor-dashboard',
    client: '/dashboard',
  };

  return fallbackMap[role];
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const fetchUserRole = async (userId: string, retries = 2): Promise<AppRole | null> => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (isAppRole(data?.role)) {
      return data.role;
    }

    if (attempt < retries) {
      await delay(400);
    }
  }

  return null;
};
