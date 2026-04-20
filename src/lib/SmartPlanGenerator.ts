import { supabase } from './supabase';

export const generateDailyPlan = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: {
        action: 'generateDailyPlan',
        userId,
      },
    });

    if (error) throw error;
    return data?.data ?? null;
  } catch (error: any) {
    console.error('Generator Error:', error.message);
    return null;
  }
};

export const getPanicAdvice = async (userId: string, cheatedMeals: string[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: {
        action: 'getPanicAdvice',
        userId,
        cheatedMeals,
      },
    });

    if (error) throw error;
    return data?.data ?? null;
  } catch (error) {
    return null;
  }
};
