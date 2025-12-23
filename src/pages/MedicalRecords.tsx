import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFamily } from '../contexts/FamilyContext';
import SubscriptionGuard from '../components/SubscriptionGuard';
import { 
    FileText, Upload, Activity, TrendingUp, Plus, Wand2, Loader2, 
    Scale, Dumbbell, Droplet, Calendar, ArrowUp, ArrowDown, Minus 
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MedicalRecords: React.FC = () => {
    
  const { currentProfile } = useFamily();
  const [activeTab, setActiveTab] = useState<'inbody' | 'docs'>('inbody');
  const [chartMetric, setChartMetric] = useState<'weight' | 'muscle' | 'fat'>('weight');

  const isSubscribed = currentProfile?.subscription_status === 'active' && 
                       (!currentProfile.subscription_end_date || new Date(currentProfile.subscription_end_date) > new Date());

  const [inbodyRecords, setInbodyRecords] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  
  const [showInbodyForm, setShowInbodyForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [muscle, setMuscle] = useState('');
  const [fat, setFat] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const getGroqApiKey = async () => {
    const { data, error } = await supabase.from('app_secrets').select('key_value').eq('key_name', 'GROQ_API_KEY').single();
    if (error || !data) throw new Error("لم يتم العثور على مفتاح الذكاء الاصطناعي");
    return data.key_value;
  };

  useEffect(() => {
    if (currentProfile) {
        fetchInbody();
        fetchDocs();
    }
  }, [currentProfile]);

  const fetchInbody = async () => {
    const { data } = await supabase.from('inbody_records').select('*').eq('user_id', currentProfile.id).order('record_date', { ascending: true });
    setInbodyRecords(data || []);
  };

  const fetchDocs = async () => {
    const { data } = await supabase.from('client_documents').select('*').eq('user_id', currentProfile.id).order('created_at', { ascending: false });
    setDocs(data || []);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // قللنا الحجم شوية لضمان سرعة التحليل
          const scaleSize = MAX_WIDTH / img.width;
          if (img.width > MAX_WIDTH) {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
          } else {
              canvas.width = img.width;
              canvas.height = img.height;
          }
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // ضغط الجودة
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 🔥 الدالة المصححة بالكامل
  const handleAnalyzeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // إعادة تعيين الحالة لتجنب التداخل
    setAnalyzing(true);
    const loadingToast = toast.loading('جارٍ قراءة ورقة الـ InBody...');

    try {
        const GROQ_API_KEY = await getGroqApiKey();
        const base64 = await compressImage(file);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct", // استخدمنا موديل 11b لأنه أسرع وأكثر استقراراً للصور
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Look at this InBody sheet. Identify:
                                1. Weight (kg)
                                2. Muscle Mass or SMM (kg)
                                3. Body Fat Percentage (%)
                                
                                Return ONLY a valid JSON object like this example, do not add markdown or extra text:
                                { "weight": 75.5, "muscle": 35.2, "fat": 18.5, "summary": "اكتب ملخص قصير جدا (جملتين) باللهجة المصرية عن الحالة" }` 
                            },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 500,
                // ❌ تم حذف response_format لأنه المسبب للمشكلة 400
            })
        });

        const json = await response.json();

        // فحص الأخطاء القادمة من Groq
        if (json.error) {
            console.error("Groq API Error:", json.error);
            throw new Error(json.error.message || "خطأ في الاتصال بخدمة الذكاء الاصطناعي");
        }

        const content = json.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("لم يتم استلام بيانات، حاول صورة أوضح");

        // 🔥 استخراج JSON بذكاء باستخدام Regex (لأن الموديل ممكن يكتب كلام زيادة)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("فشل استخراج الأرقام من النص");

        const data = JSON.parse(jsonMatch[0]);

        if (data) {
            setWeight(data.weight || '');
            setMuscle(data.muscle || '');
            setFat(data.fat || '');
            setAiSummary(data.summary || '');
            setShowInbodyForm(true);
            toast.success("تم استخراج البيانات! راجعها واضغط حفظ", { id: loadingToast });
        }

    } catch (err: any) {
        console.error("Analysis Error:", err);
        toast.error("حدث خطأ: " + err.message, { id: loadingToast });
    } finally {
        setAnalyzing(false);
        e.target.value = ''; 
    }
  };

  const handleInbodySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setUploading(true);
    try {
        await supabase.from('inbody_records').insert([{
            user_id: currentProfile.id,
            weight: parseFloat(weight),
            muscle_mass: muscle ? parseFloat(muscle) : null,
            fat_percent: fat ? parseFloat(fat) : null,
            ai_summary: aiSummary,
            record_date: new Date().toISOString()
        }]);
        setShowInbodyForm(false);
        setWeight(''); setMuscle(''); setFat(''); setAiSummary('');
        fetchInbody();
        toast.success("تم تسجيل القياس الجديد بنجاح 🚀");
    } catch (err: any) {
        toast.error(err.message);
    } finally {
        setUploading(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentProfile) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `${currentProfile.id}-${Math.random()}.${file.name.split('.').pop()}`;
    try {
        const { error } = await supabase.storage.from('medical-docs').upload(filePath, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('medical-docs').getPublicUrl(filePath);
        await supabase.from('client_documents').insert({
            user_id: currentProfile.id, file_name: file.name, file_url: publicUrl, file_type: 'general'
        });
        fetchDocs();
        toast.success("تم رفع المستند");
    } catch (err: any) { toast.error(err.message); } 
    finally { setUploading(false); }
  };

  const getLastRecord = () => inbodyRecords[inbodyRecords.length - 1];
  const getPrevRecord = () => inbodyRecords.length > 1 ? inbodyRecords[inbodyRecords.length - 2] : null;

  const calculateTrend = (current: number, prev: number) => {
      const diff = current - prev;
      return {
          value: Math.abs(diff).toFixed(1),
          direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
      };
  };

  const chartData = inbodyRecords.map(r => ({
      date: new Date(r.record_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      weight: r.weight,
      muscle: r.muscle_mass,
      fat: r.fat_percent
  }));

  if (!currentProfile) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-forest"/></div>;
  if (!isSubscribed) return <SubscriptionGuard />;

  const lastRec = getLastRecord();
  const prevRec = getPrevRecord();

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 px-4">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <Activity className="text-orange" size={32} />
                مركز القياسات
            </h1>
            <p className="text-gray-500 mt-1 font-medium">تابع تطور جسمك وتحاليلك في مكان واحد</p>
        </div>
        
        {/* Custom Tabs */}
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
            <button onClick={() => setActiveTab('inbody')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inbody' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                <Scale size={16}/> InBody
            </button>
            <button onClick={() => setActiveTab('docs')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                <FileText size={16}/> التحاليل
            </button>
        </div>
      </div>

      {activeTab === 'inbody' ? (
        <div className="space-y-8">
            
            {/* Top Stats Cards */}
            {lastRec ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Weight Card */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-forest/30 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-forest/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">الوزن الحالي</p>
                                <h3 className="text-3xl font-black text-gray-800">{lastRec.weight} <span className="text-sm font-medium text-gray-400">كجم</span></h3>
                            </div>
                            <div className="p-3 bg-forest/10 rounded-2xl text-forest"><Scale size={24}/></div>
                        </div>
                        {prevRec && (
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                                {(() => {
                                    const { value, direction } = calculateTrend(lastRec.weight, prevRec.weight);
                                    return (
                                        <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${direction === 'down' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                            {direction === 'down' ? <ArrowDown size={12}/> : direction === 'up' ? <ArrowUp size={12}/> : <Minus size={12}/>}
                                            {value} كجم
                                        </span>
                                    );
                                })()}
                                <span className="text-gray-400">من آخر مرة</span>
                            </div>
                        )}
                    </div>

                    {/* Muscle Card */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange/30 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">الكتلة العضلية</p>
                                <h3 className="text-3xl font-black text-gray-800">{lastRec.muscle_mass || '-'} <span className="text-sm font-medium text-gray-400">كجم</span></h3>
                            </div>
                            <div className="p-3 bg-orange/10 rounded-2xl text-orange"><Dumbbell size={24}/></div>
                        </div>
                        {prevRec && lastRec.muscle_mass && (
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                                {(() => {
                                    const { value, direction } = calculateTrend(lastRec.muscle_mass, prevRec.muscle_mass);
                                    return (
                                        <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                            {direction === 'up' ? <ArrowUp size={12}/> : direction === 'down' ? <ArrowDown size={12}/> : <Minus size={12}/>}
                                            {value} كجم
                                        </span>
                                    );
                                })()}
                                <span className="text-gray-400">من آخر مرة</span>
                            </div>
                        )}
                    </div>

                    {/* Fat Card */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">نسبة الدهون</p>
                                <h3 className="text-3xl font-black text-gray-800">{lastRec.fat_percent || '-'} <span className="text-sm font-medium text-gray-400">%</span></h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-500"><Droplet size={24}/></div>
                        </div>
                        {prevRec && lastRec.fat_percent && (
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                                {(() => {
                                    const { value, direction } = calculateTrend(lastRec.fat_percent, prevRec.fat_percent);
                                    return (
                                        <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${direction === 'down' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                            {direction === 'down' ? <ArrowDown size={12}/> : direction === 'up' ? <ArrowUp size={12}/> : <Minus size={12}/>}
                                            {value}%
                                        </span>
                                    );
                                })()}
                                <span className="text-gray-400">من آخر مرة</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-orange/5 p-6 rounded-2xl border border-orange/20 text-center text-orange font-bold">
                    ليس لديك سجلات بعد، أضف أول قياس لتبدأ رحلتك! 🚀
                </div>
            )}

            {/* Chart Section */}
            {inbodyRecords.length > 1 && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={20}/> تحليل التقدم</h3>
                        <div className="flex bg-gray-50 rounded-lg p-1">
                            {[{id: 'weight', label: 'الوزن'}, {id: 'muscle', label: 'عضلات'}, {id: 'fat', label: 'دهون'}].map(m => (
                                <button 
                                    key={m.id} 
                                    onClick={() => setChartMetric(m.id as any)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartMetric === m.id ? 'bg-white shadow-sm text-forest' : 'text-gray-400'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] w-full text-xs" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartMetric === 'weight' ? '#1e5631' : chartMetric === 'muscle' ? '#f97316' : '#3b82f6'} stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor={chartMetric === 'weight' ? '#1e5631' : chartMetric === 'muscle' ? '#f97316' : '#3b82f6'} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} domain={['auto', 'auto']} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey={chartMetric} 
                                    stroke={chartMetric === 'weight' ? '#1e5631' : chartMetric === 'muscle' ? '#f97316' : '#3b82f6'} 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorMetric)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Actions Area */}
            {!showInbodyForm && (
                <div className="grid md:grid-cols-2 gap-4">
                    <button onClick={() => setShowInbodyForm(true)} className="group py-5 border-2 border-dashed border-gray-200 bg-white rounded-3xl font-bold text-gray-500 hover:border-forest hover:text-forest hover:bg-forest/5 transition-all flex flex-col justify-center items-center gap-2">
                        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white transition-colors"><Plus size={24} /></div>
                        إدخال يدوي للأرقام
                    </button>
                    
                    <label className="group py-5 border-2 border-dashed border-orange/20 bg-orange/5 rounded-3xl font-bold text-orange hover:bg-orange/10 transition-all flex flex-col justify-center items-center gap-2 cursor-pointer relative overflow-hidden">
                        <input type="file" accept="image/*" onChange={handleAnalyzeImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                            {analyzing ? <Loader2 className="animate-spin text-orange" /> : <Wand2 className="text-orange" size={24} />}
                        </div>
                        {analyzing ? 'جاري قراءة الورقة بالذكاء الاصطناعي...' : 'صوّر ورقة الـ InBody والـ AI يحللها'}
                    </label>
                </div>
            )}

            {/* Form Section */}
            {showInbodyForm && (
                <form onSubmit={handleInbodySubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-orange/10 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">تسجيل قياس جديد</h3>
                        <button type="button" onClick={() => setShowInbodyForm(false)} className="text-gray-400 hover:text-red-500"><Plus className="rotate-45" size={24}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        <Input label="الوزن (Kg)" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required placeholder="مثال: 75.5" />
                        <Input label="العضلات (Kg)" type="number" step="0.1" value={muscle} onChange={e => setMuscle(e.target.value)} placeholder="اختياري" />
                        <Input label="الدهون (%)" type="number" step="0.1" value={fat} onChange={e => setFat(e.target.value)} placeholder="اختياري" />
                    </div>
                    {aiSummary && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 mb-6 flex gap-4 items-start">
                            <div className="bg-white p-2 rounded-full shadow-sm"><Wand2 size={18} className="text-blue-600"/></div>
                            <div>
                                <h4 className="text-blue-800 font-bold text-sm mb-1">رأي الكوتش الذكي:</h4>
                                <p className="text-blue-700 text-sm leading-relaxed">{aiSummary}</p>
                            </div>
                        </div>
                    )}
                    <Button className="w-full justify-center py-4 text-lg" disabled={uploading || analyzing}>
                        {uploading ? 'جاري الحفظ...' : 'حفظ القياس في السجل'}
                    </Button>
                </form>
            )}

            {/* History List */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Calendar size={20}/> سجل القياسات السابق</h3>
                {inbodyRecords.length === 0 ? (
                    <p className="text-gray-400 text-center py-10 bg-gray-50 rounded-3xl border border-dashed">لا يوجد سجلات سابقة</p>
                ) : (
                    inbodyRecords.slice().reverse().map((record) => (
                        <div key={record.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-lg hover:border-forest/20 transition-all gap-4 group">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-600 font-bold border border-gray-100 group-hover:bg-forest group-hover:text-white transition-colors">
                                    <span className="text-lg leading-none">{new Date(record.record_date).getDate()}</span>
                                    <span className="text-[10px] uppercase">{new Date(record.record_date).toLocaleString('default', { month: 'short' })}</span>
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-4 font-bold text-gray-800">
                                        <span className="text-xl">{record.weight} <span className="text-xs text-gray-400 font-normal">كجم</span></span>
                                        {record.muscle_mass && <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">💪 {record.muscle_mass} عضل</span>}
                                        {record.fat_percent && <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">💧 {record.fat_percent}% دهون</span>}
                                    </div>
                                    {record.ai_summary && <p className="text-xs text-gray-400 mt-2 line-clamp-1 max-w-md">{record.ai_summary}</p>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      ) : (
        /* Docs Tab */
        <div className="space-y-8 animate-in slide-in-from-left-8">
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:bg-white hover:border-forest hover:shadow-lg transition-all relative cursor-pointer bg-gray-50 group">
                <input type="file" onChange={handleDocUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload size={32} className="text-forest" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">اضغط لرفع ملف جديد</h3>
                <p className="text-gray-400 text-sm">صور تحاليل، روشتة، أو أي مستند طبي (JPG, PNG, PDF)</p>
                {uploading && <p className="text-orange text-sm mt-4 font-bold animate-pulse">جاري الرفع...</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map(doc => (
                    <div key={doc.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-800 truncate text-sm">{doc.file_name}</h4>
                                <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-gray-50 px-4 py-2 rounded-xl hover:bg-forest hover:text-white transition-colors">
                            عرض
                        </a>
                    </div>
                ))}
            </div>
            {docs.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300"/>
                    <p>لا يوجد مستندات مرفوعة</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;