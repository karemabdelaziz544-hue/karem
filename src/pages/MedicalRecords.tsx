import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFamily } from '../contexts/FamilyContext'; 
import SubscriptionGuard from '../components/SubscriptionGuard'; 
import { FileText, Upload, Activity, TrendingUp, Plus, Wand2, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const MedicalRecords: React.FC = () => {
    
  const { currentProfile } = useFamily(); 
  const [activeTab, setActiveTab] = useState<'inbody' | 'docs'>('inbody');
   
  // التحقق من حالة الاشتراك
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

  // دالة مساعدة لجلب مفتاح API من قاعدة البيانات
  const getGroqApiKey = async () => {
    const { data, error } = await supabase
      .from('app_secrets')
      .select('key_value')
      .eq('key_name', 'GROQ_API_KEY')
      .single();
    
    if (error || !data) {
      throw new Error("لم يتم العثور على مفتاح الذكاء الاصطناعي في النظام");
    }
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
          const MAX_WIDTH = 1000;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyzeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setAnalyzing(true);
    const loadingToast = toast.loading('جارٍ تحليل الصورة...');

    try {
        // 1. جلب المفتاح من Supabase أولاً
        const GROQ_API_KEY = await getGroqApiKey();

        // 2. ضغط الصورة
        const base64 = await compressImage(file);
        
        // 3. إرسال الطلب إلى Groq
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct", // الموديل المطلوب
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this InBody sheet image. Extract numbers: Weight (kg), Muscle Mass (kg), Fat Percentage (%). Write a short summary in Egyptian Arabic. Return ONLY JSON: { \"weight\": 0, \"muscle\": 0, \"fat\": 0, \"summary\": \"...\" }" },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 1024
            })
        });

        const json = await response.json();
        if (json.error) throw new Error(json.error.message);

        const content = json.choices[0]?.message?.content;
        if (!content) throw new Error("لم يتم استلام بيانات من الذكاء الاصطناعي");

        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);

        if (data) {
            setWeight(data.weight || '');
            setMuscle(data.muscle || '');
            setFat(data.fat || '');
            setAiSummary(data.summary || '');
            setShowInbodyForm(true);
            toast.success("✨ تم التحليل بنجاح!", { id: loadingToast });
        }

    } catch (err: any) {
        console.error(err);
        toast.error("فشل التحليل: " + err.message, { id: loadingToast });
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
        toast.success("تم الحفظ بنجاح ✅");
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
            user_id: currentProfile.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: 'general'
        });
        fetchDocs();
        toast.success("تم رفع الملف ✅");
    } catch (err: any) {
        toast.error(err.message);
    } finally {
        setUploading(false);
    }
  };

  const getProgress = () => {
    if (inbodyRecords.length < 2) return null;
    const first = inbodyRecords[0];
    const last = inbodyRecords[inbodyRecords.length - 1];
    const weightDiff = (last.weight - first.weight).toFixed(1);
    const muscleDiff = (last.muscle_mass - first.muscle_mass).toFixed(1);
    const fatDiff = (last.fat_percent - first.fat_percent).toFixed(1);
    return { weightDiff, muscleDiff, fatDiff, first, last };
  };

  if (!currentProfile) return <div className="text-center py-20">جاري التحميل...</div>;
  if (!isSubscribed) return <SubscriptionGuard />;

  const progress = getProgress();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-forest flex items-center gap-2">
                <Activity className="text-orange" /> سجلات صحتك
            </h1>
            <p className="text-gray-500 text-sm mt-1">
                الخاصة بـ: <span className="text-forest font-bold">{currentProfile.full_name}</span>
            </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button onClick={() => setActiveTab('inbody')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inbody' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>InBody</button>
            <button onClick={() => setActiveTab('docs')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'docs' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>مستندات</button>
        </div>
      </div>

      {activeTab === 'inbody' ? (
        <div className="space-y-8">
            {progress && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-orange/10 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-orange" />
                        <h3 className="font-bold text-lg text-forest">ملخص رحلتك</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-gray-400 text-xs font-bold block mb-1">الوزن</span>
                            <div className="flex items-center justify-center gap-1 font-black text-2xl text-gray-800">{progress.last.weight} <span className="text-xs font-normal">كجم</span></div>
                            <span className={`text-xs font-bold flex items-center justify-center gap-1 mt-1 ${Number(progress.weightDiff) <= 0 ? 'text-green-600' : 'text-red-500'}`}>{Math.abs(Number(progress.weightDiff))} كجم</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-gray-400 text-xs font-bold block mb-1">العضلات</span>
                            <div className="flex items-center justify-center gap-1 font-black text-2xl text-gray-800">{progress.last.muscle_mass} <span className="text-xs font-normal">كجم</span></div>
                            <span className={`text-xs font-bold flex items-center justify-center gap-1 mt-1 ${Number(progress.muscleDiff) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{Math.abs(Number(progress.muscleDiff))} كجم</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-gray-400 text-xs font-bold block mb-1">الدهون</span>
                            <div className="flex items-center justify-center gap-1 font-black text-2xl text-gray-800">{progress.last.fat_percent}%</div>
                            <span className={`text-xs font-bold flex items-center justify-center gap-1 mt-1 ${Number(progress.fatDiff) <= 0 ? 'text-green-600' : 'text-red-500'}`}>{Math.abs(Number(progress.fatDiff))}%</span>
                        </div>
                    </div>
                </div>
            )}

            {!showInbodyForm && (
                <div className="grid md:grid-cols-2 gap-4">
                    <button onClick={() => setShowInbodyForm(true)} className="py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all flex justify-center items-center gap-2">
                        <Plus size={20} /> إدخال يدوي
                    </button>
                    <label className="py-4 border-2 border-dashed border-orange/30 text-orange bg-orange/5 rounded-2xl font-bold hover:bg-orange/10 transition-all flex justify-center items-center gap-2 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md">
                        <input type="file" accept="image/*" onChange={handleAnalyzeImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {analyzing ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                        {analyzing ? 'جاري تحليل الصورة...' : 'رفع صورة InBody وتحليلها بالـ AI'}
                    </label>
                </div>
            )}

            {showInbodyForm && (
                <form onSubmit={handleInbodySubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-orange/20 animate-in slide-in-from-top-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Input label="الوزن (Kg)" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required />
                        <Input label="العضلات (Kg)" type="number" step="0.1" value={muscle} onChange={e => setMuscle(e.target.value)} />
                        <Input label="الدهون (%)" type="number" step="0.1" value={fat} onChange={e => setFat(e.target.value)} />
                    </div>
                    {aiSummary && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 animate-in fade-in">
                            <h4 className="text-blue-800 font-bold text-xs mb-2 flex items-center gap-1"><Wand2 size={12}/> تقرير الذكاء الاصطناعي:</h4>
                            <p className="text-blue-700 text-sm leading-relaxed font-medium">{aiSummary}</p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Button className="flex-1 justify-center" disabled={uploading || analyzing}>{uploading ? 'جاري الحفظ...' : 'حفظ القياس'}</Button>
                        <button type="button" onClick={() => {setShowInbodyForm(false); setAiSummary('');}} className="px-6 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">إلغاء</button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                <h3 className="font-bold text-gray-400 text-sm">السجل التاريخي ({inbodyRecords.length})</h3>
                {inbodyRecords.slice().reverse().map((record) => (
                    <div key={record.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-all gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-forest/5 rounded-full flex items-center justify-center text-forest font-bold text-sm">
                                {new Date(record.record_date).getDate()}
                                <span className="text-[8px] block -mt-1">{new Date(record.record_date).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 font-bold text-gray-800">
                                    <span>⚖️ {record.weight} كجم</span>
                                    {record.muscle_mass && <span className="text-sm text-gray-500">💪 {record.muscle_mass} عضل</span>}
                                    {record.fat_percent && <span className="text-sm text-gray-500">💧 {record.fat_percent}% دهون</span>}
                                </div>
                                <span className="text-xs text-gray-400 block mt-1">
                                    {new Date(record.record_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        {record.ai_summary && (
                            <div className="bg-blue-50 px-3 py-2 rounded-xl text-xs text-blue-700 max-w-md line-clamp-2 md:line-clamp-1">💡 {record.ai_summary}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      ) : (
        /* تبويب المستندات */
        <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-white hover:border-forest transition-all relative cursor-pointer bg-gray-50">
                <input type="file" onChange={handleDocUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-bold">اضغط لرفع تحاليل أو مستندات طبية</p>
                {uploading && <p className="text-orange text-sm mt-2 font-bold animate-pulse">جاري الرفع...</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                            <span className="text-sm font-bold text-gray-700 truncate">{doc.file_name}</span>
                        </div>
                        <a href={doc.file_url} target="_blank" className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-forest hover:text-white transition-colors">عرض</a>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;