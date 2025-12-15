import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Droplet, Footprints, Plus, Minus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  userId: string;
}

const HabitTracker: React.FC<Props> = ({ userId }) => {
  const [waterCups, setWaterCups] = useState(0);
  const [steps, setSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // هدف يومي افتراضي (ممكن نخليه ييجي من الداتابيز بعدين)
  const WATER_GOAL = 8;
  const STEPS_GOAL = 6000;

  useEffect(() => {
    fetchTodayHabits();
  }, [userId]);

  const fetchTodayHabits = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // نجيب سجل النهاردة
    const { data, error } = await supabase
      .from('daily_habits')
      .select('*')
      .eq('user_id', userId)
      .eq('record_date', today)
.maybeSingle(); // 👈 الحل: لو مفيش داتا هيرجع null بدل ما يضرب error
    if (data) {
        setWaterCups(data.water_cups);
        setSteps(data.steps_count);
    }
    setLoading(false);
  };

  const updateHabit = async (type: 'water' | 'steps', value: number) => {
    const today = new Date().toISOString().split('T')[0];
    setSaving(true);

    try {
        const updates: any = {
            user_id: userId,
            record_date: today,
        };

        if (type === 'water') {
            updates.water_cups = value;
            setWaterCups(value);
        } else {
            updates.steps_count = value;
            setSteps(value);
        }

        // Upsert: لو موجود حدثه، لو مش موجود أنشئه
        const { error } = await supabase.from('daily_habits').upsert(updates, { onConflict: 'user_id, record_date' });
        
        if (error) throw error;
        // toast.success("تم الحفظ", { duration: 1000 }); // اختياري عشان ميبقاش مزعج

    } catch (err) {
        console.error(err);
        toast.error("فشل حفظ التقدم");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="h-40 bg-gray-100 rounded-3xl animate-pulse"></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* 💧 تتبع المياه */}
        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                        <Droplet className="text-blue-500 fill-blue-500" size={20}/> شرب المياه
                    </h3>
                    <p className="text-xs text-blue-400 font-bold mt-1">الهدف: {WATER_GOAL} أكواب</p>
                </div>
                <div className="text-2xl font-black text-blue-600">{waterCups}</div>
            </div>

            {/* رسم الكوبيات */}
            <div className="flex flex-wrap gap-2 mb-2">
                {Array.from({ length: WATER_GOAL }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => updateHabit('water', i + 1 === waterCups ? i : i + 1)} // ضغطة تزود، ضغطة على الاخير تنقص
                        className={`w-8 h-10 rounded-b-xl border-2 transition-all ${
                            i < waterCups 
                            ? 'bg-blue-500 border-blue-500 shadow-md shadow-blue-200' 
                            : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                        }`}
                    />
                ))}
            </div>
            {waterCups >= WATER_GOAL && (
                <div className="text-xs text-green-600 font-bold flex items-center gap-1 animate-in fade-in">
                    <Check size={12}/> ممتاز! حققت هدفك اليوم
                </div>
            )}
        </div>

        {/* 🏃 تتبع الخطوات */}
        <div className="bg-white p-6 rounded-3xl border border-orange/10 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-forest flex items-center gap-2">
                        <Footprints className="text-orange" size={20}/> الخطوات
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mt-1">الهدف: {STEPS_GOAL} خطوة</p>
                </div>
                {/* Progress Circle بسيط */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            className={steps >= STEPS_GOAL ? "text-green-500" : "text-orange"}
                            strokeDasharray={125}
                            strokeDashoffset={125 - (Math.min(steps, STEPS_GOAL) / STEPS_GOAL) * 125}
                        />
                    </svg>
                    <span className="absolute text-[8px] font-bold">{Math.round((steps/STEPS_GOAL)*100)}%</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => updateHabit('steps', Math.max(0, steps - 500))}
                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                    <Minus size={18} />
                </button>
                
                <div className="flex-1 relative">
                    <input 
                        type="number" 
                        value={steps}
                        onChange={(e) => updateHabit('steps', Number(e.target.value))}
                        className="w-full text-center font-black text-xl bg-transparent border-b-2 border-gray-100 focus:border-orange outline-none pb-1"
                    />
                    <span className="block text-center text-[10px] text-gray-400">خطوة</span>
                </div>

                <button 
                    onClick={() => updateHabit('steps', steps + 500)}
                    className="w-10 h-10 rounded-xl bg-forest text-white hover:bg-forest/90 flex items-center justify-center shadow-lg shadow-forest/20 transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default HabitTracker;