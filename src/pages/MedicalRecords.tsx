import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFamily } from '../contexts/FamilyContext';
import SubscriptionGuard from '../components/SubscriptionGuard';
import {
    FileText, Upload, Activity, TrendingUp, Plus, Wand2, Loader2,
    Scale, Dumbbell, Droplet, Calendar, ArrowUp, ArrowDown, Minus,
    HeartPulse, Coffee, Edit3, Save, AlertTriangle, CheckCircle2, Moon, Activity as ActivityIcon
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { InbodyRecord, ClientDocument } from '../types';

const DISEASE_OPTIONS = ['سكر', 'ضغط', 'قلب', 'كلى', 'كبد', 'قولون / مشاكل هضم', 'أنيميا', 'حساسية', 'ربو', 'تكيس مبايض', 'دهون / كوليسترول', 'نقرس', 'هشاشة عظام'];

const MedicalRecords: React.FC = () => {

    const { currentProfile } = useFamily();
    // 👇 تم إضافة التبويبات الجديدة وجعل 'health' هو الافتراضي
    const [activeTab, setActiveTab] = useState<'health' | 'lifestyle' | 'inbody' | 'docs'>('health');
    const [chartMetric, setChartMetric] = useState<'weight' | 'muscle' | 'fat'>('weight');

    const isSubscribed = currentProfile?.subscription_status === 'active' &&
        (!currentProfile.subscription_end_date || new Date(currentProfile.subscription_end_date) > new Date());

    const [inbodyRecords, setInbodyRecords] = useState<InbodyRecord[]>([]);
    const [docs, setDocs] = useState<ClientDocument[]>([]);

    // 🔥 States for Health Profile
    const [healthProfile, setHealthProfile] = useState<any>(null);
    const [isEditingHealth, setIsEditingHealth] = useState(false);
    const [healthForm, setHealthForm] = useState<any>({
        diseases: [], has_allergies: false, allergies_details: '', diet_type: 'عادي', family_history: [], medications: ''
    });

    // 🔥 States for Lifestyle Profile
    const [lifestyleProfile, setLifestyleProfile] = useState<any>(null);
    const [isEditingLifestyle, setIsEditingLifestyle] = useState(false);
    const [lifestyleForm, setLifestyleForm] = useState<any>({
        goal: 'خسارة وزن', meals_per_day: 3, has_breakfast: true, has_snacks: false, late_night_eating: false,
        favorite_foods: '', disliked_foods: '', water_liters: 2, beverages: [], activity_level: 'متوسط',
        does_exercise: false, exercise_details: { type: '', days: 0 }, sleep_hours: 7, sleep_quality: 'جيد', smoker: false, stress_level: 'متوسط'
    });

    const [showInbodyForm, setShowInbodyForm] = useState(false);
    const [weight, setWeight] = useState('');
    const [muscle, setMuscle] = useState('');
    const [fat, setFat] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');

    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (currentProfile) {
            fetchInbody();
            fetchDocs();
            fetchProfiles(); // 👈 جلب البيانات الجديدة
        }
    }, [currentProfile]);

    // 👇 دالة جلب الملف الطبي ونمط الحياة
    const fetchProfiles = async () => {
        if (!currentProfile) return;
        
        const { data: health } = await supabase.from('health_profile').select('*').eq('user_id', currentProfile.id).single();
        if (health) {
            setHealthProfile(health);
            setHealthForm(health);
        }

        const { data: life } = await supabase.from('lifestyle_profile').select('*').eq('user_id', currentProfile.id).single();
        if (life) {
            setLifestyleProfile(life);
            setLifestyleForm(life);
        }
    };

    // 👇 دوال الحفظ (Upsert)
    const saveHealthProfile = async () => {
        setUploading(true);
        try {
            const { error } = await supabase.from('health_profile').upsert({ user_id: currentProfile!.id, ...healthForm }, { onConflict: 'user_id' });
            if (error) throw error;
            setHealthProfile(healthForm);
            setIsEditingHealth(false);
            toast.success("تم تحديث الملف الطبي بنجاح!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    const saveLifestyleProfile = async () => {
        setUploading(true);
        try {
            const { error } = await supabase.from('lifestyle_profile').upsert({ user_id: currentProfile!.id, ...lifestyleForm }, { onConflict: 'user_id' });
            if (error) throw error;
            setLifestyleProfile(lifestyleForm);
            setIsEditingLifestyle(false);
            toast.success("تم تحديث نمط الحياة بنجاح!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    // (باقي دوال الـ InBody والـ Docs كما هي بدون أي تغيير)
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

    const handleAnalyzeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setAnalyzing(true);
        const loadingToast = toast.loading('جارٍ رفع ومعالجة ورقة الـ InBody...');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentProfile!.id}-${Date.now()}.${fileExt}`;
            const filePath = `inbody/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('medical-docs').upload(filePath, file);
            if (uploadError) throw uploadError;

            setUploadedImageUrl(filePath);
            const base64 = await compressImage(file);

            const { data, error: functionError } = await supabase.functions.invoke('analyze-inbody', { body: { base64 } });
            if (functionError) throw new Error("فشل الاتصال بالخادم، يرجى المحاولة لاحقاً.");
            
            const result = data.data;

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

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentProfile) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `docs/${currentProfile.id}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('medical-docs').upload(filePath, file);
            if (uploadError) throw uploadError;

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

    const handleViewDocument = async (pathOrUrl: string) => {
        const loadingToast = toast.loading('جاري تأمين الرابط...');
        try {
            if (pathOrUrl.startsWith('http')) {
                toast.dismiss(loadingToast);
                window.open(pathOrUrl, '_blank');
                return;
            }

            const { data, error } = await supabase.storage.from('medical-docs').createSignedUrl(pathOrUrl, 3600);
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

const toggleArrayItem = (arrayName: 'diseases' | 'family_history' | 'beverages', item: string) => {
        if (arrayName === 'diseases' || arrayName === 'family_history') {
            setHealthForm((prev: any) => {
                const arr = prev[arrayName] || [];
                return { ...prev, [arrayName]: arr.includes(item) ? arr.filter((i: string) => i !== item) : [...arr, item] };
            });
        } else if (arrayName === 'beverages') {
            setLifestyleForm((prev: any) => {
                const arr = prev[arrayName] || [];
                return { ...prev, [arrayName]: arr.includes(item) ? arr.filter((i: string) => i !== item) : [...arr, item] };
            });
        }
    };
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
                        النظام الصحي والقياسات
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">بياناتك الطبية ونمط حياتك في مكان واحد لمتابعة أدق</p>
                </div>

                {/* Custom Tabs */}
                <div className="bg-gray-100 p-1.5 rounded-2xl flex flex-wrap gap-1">
                    <button onClick={() => setActiveTab('health')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'health' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                        <HeartPulse size={16} /> الملف الطبي
                    </button>
                    <button onClick={() => setActiveTab('lifestyle')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'lifestyle' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                        <Coffee size={16} /> نمط الحياة
                    </button>
                    <button onClick={() => setActiveTab('inbody')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inbody' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                        <Scale size={16} /> InBody
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                        <FileText size={16} /> التحاليل
                    </button>
                </div>
            </div>

            {/* 🟢 1. الملف الطبي (Static Health Profile) */}
            {activeTab === 'health' && (
                <div className="animate-in slide-in-from-left-8 space-y-6">
                    {!isEditingHealth ? (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><HeartPulse className="text-red-500" /> البيانات الطبية الأساسية</h2>
                                <Button onClick={() => setIsEditingHealth(true)} className="bg-gray-50 text-forest hover:bg-gray-100 border-none px-4 py-2 flex items-center gap-2"><Edit3 size={16} /> تعديل البيانات</Button>
                            </div>
                            
                            {!healthProfile ? (
                                <div className="text-center py-10 text-gray-400">
                                    <AlertTriangle size={48} className="mx-auto mb-3 text-orange opacity-50" />
                                    <p className="font-bold">لم تقم بإدخال بياناتك الطبية بعد!</p>
                                    <p className="text-sm mt-1">هذه البيانات هامة جداً لتصميم نظامك الغذائي.</p>
                                    <Button onClick={() => setIsEditingHealth(true)} className="mt-4">إدخال البيانات الآن</Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div><span className="text-sm text-gray-400 font-bold block mb-1">الأمراض المزمنة</span><div className="flex flex-wrap gap-2">{healthProfile.diseases?.length ? healthProfile.diseases.map((d:string) => <span key={d} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-bold">{d}</span>) : <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg">لا يوجد (سليم والحمد لله)</span>}</div></div>
                                        <div><span className="text-sm text-gray-400 font-bold block mb-1">تاريخ مرضي بالعائلة</span><div className="flex flex-wrap gap-2">{healthProfile.family_history?.length ? healthProfile.family_history.map((d:string) => <span key={d} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold">{d}</span>) : <span className="text-gray-500">لا يوجد</span>}</div></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div><span className="text-sm text-gray-400 font-bold block mb-1">الحساسية</span>{healthProfile.has_allergies ? <p className="text-red-500 font-bold flex items-center gap-2"><AlertTriangle size={16}/> نعم ({healthProfile.allergies_details})</p> : <p className="text-gray-800 font-bold flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> لا يوجد</p>}</div>
                                        <div><span className="text-sm text-gray-400 font-bold block mb-1">الأدوية والمكملات</span><p className="text-gray-800 font-bold bg-gray-50 p-3 rounded-xl">{healthProfile.medications || 'لا يوجد'}</p></div>
                                        <div><span className="text-sm text-gray-400 font-bold block mb-1">نوع النظام المفضل</span><p className="text-forest font-bold bg-forest/5 p-3 rounded-xl inline-block">{healthProfile.diet_type}</p></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-forest/20">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-forest">تحديث الملف الطبي</h2>
                                <button onClick={() => setIsEditingHealth(false)} className="text-gray-400 hover:text-red-500">إلغاء</button>
                            </div>
                            
                            <div className="space-y-6">
                                {/* الأمراض */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">هل تعاني من أي أمراض مزمنة؟ (اختر كل ما ينطبق)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DISEASE_OPTIONS.map(d => (
                                            <button type="button" key={d} onClick={() => toggleArrayItem('diseases', d)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${healthForm.diseases?.includes(d) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-500 hover:border-red-200'}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* الحساسية */}
                                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">هل تعاني من أي حساسية؟</label>
                                        <select value={healthForm.has_allergies ? 'yes' : 'no'} onChange={(e) => setHealthForm({...healthForm, has_allergies: e.target.value === 'yes'})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-forest outline-none">
                                            <option value="no">لا</option>
                                            <option value="yes">نعم، يوجد حساسية</option>
                                        </select>
                                    </div>
                                    {healthForm.has_allergies && (
                                        <Input label="تفاصيل الحساسية (طعام، دواء...)" value={healthForm.allergies_details} onChange={(e) => setHealthForm({...healthForm, allergies_details: e.target.value})} placeholder="اكتب التفاصيل هنا..." />
                                    )}
                                </div>

                                {/* التاريخ العائلي */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ مرضي بالعائلة (وراثة)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['سكر', 'ضغط', 'سمنة', 'أمراض قلب', 'غدة'].map(d => (
                                            <button type="button" key={d} onClick={() => toggleArrayItem('family_history', d)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${healthForm.family_history?.includes(d) ? 'bg-forest/10 border-forest text-forest' : 'bg-white border-gray-200 text-gray-500 hover:border-forest/50'}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* الأدوية والنظام */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">الأدوية والمكملات الحالية (بالجرعات)</label>
                                        <textarea value={healthForm.medications} onChange={(e) => setHealthForm({...healthForm, medications: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-forest outline-none min-h-[100px]" placeholder="مثال: أوميجا 3 يومياً، دواء ضغط..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع النظام المفضل</label>
                                        <select value={healthForm.diet_type} onChange={(e) => setHealthForm({...healthForm, diet_type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-forest outline-none">
                                            <option value="عادي">عادي (يأكل كل شيء)</option>
                                            <option value="نباتي (Vegan)">نباتي صرف (Vegan)</option>
                                            <option value="نباتي جزئي (Vegetarian)">نباتي (يأكل بيض وألبان)</option>
                                            <option value="كيتو">كيتو دايت</option>
                                        </select>
                                    </div>
                                </div>

                                <Button onClick={saveHealthProfile} disabled={uploading} className="w-full py-4 text-lg justify-center gap-2">
                                    {uploading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> حفظ البيانات الطبية</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 🟡 2. نمط الحياة (Editable Lifestyle Profile) */}
            {activeTab === 'lifestyle' && (
                <div className="animate-in slide-in-from-left-8 space-y-6">
                    {!isEditingLifestyle ? (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><Coffee className="text-orange" /> العادات اليومية ونمط الحياة</h2>
                                <Button onClick={() => setIsEditingLifestyle(true)} className="bg-gray-50 text-forest hover:bg-gray-100 border-none px-4 py-2 flex items-center gap-2"><Edit3 size={16} /> تحديث مستمر</Button>
                            </div>

                            {!lifestyleProfile ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Moon size={48} className="mx-auto mb-3 text-blue-300 opacity-50" />
                                    <p className="font-bold">أخبرنا عن عاداتك اليومية!</p>
                                    <p className="text-sm mt-1">يساعدنا ذلك في تصميم خطة مرنة تناسب يومك.</p>
                                    <Button onClick={() => setIsEditingLifestyle(true)} className="mt-4">تحديث نمط الحياة</Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-forest mb-3"><TrendingUp size={18} /> <span className="font-bold">الهدف الأساسي</span></div>
                                        <p className="text-lg font-black text-gray-800">{lifestyleProfile.goal}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-blue-500 mb-3"><Droplet size={18} /> <span className="font-bold">المياه والمشروبات</span></div>
                                        <p className="text-gray-800 font-bold">{lifestyleProfile.water_liters} لتر يومياً</p>
                                        <p className="text-sm text-gray-500 mt-1">{lifestyleProfile.beverages?.join('، ') || 'لا يوجد مشروبات مفضلة'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-orange mb-3"><ActivityIcon size={18} /> <span className="font-bold">النشاط البدني</span></div>
                                        <p className="text-gray-800 font-bold">مستوى: {lifestyleProfile.activity_level}</p>
                                        {lifestyleProfile.does_exercise && <p className="text-sm text-gray-500 mt-1">{lifestyleProfile.exercise_details?.type} ({lifestyleProfile.exercise_details?.days} أيام/أسبوع)</p>}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-purple-500 mb-3"><Moon size={18} /> <span className="font-bold">النوم والضغط</span></div>
                                        <p className="text-gray-800 font-bold">{lifestyleProfile.sleep_hours} ساعات ({lifestyleProfile.sleep_quality})</p>
                                        <p className="text-sm text-gray-500 mt-1">الضغط النفسي: {lifestyleProfile.stress_level}</p>
                                    </div>
                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-red-500 mb-3"><Coffee size={18} /> <span className="font-bold">تفضيلات الطعام</span></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><span className="text-xs text-green-600 font-bold">يفضل:</span> <p className="text-sm font-bold text-gray-700 bg-white p-2 rounded-lg mt-1">{lifestyleProfile.favorite_foods || '-'}</p></div>
                                            <div><span className="text-xs text-red-500 font-bold">لا يفضل:</span> <p className="text-sm font-bold text-gray-700 bg-white p-2 rounded-lg mt-1">{lifestyleProfile.disliked_foods || '-'}</p></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-forest/20">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-forest">تحديث العادات اليومية</h2>
                                <button onClick={() => setIsEditingLifestyle(false)} className="text-gray-400 hover:text-red-500">إلغاء</button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">الهدف من النظام</label>
                                        <select value={lifestyleForm.goal} onChange={(e) => setLifestyleForm({...lifestyleForm, goal: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-forest outline-none">
                                            <option>خسارة وزن</option><option>زيادة وزن</option><option>تثبيت الوزن</option><option>بناء عضل</option>
                                        </select>
                                    </div>
                                    <Input label="كمية المياه يومياً (لتر)" type="number" step="0.5" value={lifestyleForm.water_liters} onChange={e => setLifestyleForm({...lifestyleForm, water_liters: e.target.value})} />
                                </div>

                                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">تتناول الإفطار؟</label>
                                        <select value={lifestyleForm.has_breakfast ? 'yes':'no'} onChange={(e) => setLifestyleForm({...lifestyleForm, has_breakfast: e.target.value==='yes'})} className="w-full p-3 rounded-xl border border-gray-200 outline-none"><option value="yes">نعم</option><option value="no">لا</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">سناكس بين الوجبات؟</label>
                                        <select value={lifestyleForm.has_snacks ? 'yes':'no'} onChange={(e) => setLifestyleForm({...lifestyleForm, has_snacks: e.target.value==='yes'})} className="w-full p-3 rounded-xl border border-gray-200 outline-none"><option value="yes">نعم</option><option value="no">لا</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">الأكل في وقت متأخر؟</label>
                                        <select value={lifestyleForm.late_night_eating ? 'yes':'no'} onChange={(e) => setLifestyleForm({...lifestyleForm, late_night_eating: e.target.value==='yes'})} className="w-full p-3 rounded-xl border border-gray-200 outline-none"><option value="yes">نعم</option><option value="no">لا</option></select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input label="أطعمة تحبها جداً" value={lifestyleForm.favorite_foods} onChange={e => setLifestyleForm({...lifestyleForm, favorite_foods: e.target.value})} placeholder="شوكولاتة، مكرونة..." />
                                    <Input label="أطعمة لا تحبها أو تمنعها" value={lifestyleForm.disliked_foods} onChange={e => setLifestyleForm({...lifestyleForm, disliked_foods: e.target.value})} placeholder="سمك، باذنجان..." />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">هل تمارس الرياضة؟</label>
                                        <select value={lifestyleForm.does_exercise ? 'yes':'no'} onChange={(e) => setLifestyleForm({...lifestyleForm, does_exercise: e.target.value==='yes'})} className="w-full p-3 rounded-xl border border-gray-200 outline-none"><option value="no">لا أمارس</option><option value="yes">نعم أمارس</option></select>
                                    </div>
                                    {lifestyleForm.does_exercise && (
                                        <div className="flex gap-2">
                                            <div className="flex-1"><Input label="نوع التمرين" value={lifestyleForm.exercise_details?.type || ''} onChange={e => setLifestyleForm({...lifestyleForm, exercise_details: {...lifestyleForm.exercise_details, type: e.target.value}})} placeholder="جيم، مشي، سباحة..." /></div>
                                            <div className="w-24"><Input label="أيام/أسبوع" type="number" value={lifestyleForm.exercise_details?.days || 0} onChange={e => setLifestyleForm({...lifestyleForm, exercise_details: {...lifestyleForm.exercise_details, days: e.target.value}})} /></div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <Input label="ساعات النوم يومياً" type="number" value={lifestyleForm.sleep_hours} onChange={e => setLifestyleForm({...lifestyleForm, sleep_hours: e.target.value})} />
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">جودة النوم</label>
                                        <select value={lifestyleForm.sleep_quality} onChange={(e) => setLifestyleForm({...lifestyleForm, sleep_quality: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none"><option>جيد</option><option>متقطع</option><option>أرق</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">مستوى التوتر والضغط</label>
                                        <select value={lifestyleForm.stress_level} onChange={(e) => setLifestyleForm({...lifestyleForm, stress_level: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 outline-none"><option>منخفض</option><option>متوسط</option><option>عالي</option></select>
                                    </div>
                                </div>

                                <Button onClick={saveLifestyleProfile} disabled={uploading} className="w-full py-4 text-lg justify-center gap-2">
                                    {uploading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> حفظ وتحديث النمط</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 🔵 3. InBody Tab (كما هو بالضبط دون مساس بالوظائف) */}
            {activeTab === 'inbody' && (
                <div className="space-y-8 animate-in slide-in-from-left-8">

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
            )}

            {/* 🟣 4. Docs Tab (كما هي) */}
            {activeTab === 'docs' && (
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