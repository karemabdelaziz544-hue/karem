import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Droplet, Plus, Minus, Check, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  userId: string;
}

const HabitTracker: React.FC<Props> = ({ userId }) => {
  const [waterIntake, setWaterIntake] = useState(0); // value stored in Liters in DB
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const WATER_GOAL_LITERS = 3.0; // 3 Liters daily goal
  const CALORIES_GOAL = 2000;    // 2000 Calories daily goal

  useEffect(() => {
    fetchTodayLogs();
  }, [userId]);

  const fetchTodayLogs = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWaterIntake(Number(data.water_intake) || 0);
        setCaloriesConsumed(Number(data.calories_consumed) || 0);
      } else {
        setWaterIntake(0);
        setCaloriesConsumed(0);
      }
    } catch (err) {
      console.error("Error fetching habits from daily_logs:", err);
      toast.error("فشل في تحميل التقدم اليومي");
    } finally {
      setLoading(false);
    }
  };

  const updateHabitsLog = async (type: 'water' | 'calories', value: number) => {
    const today = new Date().toISOString().split('T')[0];
    setSaving(true);

    try {
      const targetValue = Math.max(0, value);
      
      const updates = {
        user_id: userId,
        date: today,
        water_intake: type === 'water' ? targetValue : waterIntake,
        calories_consumed: type === 'calories' ? targetValue : caloriesConsumed,
        updated_at: new Date().toISOString()
      };

      if (type === 'water') setWaterIntake(targetValue);
      if (type === 'calories') setCaloriesConsumed(targetValue);

      const { error } = await supabase
        .from('daily_logs')
        .upsert(updates, { onConflict: 'user_id, date' });
        
      if (error) throw error;

    } catch (err) {
      console.error("Error updating daily_logs:", err);
      toast.error("فشل في حفظ البيانات");
      fetchTodayLogs(); // Reset from DB in case of error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-44 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-bold font-tajawal">جاري تحميل المؤشرات اليومية...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 font-tajawal text-right">
      {/* 💧 تتبع شرب المياه */}
      <div className="bg-gradient-to-br from-white to-blue-50/20 p-6 rounded-[2rem] border border-blue-100/50 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-blue-955 flex items-center gap-2">
              <Droplet className="text-blue-500 fill-blue-500" size={22}/> شرب المياه
            </h3>
            <p className="text-xs text-blue-400 font-bold mt-1">الهدف اليومي: {WATER_GOAL_LITERS} لتر</p>
          </div>
          <div className="text-2xl font-black text-blue-600">
            {waterIntake.toFixed(2)} <span className="text-xs font-bold text-slate-400">لتر</span>
          </div>
        </div>

        {/* progress bar */}
        <div className="w-full bg-blue-50 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-500 shadow-inner"
            style={{ width: `${Math.min((waterIntake / WATER_GOAL_LITERS) * 100, 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            disabled={saving}
            onClick={() => updateHabitsLog('water', waterIntake - 0.25)}
            className="w-1/3 py-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-black text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            -250 مل
          </button>
          <button 
            disabled={saving}
            onClick={() => updateHabitsLog('water', waterIntake + 0.25)}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-black text-xs transition-all active:scale-95 shadow-md shadow-blue-200 disabled:opacity-50"
          >
             شرب كوب مياه (250 مل) 💧
          </button>
        </div>

        {waterIntake >= WATER_GOAL_LITERS && (
          <div className="mt-4 text-xs text-green-600 font-black flex items-center gap-1 animate-in slide-in-from-bottom-2">
            <Check size={14} className="bg-green-100 rounded-full p-0.5" /> أحسنت، لقد حققت الهدف المائي لليوم!
          </div>
        )}
      </div>

      {/* 🔥 تتبع السعرات الحرارية */}
      <div className="bg-gradient-to-br from-white to-orange/5 p-6 rounded-[2rem] border border-orange/10 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Flame className="text-orange fill-orange" size={22}/> السعرات الحرارية
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">الهدف اليومي: {CALORIES_GOAL} سعرة</p>
          </div>
          <div className="text-2xl font-black text-orange">
            {caloriesConsumed} <span className="text-xs font-bold text-slate-400">سعرة</span>
          </div>
        </div>

        {/* progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-orange h-3 rounded-full transition-all duration-500 shadow-inner"
            style={{ width: `${Math.min((caloriesConsumed / CALORIES_GOAL) * 100, 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            disabled={saving}
            onClick={() => updateHabitsLog('calories', caloriesConsumed - 100)}
            className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all font-black text-sm active:scale-95 disabled:opacity-50"
          >
            -100
          </button>
          
          <input 
            type="number" 
            value={caloriesConsumed}
            disabled={saving}
            onChange={(e) => updateHabitsLog('calories', Number(e.target.value))}
            className="flex-1 text-center font-black text-xl bg-slate-50/50 border-2 border-transparent focus:border-orange focus:bg-white rounded-2xl p-2 outline-none transition-all"
          />

          <button 
            disabled={saving}
            onClick={() => updateHabitsLog('calories', caloriesConsumed + 100)}
            className="w-12 h-12 rounded-2xl bg-forest text-white hover:bg-forest/90 flex items-center justify-center transition-all font-black text-sm active:scale-95 shadow-md shadow-forest/10 disabled:opacity-50"
          >
            +100
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;