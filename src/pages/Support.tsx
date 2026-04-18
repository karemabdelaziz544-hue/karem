import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // شيلنا نقطتين
import { useFamily } from '../contexts/FamilyContext'; // شيلنا نقطتين
import SubscriptionGuard from '../components/SubscriptionGuard'; // شيلنا نقطتين
import { 
  Headset, ChevronLeft, User, ShieldCheck, ArrowRight 
} from 'lucide-react';
import ChatWindow from './ChatWindow'; 

const ClientChat: React.FC = () => {
  const { currentProfile } = useFamily();
  const [activeChannel, setActiveChannel] = useState<'doctor' | 'admin' | null>(null);

  // منطق حماية الاشتراك
  const isSubscribed = currentProfile?.subscription_status === 'active' && 
                       (!currentProfile.subscription_end_date || new Date(currentProfile.subscription_end_date) > new Date());

  if (currentProfile && !isSubscribed) {
      return <SubscriptionGuard />;
  }

  if (!activeChannel) {
    return (
      <div className="max-w-2xl mx-auto p-6 font-tajawal animate-in fade-in duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 mb-2">مركز المراسلات 💬</h1>
          <p className="text-slate-400 font-bold italic">اختر الجهة التي ترغب في التواصل معها</p>
        </div>

        <div className="grid gap-6">
          {/* قناة الدكتور */}
          <button 
            onClick={() => setActiveChannel('doctor')}
            className="group bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-forest shadow-sm hover:shadow-xl transition-all flex items-center justify-between text-right"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-forest/10 text-forest rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">الكوتش الخاص</h3>
                <p className="text-sm text-slate-400 font-bold mt-1">استفسارات التغذية والتدريب والمتابعة الطبية</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-forest group-hover:text-white transition-all">
              <ChevronLeft size={20} />
            </div>
          </button>

          {/* قناة الأدمن */}
          <button 
            onClick={() => setActiveChannel('admin')}
            className="group bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all flex items-center justify-between text-right"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Headset size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">الدعم الإداري</h3>
                <p className="text-sm text-slate-400 font-bold mt-1">مشاكل الاشتراك، المدفوعات، أو الأمور التقنية</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <ChevronLeft size={20} />
            </div>
          </button>
        </div>

        <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-right">
          <div className="flex items-center justify-end gap-3 text-slate-400 mb-2">
            <span className="text-xs font-black uppercase">خصوصية البيانات</span>
            <ShieldCheck size={18} />
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
            محادثاتك مع الكوتش سرية تماماً ولا يطلع عليها إلا الفريق الطبي المختص لضمان أفضل متابعة لحالتك.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-tajawal">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${activeChannel === 'doctor' ? 'bg-forest/10 text-forest' : 'bg-blue-50 text-blue-500'}`}>
                {activeChannel === 'doctor' ? <User size={24} /> : <Headset size={24} />}
            </div>
            <div className="text-right">
                <h3 className="font-bold text-slate-800">{activeChannel === 'doctor' ? 'الكوتش الطبي' : 'الدعم الفني'}</h3>
                <span className="text-[10px] text-green-500">متصل الآن</span>
            </div>
        </div>
        <button onClick={() => setActiveChannel(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
          <ArrowRight size={20} />
        </button>
      </div>

      <ChatWindow type={activeChannel} />
    </div>
  );
};

export default ClientChat;