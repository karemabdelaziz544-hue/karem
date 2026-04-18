import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    FileText, Activity, Scale, Dumbbell, 
    Droplet, Calendar, Eye, Loader2, Image as ImageIcon, ExternalLink 
} from 'lucide-react';

interface Props {
  targetUserId: string;
}

const DoctorMedicalView: React.FC<Props> = ({ targetUserId }) => {
  const [activeTab, setActiveTab] = useState<'inbody' | 'docs'>('inbody');
  const [inbodyRecords, setInbodyRecords] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]); // 👈 مصفوفة التحاليل
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) return;
      setLoading(true);
      
      try {
        // 1. جلب سجلات الـ InBody
        const { data: inbodyData } = await supabase
          .from('inbody_records')
          .select('*')
          .eq('user_id', targetUserId)
          .order('record_date', { ascending: false });

        // 2. جلب سجلات التحاليل (Documents) - السطر ده هو اللي كان ناقص أو فيه مشكلة
        const { data: docsData } = await supabase
          .from('client_documents')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        setInbodyRecords(inbodyData || []);
        setDocs(docsData || []); // 👈 تخزين التحاليل
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest" size={40} /></div>;

  const lastRec = inbodyRecords[0];

  return (
    <div className="w-full font-tajawal animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit shadow-inner">
        <button 
          onClick={() => setActiveTab('inbody')} 
          className={`px-10 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'inbody' ? 'bg-white text-forest shadow-md' : 'text-slate-500 hover:text-forest'}`}
        >
          InBody
        </button>
        <button 
          onClick={() => setActiveTab('docs')} 
          className={`px-10 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'docs' ? 'bg-white text-forest shadow-md' : 'text-slate-500 hover:text-forest'}`}
        >
          التحاليل والوثائق ({docs.length})
        </button>
      </div>

      {activeTab === 'inbody' ? (
        <div className="space-y-8">
          {/* Stats Cards */}
          {lastRec ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="آخر وزن مسجل" value={lastRec.weight} unit="كجم" icon={<Scale size={20}/>} color="forest" />
              <StatCard label="الكتلة العضلية" value={lastRec.muscle_mass} unit="كجم" icon={<Dumbbell size={20}/>} color="orange" />
              <StatCard label="نسبة الدهون" value={lastRec.fat_percent} unit="%" icon={<Droplet size={20}/>} color="blue" />
            </div>
          ) : (
            <div className="bg-slate-50 p-10 rounded-[2rem] text-center border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold italic">لا توجد قياسات InBody مسجلة لهذا المريض حتى الآن.</p>
            </div>
          )}

          {/* سجل الـ InBody */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 italic px-2">
               <Activity size={20} className="text-forest" /> تاريخ القياسات والتحليل الذكي
            </h3>
            
            {inbodyRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-3 rounded-2xl text-slate-600 font-black text-center min-w-[65px]">
                        <p className="text-[10px] uppercase opacity-50">{new Date(record.record_date).toLocaleString('ar-EG', { month: 'short' })}</p>
                        <p className="text-xl leading-none">{new Date(record.record_date).getDate()}</p>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg">قياس {new Date(record.record_date).toLocaleDateString('ar-EG')}</h4>
                        <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold uppercase">Helix AI Verified</span>
                      </div>
                    </div>

                    {record.image_url && (
                      <button 
                        onClick={() => window.open(record.image_url, '_blank')}
                        className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-forest transition-all shadow-lg shadow-slate-200"
                      >
                        <ImageIcon size={16} /> عرض ورقة الـ InBody
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                      <p className="text-[11px] font-black text-forest uppercase mb-3 flex items-center gap-2">
                        <Wand2 size={14} /> رؤية الكوتش الذكي:
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed font-bold italic">
                        "{record.ai_summary || 'لم يقم الذكاء الاصطناعي بكتابة تحليل لهذا القياس.'}"
                      </p>
                    </div>

                    {record.image_url ? (
                      <div 
                        onClick={() => window.open(record.image_url, '_blank')}
                        className="relative group rounded-[1.5rem] overflow-hidden border border-slate-100 cursor-pointer h-40"
                      >
                         <img src={record.image_url} alt="InBody" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="bg-white/90 p-3 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                               <Eye size={24} className="text-slate-800" />
                            </div>
                         </div>
                      </div>
                    ) : (
                        <div className="bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200 flex items-center justify-center h-40">
                            <p className="text-[10px] font-bold text-slate-400">لا توجد صورة مرفقة للقياس</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 👈 قسم التحاليل (Docs) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {docs.length > 0 ? (
            docs.map(doc => (
              <div key={doc.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-black text-slate-800 truncate text-sm" title={doc.file_name}>{doc.file_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Medical Record</span>
                    <button 
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="text-[10px] font-black bg-forest/5 text-forest px-4 py-2 rounded-xl hover:bg-forest hover:text-white transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={12} /> فتح المستند
                    </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">المريض لم يقم برفع أي تحاليل طبية حتى الآن.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// مكون مساعد للكروت العلوية
const StatCard = ({ label, value, unit, icon, color }: { label: string; value: number | null; unit: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-800">{value || '--'} <small className="text-[11px] font-bold text-slate-400">{unit}</small></h3>
    </div>
    <div className={`p-3 rounded-2xl ${color === 'forest' ? 'bg-forest/5 text-forest' : color === 'orange' ? 'bg-orange/5 text-orange' : 'bg-blue-50 text-blue-500'}`}>
        {icon}
    </div>
  </div>
);

// 👈 مكون Wand2 المفقود في الـ imports بس موجود في كودك
const Wand2 = ({ size }: { size?: number }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 5-5"/><path d="M9 15l-1-1 5-5 1 1-5 5z"/><path d="m19 9 1 1"/><path d="M15 5l1 1"/><path d="m19 2-1 1"/><path d="M22 5l-1-1"/><path d="m20 7-1 1"/></svg>
);

export default DoctorMedicalView;