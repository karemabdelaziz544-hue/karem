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
import type { InbodyRecord, ClientDocument } from '../types';

const MedicalRecords: React.FC = () => {

    const { currentProfile } = useFamily();
    const [activeTab, setActiveTab] = useState<'inbody' | 'docs'>('inbody');
    const [chartMetric, setChartMetric] = useState<'weight' | 'muscle' | 'fat'>('weight');

    const isSubscribed = currentProfile?.subscription_status === 'active' &&
        (!currentProfile.subscription_end_date || new Date(currentProfile.subscription_end_date) > new Date());

    const [inbodyRecords, setInbodyRecords] = useState<InbodyRecord[]>([]);
    const [docs, setDocs] = useState<ClientDocument[]>([]);

    const [showInbodyForm, setShowInbodyForm] = useState(false);
    const [weight, setWeight] = useState('');
    const [muscle, setMuscle] = useState('');
    const [fat, setFat] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [uploadedImageUrl, setUploadedImageUrl] = useState(''); // لحفظ رابط صورة الان بودي

    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (currentProfile) {
            fetchInbody();
            fetchDocs();
        }
    }, [currentProfile]);

    const fetchInbody = async () => {
        if (!currentProfile) return;
        const { data } = await supabase.from('inbody_records').select('*').eq('user_id', currentProfile.id).order('record_date', { ascending: true });
        setInbodyRecords(data || []);
    };

    const fetchDocs = async () => {
        if (!currentProfile) return;
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
                    const MAX_WIDTH = 800;
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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl.split(',')[1]);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // 🔥 دالة رفع صورة الـ InBody وتحليلها
    const handleAnalyzeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setAnalyzing(true);
        const loadingToast = toast.loading('جارٍ رفع ومعالجة ورقة الـ InBody...');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentProfile!.id}-${Date.now()}.${fileExt}`;
            const filePath = `inbody/${fileName}`;

            // 1. رفع الصورة
            const { error: uploadError } = await supabase.storage
                .from('medical-docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. حفظ المسار لتأمينه لاحقاً
            setUploadedImageUrl(filePath);
            
            // 3. ضغط الصورة
            const base64 = await compressImage(file);

            // 4. استدعاء الـ Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('analyze-inbody', {
                body: { base64 }
            });
            
            if (functionError) {
                throw new Error("فشل الاتصال بالخادم، يرجى المحاولة لاحقاً.");
            }        
            
            const result = data.data; // النتائج من الـ Function

            if (result) {
                setWeight(result.weight?.toString() || '');
                setMuscle(result.muscle?.toString() || '');
                setFat(result.fat?.toString() || '');
                setAiSummary(result.summary || '');
                setShowInbodyForm(true);
                toast.success("تم استخراج البيانات! راجعها واضغط حفظ", { id: loadingToast });
            }

        } catch (err: any) {
            toast.error("حدث خطأ: " + err.message, { id: loadingToast });
        } finally {
            setAnalyzing(false);
            e.target.value = '';
        }
    };

    // 🔥 دالة حفظ الـ InBody برابط الصورة والتحليل
    const handleInbodySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProfile) return;
        setUploading(true);
        try {
            const { error } = await supabase.from('inbody_records').insert([{
                user_id: currentProfile.id,
                weight: parseFloat(weight),
                muscle_mass: muscle ? parseFloat(muscle) : null,
                fat_percent: fat ? parseFloat(fat) : null,
                ai_summary: aiSummary,
                image_url: uploadedImageUrl,
                record_date: new Date().toISOString()
            }]);

            if (error) throw error;

            setShowInbodyForm(false);
            setWeight(''); setMuscle(''); setFat(''); setAiSummary(''); setUploadedImageUrl('');
            fetchInbody();
            toast.success("تم تسجيل القياس الجديد بنجاح 🚀");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    // 🔥 دالة لرفع التحاليل (Docs) لضمان تخزين الرابط الحقيقي للدكتور
    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentProfile) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `docs/${currentProfile.id}/${fileName}`;

        try {
            // 1. رفع الملف للـ Storage
            const { error: uploadError } = await supabase.storage
                .from('medical-docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. حفظ مسار الملف (filePath) في الداتا بيز بدل الرابط المؤقت
            const { error: dbError } = await supabase.from('client_documents').insert({
                user_id: currentProfile.id,
                file_name: file.name,
                file_url: filePath, 
                file_type: 'general'
            });

            if (dbError) throw dbError;

            fetchDocs();
            toast.success("تم رفع المستند بنجاح");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    // 🔥 دالة توليد الرابط الآمن عند الضغط على عرض المستند
    const handleViewDocument = async (pathOrUrl: string) => {
        const loadingToast = toast.loading('جاري تأمين الرابط...');
        try {
            // لو الرابط قديم وعام (بيبدأ بـ http)، افتحه فوراً
            if (pathOrUrl.startsWith('http')) {
                toast.dismiss(loadingToast);
                window.open(pathOrUrl, '_blank');
                return;
            }

            // لو مسار حديث، نولد له رابط مؤقت ومحمي صالح لمدة ساعة (3600 ثانية)
            const { data, error } = await supabase.storage
                .from('medical-docs')
                .createSignedUrl(pathOrUrl, 3600);

            if (error || !data) throw new Error("فشل في فتح الملف السري");

            toast.dismiss(loadingToast);
            window.open(data.signedUrl, '_blank');
        } catch (err: any) {
            toast.error(err.message, { id: loadingToast });
        }
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

    if (!currentProfile) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-forest" /></div>;
    if (!isSubscribed) return <SubscriptionGuard />;

    const lastRec = getLastRecord();
    const prevRec = getPrevRecord();

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 px-4 font-tajawal">

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
                        <Scale size={16} /> InBody
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                        <FileText size={16} /> التحاليل
                    </button>
                </div>
            </div>

            {activeTab === 'inbody' ? (
                <div className="space-y-8">

                    {/* Top Stats Cards */}
                    {lastRec ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-forest/30 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-forest/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-gray-500 text-xs font-bold mb-1">الوزن الحالي</p>
                                        <h3 className="text-3xl font-black text-gray-800">{lastRec.weight} <span className="text-sm font-medium text-gray-400">كجم</span></h3>
                                    </div>
                                    <div className="p-3 bg-forest/10 rounded-2xl text-forest"><Scale size={24} /></div>
                                </div>
                                {prevRec && (
                                    <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                                        {(() => {
                                            const { value, direction } = calculateTrend(lastRec.weight, prevRec.weight);
                                            return (
                                                <span className={`px-2 py-1 rounded-lg flex items-center gap-1 ${direction === 'down' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                    {direction === 'down' ? <ArrowDown size={12} /> : direction === 'up' ? <ArrowUp size={12} /> : <Minus size={12} />}
                                                    {value} كجم
                                                </span>
                                            );
                                        })()}
                                        <span className="text-gray-400">من آخر مرة</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange/30 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div><p className="text-gray-500 text-xs font-bold mb-1">الكتلة العضلية</p><h3 className="text-3xl font-black text-gray-800">{lastRec.muscle_mass || '-'} <span className="text-sm font-medium text-gray-400">كجم</span></h3></div>
                                    <div className="p-3 bg-orange/10 rounded-2xl text-orange"><Dumbbell size={24} /></div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div><p className="text-gray-500 text-xs font-bold mb-1">نسبة الدهون</p><h3 className="text-3xl font-black text-gray-800">{lastRec.fat_percent || '-'} <span className="text-sm font-medium text-gray-400">%</span></h3></div>
                                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-500"><Droplet size={24} /></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-orange/5 p-6 rounded-2xl border border-orange/20 text-center text-orange font-bold">
                            ليس لديك سجلات بعد، أضف أول قياس لتبدأ رحلتك! 🚀
                        </div>
                    )}

                    {/* Chart Section */}
                    {inbodyRecords.length > 1 && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1e5631" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#1e5631" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} domain={['auto', 'auto']} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey={chartMetric} stroke="#1e5631" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Actions Area */}
                    {!showInbodyForm && (
                        <div className="grid md:grid-cols-2 gap-4">
                            <button onClick={() => setShowInbodyForm(true)} className="group py-5 border-2 border-dashed border-gray-200 bg-white rounded-3xl font-bold text-gray-500 hover:border-forest hover:text-forest hover:bg-forest/5 transition-all flex flex-col justify-center items-center gap-2">
                                <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white transition-colors"><Plus size={24} /></div> إدخال يدوي للأرقام
                            </button>
                            <label className="group py-5 border-2 border-dashed border-orange/20 bg-orange/5 rounded-3xl font-bold text-orange hover:bg-orange/10 transition-all flex flex-col justify-center items-center gap-2 cursor-pointer relative overflow-hidden">
                                <input type="file" accept="image/*" onChange={handleAnalyzeImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                    {analyzing ? <Loader2 className="animate-spin text-orange" /> : <Wand2 className="text-orange" size={24} />}
                                </div>
                                {analyzing ? 'جاري قراءة الورقة...' : 'صوّر ورقة الـ InBody والـ AI يحللها'}
                            </label>
                        </div>
                    )}

                    {showInbodyForm && (
                        <form onSubmit={handleInbodySubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-orange/10 animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">تسجيل قياس جديد</h3>
                                <button type="button" onClick={() => setShowInbodyForm(false)} className="text-gray-400 hover:text-red-500"><Plus className="rotate-45" size={24} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                                <Input label="الوزن (Kg)" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required />
                                <Input label="العضلات (Kg)" type="number" step="0.1" value={muscle} onChange={e => setMuscle(e.target.value)} />
                                <Input label="الدهون (%)" type="number" step="0.1" value={fat} onChange={e => setFat(e.target.value)} />
                            </div>
                            {aiSummary && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 mb-6">
                                    <h4 className="text-blue-800 font-bold text-sm mb-1">رأي الكوتش الذكي:</h4>
                                    <p className="text-blue-700 text-sm">{aiSummary}</p>
                                </div>
                            )}
                            <Button className="w-full justify-center py-4 text-lg" disabled={uploading || analyzing}>
                                {uploading ? 'جاري الحفظ...' : 'حفظ القياس في السجل'}
                            </Button>
                        </form>
                    )}

                    {/* History List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Calendar size={20} /> سجل القياسات</h3>
                        {inbodyRecords.length === 0 ? (
                            <p className="text-gray-400 text-center py-10 bg-gray-50 rounded-3xl border border-dashed">لا يوجد سجلات سابقة</p>
                        ) : (
                            inbodyRecords.slice().reverse().map((record) => (
                                <div key={record.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-lg transition-all gap-4 group">
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
                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:bg-white hover:border-forest transition-all relative cursor-pointer bg-gray-50 group">
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
                                <button onClick={() => handleViewDocument(doc.file_url)} className="text-xs font-bold bg-gray-50 px-4 py-2 rounded-xl hover:bg-forest hover:text-white transition-colors">
                                    عرض
                                </button>
                            </div>
                        ))}
                    </div>
                    {docs.length === 0 && (
                        <div className="text-center py-20 opacity-50"><FileText size={48} className="mx-auto mb-4 text-gray-300" /><p>لا يوجد مستندات مرفوعة</p></div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MedicalRecords;