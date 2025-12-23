import React, { useEffect, useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, FileText, MessageCircle, Crown, 
    ArrowRight, Star, ShieldCheck, Zap, LayoutDashboard 
} from 'lucide-react';
import SmartDashboard from '../components/dashboard/SmartDashboard';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const { currentProfile, loading: profileLoading } = useFamily();
  const navigate = useNavigate();
  const [checkingSub, setCheckingSub] = useState(true);

  // التحقق من حالة الاشتراك وتاريخه
  const isSubscribed = currentProfile?.subscription_status === 'active';
  const hasHistory = !!currentProfile?.subscription_end_date; // هل اشترك من قبل؟
  
  // تحديد نص الحالة (التصحيح المطلوب) ✅
  const getStatusLabel = () => {
      if (isSubscribed) return { text: 'مشترك نشط', color: 'text-green-600 bg-green-50' };
      if (hasHistory) return { text: 'اشتراك منتهي', color: 'text-red-600 bg-red-50' };
      return { text: 'غير مشترك', color: 'text-gray-500 bg-gray-100' }; // الحالة الجديدة
  };

  const statusObj = getStatusLabel();

  useEffect(() => {
      if (!profileLoading) setCheckingSub(false);
  }, [profileLoading]);

  if (profileLoading || checkingSub) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-10">
      
      {/* 1. Header Section (تم تعديل حالة الاشتراك هنا) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center text-2xl">
                  👋
              </div>
              <div>
                  <h1 className="text-2xl font-black text-gray-800">مرحباً، {currentProfile?.full_name?.split(' ')[0]}</h1>
                  <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusObj.color}`}>
                          {statusObj.text}
                      </span>
                      {!isSubscribed && (
                          <span className="text-xs text-gray-400">ابدأ رحلتك الصحية الآن</span>
                      )}
                  </div>
              </div>
          </div>

          {!isSubscribed && (
              <button 
                onClick={() => navigate('/dashboard/subscriptions')}
                className="bg-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange/90 transition shadow-lg shadow-orange/20 flex items-center gap-2 animate-pulse"
              >
                  <Crown size={18} /> اشترك الآن
              </button>
          )}
      </div>

      {/* 2. Content Section */}
      {isSubscribed ? (
        // ✅ سيناريو المشترك: عرض لوحة التحكم الذكية
        <SmartDashboard />
      ) : (
        // ✅ سيناريو غير المشترك: تصميم جديد وجذاب (بدلاً من المربع الفارغ)
        <div className="grid md:grid-cols-2 gap-6">
            
            {/* بطاقة الترحيب والدعوة للاشتراك */}
            <div className="bg-gradient-to-br from-forest to-green-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                {/* خلفية زخرفية */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                    <div className="bg-white/20 w-fit px-4 py-1.5 rounded-full text-xs font-bold mb-6 backdrop-blur-md border border-white/10">
                        🚀 رحلتك تبدأ من هنا
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                        جاهز توصل لأحسن نسخة من نفسك؟
                    </h2>
                    <p className="text-green-100/90 text-lg mb-8 leading-relaxed max-w-md">
                        نظام هيليكس مش مجرد دايت، ده أسلوب حياة مصمم خصيصاً ليك. خطط ذكية، متابعة طبية، ونتائج حقيقية.
                    </p>
                    
                    <button 
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="bg-orange text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange/90 transition shadow-xl shadow-orange/30 flex items-center gap-3 w-fit group"
                    >
                        عرض الباقات والاشتراك <ArrowRight className="group-hover:translate-x-[-4px] transition-transform" />
                    </button>
                </div>
            </div>

            {/* بطاقة المميزات */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Star className="text-orange fill-orange" size={20}/> ليه تشترك معانا؟
                </h3>
                
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-lg">خطط ذكية متغيرة</h4>
                            <p className="text-gray-500 text-sm mt-1">جدولك الغذائي والرياضي بيتغير يومياً بناءً على استجابة جسمك.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-lg">تقارير InBody وتحليل</h4>
                            <p className="text-gray-500 text-sm mt-1">تابع تطور عضلاتك ودهونك برسوم بيانية دقيقة وسهلة الفهم.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-lg">متابعة طبية مباشرة</h4>
                            <p className="text-gray-500 text-sm mt-1">تواصل مباشر مع الكابتن والدكتور لأي استفسار في أي وقت.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-400 justify-center">
                        <ShieldCheck size={16} /> ضمان استرجاع الأموال خلال 14 يوم
                    </div>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default Dashboard;