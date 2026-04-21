import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  Save, Loader2, Layout, Info, ListTree, HelpCircle, 
  Plus, Trash2, Image as ImageIcon, Link as LinkIcon, 
  MousePointer2, Users as UsersIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ImageCropper from '../../components/ImageCropper';

const ICON_PICKER_LIST = [
  'Activity', 'Apple', 'Heart', 'Dumbbell', 'Coffee', 'Utensils', 'Beef', 'Salad', 'Stethoscope', 'Target', 
  'Zap', 'Flame', 'TrendingUp', 'Shield', 'User', 'Users', 'MessageCircle', 'Phone', 'Calendar', 'Star',
  'Smartphone', 'Zap', 'CheckCircle', 'PlusCircle', 'Smile', 'Trophy', 'Gift', 'ShoppingBag'
];

const HomeEditor = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [targetType, setTargetType] = useState<{section: string, index?: number} | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('landing_page_settings').select('*').eq('id', 'main_page').single();
    if (data) setSettings(data);
    setLoading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, section: string, index?: number) => {
    if (e.target.files && e.target.files.length > 0) {
      setTargetType({ section, index });
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsCropping(true);
      };
    }
  };

  const handleCropDone = async (croppedAreaPixels: any) => {
    setIsCropping(false);
    setUploading(true);
    const loadingToast = toast.loading('جاري معالجة ورفع الصورة...');

    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = selectedImage!;
      await new Promise((res) => (img.onload = res));

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0,
        croppedAreaPixels.width, croppedAreaPixels.height
      );

      // بنحول الصورة لـ WebP مضغوط بنسبة 80% هنا أوتوماتيكياً
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/webp', 0.8));
      
      const fileName = `${targetType?.section}-${Date.now()}.webp`; // بنغير الامتداد هنا لـ webp

      const { error: uploadError } = await supabase.storage
        .from('landing-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('landing-images').getPublicUrl(fileName);

      const ns = { ...settings };

      if (targetType?.section === 'hero') {
        ns.hero_section.image_url = publicUrl;
      } 
      else if (targetType?.section === 'about' && targetType.index !== undefined) {
        ns.about_section.cards[targetType.index].image = publicUrl;
      } 
      else if (targetType?.section === 'success_avatar' && targetType.index !== undefined) {
        if (!ns.hero_section.success_avatars) {
          ns.hero_section.success_avatars = ["", "", "", ""];
        }
        ns.hero_section.success_avatars[targetType.index] = publicUrl;
      }

      setSettings(ns);
      toast.success('تم رفع الصورة بنجاح 🚀', { id: loadingToast });
    } catch (error: any) {
      console.error("Storage Error:", error);
      toast.error('حدث خطأ في الرفع: ' + (error.message || 'Bucket not found'), { id: loadingToast });
    } finally {
      setUploading(false);
      setTargetType(null);
      setSelectedImage(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('landing_page_settings').update(settings).eq('id', 'main_page');
    if (!error) toast.success('تم حفظ كافة التعديلات بنجاح ✨');
    else toast.error('حدث خطأ أثناء الحفظ');
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-forest" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 font-tajawal" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 italic">إدارة الواجهة 🎨</h1>
          <p className="text-slate-500 font-bold text-sm">تخصيص كامل لبراند هيليكس</p>
        </div>
        <button onClick={handleSave} disabled={saving || uploading} className="bg-forest text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} حفظ الكل
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 flex flex-col gap-2">
          <TabButton active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} icon={<Layout size={18}/>} label="قسم الـ Hero" />
          <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Info size={18}/>} label="عن هيليكس (Bento)" />
          <TabButton active={activeTab === 'steps'} onClick={() => setActiveTab('steps')} icon={<ListTree size={18}/>} label="خطوات العمل" />
          <TabButton active={activeTab === 'faq'} onClick={() => setActiveTab('faq')} icon={<HelpCircle size={18}/>} label="الأسئلة الشائعة" />
        </aside>

        <main className="flex-1 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 min-h-[500px]">
          
          {activeTab === 'hero' && (
            <div className="space-y-10 animate-in fade-in">
               <h3 className="text-xl font-black text-forest border-b pb-4 italic">إعدادات الواجهة الرئيسية</h3>
               
               <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-white shadow-md shrink-0 bg-white">
                    {/* 👇 تم إضافة loading="lazy" */}
                    <img src={settings?.hero_section?.image_url} loading="lazy" className="w-full h-full object-cover" alt="Hero" />
                  </div>
                  <label className="bg-white border-2 border-forest text-forest px-6 py-2 rounded-xl font-black cursor-pointer hover:bg-forest hover:text-white transition-all shadow-sm">
                    تغيير وقص صورة الهيرو
                    {/* 👇 السماح بجميع الصيغ بما فيها WebP */}
                    <input type="file" accept="image/*, image/webp" className="hidden" onChange={(e) => onFileChange(e, 'hero')} />
                  </label>
               </div>

               <div className="space-y-4">
                 <InputGroup label="النص الصغير (Badge)" value={settings?.hero_section?.badge} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, badge: v}})} />
                 <div className="grid grid-cols-3 gap-3">
                   <InputGroup label="عنوان 1" value={settings?.hero_section?.title_part1} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, title_part1: v}})} />
                   <InputGroup label="كلمة مميزة" value={settings?.hero_section?.title_highlight} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, title_highlight: v}})} />
                   <InputGroup label="عنوان 2" value={settings?.hero_section?.title_part2} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, title_part2: v}})} />
                 </div>
                 <TextareaGroup label="الوصف الرئيسي" value={settings?.hero_section?.description} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, description: v}})} />
               </div>

               <div className="grid md:grid-cols-2 gap-6 pt-4">
                 {['primary_btn', 'secondary_btn'].map((btnKey) => {
                   const btnData = settings?.hero_section?.[btnKey] || { show: true, text: '', link: '' };
                   return (
                    <div key={btnKey} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                           <MousePointer2 size={14}/> {btnKey === 'primary_btn' ? 'الزر الرئيسي' : 'الزر الثانوي'}
                         </span>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={btnData.show} onChange={(e) => {
                             const ns = {...settings}; 
                             ns.hero_section[btnKey] = { ...btnData, show: e.target.checked };
                             setSettings(ns);
                           }} className="sr-only peer" />
                           <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-forest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                         </label>
                      </div>
                      <InputGroup label="نص الزر" value={btnData.text} onChange={(v: string) => {
                        const ns = {...settings}; ns.hero_section[btnKey] = { ...btnData, text: v }; setSettings(ns);
                      }} />
                      <InputGroup label="الرابط (URL)" value={btnData.link} onChange={(v: string) => {
                        const ns = {...settings}; ns.hero_section[btnKey] = { ...btnData, link: v }; setSettings(ns);
                      }} />
                    </div>
                   );
                 })}
               </div>

               <div className="p-6 bg-orange/5 rounded-3xl border border-orange/10 space-y-6">
                  <h4 className="font-black text-orange flex items-center gap-2"><UsersIcon size={18}/> إحصائيات قصص النجاح</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputGroup label="العدد (مثلاً 1,000+)" value={settings?.hero_section?.success_count_text} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, success_count_text: v}})} />
                    <InputGroup label="النص المصاحب" value={settings?.hero_section?.success_label} onChange={(v: string) => setSettings({...settings, hero_section: {...settings.hero_section, success_label: v}})} />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">صور المستخدمين (Avatars)</label>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {(settings?.hero_section?.success_avatars || [1,2,3,4]).map((url: string, idx: number) => (
                        <div key={idx} className="relative group shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
                            {/* 👇 إضافة lazy للـ avatars */}
                            <img src={typeof url === 'string' ? url : `https://picsum.photos/100/100?random=${idx}`} loading="lazy" className="w-full h-full object-cover" alt="User" />
                          </div>
                          <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                            <ImageIcon size={16} className="text-white"/>
                            {/* 👇 السماح بـ Webp */}
                            <input type="file" accept="image/*, image/webp" className="hidden" onChange={(e) => onFileChange(e, 'success_avatar', idx)} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-8 animate-in fade-in">
               <h3 className="text-xl font-black text-forest border-b pb-4 italic">إدارة كروت المميزات (Bento)</h3>
               <InputGroup label="العنوان الرئيسي" value={settings?.about_section?.main_title} onChange={(v: string) => setSettings({...settings, about_section: {...settings.about_section, main_title: v}})} />
               <TextareaGroup label="الوصف الرئيسي" value={settings?.about_section?.main_description} onChange={(v: string) => setSettings({...settings, about_section: {...settings.about_section, main_description: v}})} />

               <div className="space-y-6">
                 {settings?.about_section?.cards?.map((card: any, idx: number) => (
                   <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-white">
                          {/* 👇 إضافة lazy */}
                          <img src={card.image} loading="lazy" className="w-full h-full object-cover" alt="Card" />
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <label className="inline-flex items-center gap-2 bg-white border border-forest text-forest px-4 py-2 rounded-lg text-xs font-black cursor-pointer hover:bg-forest hover:text-white transition-all shadow-sm">
                            <ImageIcon size={14}/> تغيير وقص الصورة
                            {/* 👇 السماح بـ Webp */}
                            <input type="file" accept="image/*, image/webp" className="hidden" onChange={(e) => onFileChange(e, 'about', idx)} />
                          </label>
                          <InputGroup label="عنوان الكارت" value={card.title} onChange={(v: string) => {
                            const newCards = [...settings.about_section.cards]; newCards[idx].title = v;
                            setSettings({...settings, about_section: {...settings.about_section, cards: newCards}});
                          }} />
                        </div>
                      </div>
                      <TextareaGroup label="وصف الكارت" value={card.desc} onChange={(v: string) => {
                        const newCards = [...settings.about_section.cards]; newCards[idx].desc = v;
                        setSettings({...settings, about_section: {...settings.about_section, cards: newCards}});
                      }} />
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-black text-forest">خطوات العمل</h3>
                <button onClick={() => {
                  const newSteps = [...(settings?.steps_section?.steps || []), { id: settings?.steps_section?.steps?.length + 1, title: 'خطوة جديدة', desc: '', icon: 'Activity' }];
                  setSettings({...settings, steps_section: {...settings.steps_section, steps: newSteps}});
                }} className="bg-orange text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"><Plus size={16}/> إضافة خطوة</button>
              </div>
              <div className="space-y-6">
                {settings?.steps_section?.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group transition-all hover:shadow-md">
                    <button onClick={() => {
                      const newSteps = settings.steps_section.steps.filter((_: any, i: number) => i !== idx);
                      setSettings({...settings, steps_section: {...settings.steps_section, steps: newSteps}});
                    }} className="absolute -left-2 -top-2 bg-white text-red-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-20"><Trash2 size={16}/></button>
                    <div className="grid md:grid-cols-12 gap-6">
                      <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase italic">اختر أيقونة</label>
                        <div className="grid grid-cols-5 gap-2 h-32 overflow-y-auto scrollbar-hide">
                          {ICON_PICKER_LIST.map((iconName) => {
                            const IconComp = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
                            return (
                              <button key={iconName} onClick={() => {
                                const newSteps = [...settings.steps_section.steps]; newSteps[idx].icon = iconName;
                                setSettings({...settings, steps_section: {...settings.steps_section, steps: newSteps}});
                              }} className={`p-2 rounded-lg transition-all ${step.icon === iconName ? 'bg-orange text-white shadow-md' : 'hover:bg-slate-100 text-slate-400'}`}>
                                <IconComp size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="md:col-span-8 space-y-4">
                        <div className="flex gap-4">
                           <div className="w-12 h-12 bg-forest text-white rounded-full flex items-center justify-center font-black shrink-0 shadow-lg">
                             {(LucideIcons as any)[step.icon] ? React.createElement((LucideIcons as any)[step.icon], { size: 20 }) : <HelpCircle size={20}/>}
                           </div>
                           <InputGroup label="عنوان الخطوة" value={step.title} onChange={(v: string) => {
                              const newSteps = [...settings.steps_section.steps]; newSteps[idx].title = v;
                              setSettings({...settings, steps_section: {...settings.steps_section, steps: newSteps}});
                           }} />
                        </div>
                        <TextareaGroup label="وصف الخطوة" value={step.desc} onChange={(v: string) => {
                           const newSteps = [...settings.steps_section.steps]; newSteps[idx].desc = v;
                           setSettings({...settings, steps_section: {...settings.steps_section, steps: newSteps}});
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-forest">الأسئلة الشائعة</h3>
                 <button onClick={() => {
                   const newQuestions = [...(settings?.faq_section?.questions || []), {q: 'سؤال جديد؟', a: 'إجابة جديدة'}];
                   setSettings({...settings, faq_section: {...settings.faq_section, questions: newQuestions}});
                 }} className="bg-forest text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                   <Plus size={16}/> إضافة سؤال
                 </button>
              </div>
              {settings?.faq_section?.questions?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl relative group border border-slate-100">
                  <button onClick={() => {
                    const newFaq = settings.faq_section.questions.filter((_: any, i: number) => i !== idx);
                    setSettings({...settings, faq_section: {...settings.faq_section, questions: newFaq}});
                  }} className="absolute -left-2 -top-2 bg-white text-red-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"><Trash2 size={16}/></button>
                  <InputGroup label="السؤال" value={item.q} onChange={(v: string) => {
                    const newFaq = [...settings.faq_section.questions]; newFaq[idx].q = v;
                    setSettings({...settings, faq_section: {...settings.faq_section, questions: newFaq}});
                  }} />
                  <TextareaGroup label="الإجابة" value={item.a} onChange={(v: string) => {
                    const newFaq = [...settings.faq_section.questions]; newFaq[idx].a = v;
                    setSettings({...settings, faq_section: {...settings.faq_section, questions: newFaq}});
                  }} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {isCropping && (
        <ImageCropper
          image={selectedImage}
          aspect={targetType?.section === 'success_avatar' ? 1 : (targetType?.section === 'hero' ? 1 : 1.5)}
          onCropDone={handleCropDone}
          onCancel={() => { setIsCropping(false); setSelectedImage(null); }}
        />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all ${active ? 'bg-forest text-white shadow-lg translate-x-[-8px]' : 'text-slate-400 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm">{label}</span>
  </button>
);

const InputGroup = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-1 w-full mb-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <input className="p-3 bg-white rounded-xl border border-slate-100 font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-forest/20 outline-none transition-all" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const TextareaGroup = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-1 w-full mb-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <textarea rows={2} className="p-3 bg-white rounded-xl border border-slate-100 font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-forest/20 outline-none resize-none transition-all" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default HomeEditor;