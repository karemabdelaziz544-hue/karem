import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, CheckCircle, Circle, Trophy } from 'lucide-react';

interface PlanDetailsModalProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ planId, isOpen, onClose }) => {
  const [tasksByDay, setTasksByDay] = useState<Record<string, any[]>>({});
  const [dayNames, setDayNames] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState<string>('');
  const [planTitle, setPlanTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanDetails();
    } else {
      // تصفير البيانات عند الإغلاق
      setTasksByDay({});
      setDayNames([]);
      setActiveDay('');
      setLoading(true);
    }
  }, [isOpen, planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      
      // 1. جلب عنوان الخطة
      const { data: plan } = await supabase.from('plans').select('title').eq('id', planId).single();
      if (plan) setPlanTitle(plan.title);

      // 2. جلب المهام
      const { data: tasks } = await supabase
        .from('plan_tasks')
        .select('*')
        .eq('plan_id', planId)
        .order('order_index', { ascending: true });

      if (tasks) {
        const grouped: Record<string, any[]> = {};
        const days: string[] = [];

        tasks.forEach((task) => {
          const dayName = task.day_name || 'اليوم الأول';
          if (!grouped[dayName]) {
            grouped[dayName] = [];
            days.push(dayName);
          }
          grouped[dayName].push(task);
        });

        setTasksByDay(grouped);
        setDayNames(days);
        if (days.length > 0) setActiveDay(days[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-forest p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={20} className="text-orange" />
              {loading ? 'جاري التحميل...' : planTitle}
            </h2>
            <p className="text-white/60 text-xs mt-1">تفاصيل النظام الكاملة</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-bold p-10">
              جاري جلب تفاصيل النظام...
            </div>
          ) : dayNames.length === 0 ? (
            <div className="p-10 text-center text-gray-400">لا توجد مهام مسجلة في هذا النظام.</div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex overflow-x-auto p-4 gap-2 border-b border-gray-100 bg-gray-50/50 no-scrollbar shrink-0">
                {dayNames.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0
                      ${activeDay === day 
                        ? 'bg-orange text-white shadow-md' 
                        : 'bg-white text-gray-500 hover:bg-gray-200 border border-gray-100'
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 <h3 className="font-bold text-forest mb-2 sticky top-0 bg-white z-10 py-2 border-b border-gray-50">
                    مهام {activeDay}
                 </h3>
                 {tasksByDay[activeDay]?.map((task) => (
                   <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-orange/30 transition-colors">
                      {task.is_completed ? (
                          <CheckCircle size={20} className="text-green-500 shrink-0" />
                      ) : (
                          <Circle size={20} className="text-gray-300 shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {task.content}
                      </span>
                   </div>
                 ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 text-sm">
                إغلاق
            </button>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailsModal;