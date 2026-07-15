import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Plus, X, Dumbbell, AlertTriangle, Eye, 
  Trash2, FileText, Check, ListChecks, HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';

interface Exercise {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  muscle: string;
  body_part: string;
  equipment: string;
  exercise_type: string;
  default_duration: string;
  default_calories: string;
  default_sets: string;
  steps: string[];
  mistakes: { title: string; desc: string }[];
  tips: string;
  warnings?: string;
  image_url?: string;
  gif_url?: string;
  video_url?: string;
  target_muscles?: string[];
  secondary_muscles?: string[];
  tags?: string[];
}

const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [bodyPartFilter, setBodyPartFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal / Detail state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New exercise form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('STRENGTH');
  const [newDifficulty, setNewDifficulty] = useState('BEGINNER');
  const [newMuscle, setNewMuscle] = useState('');
  const [newBodyPart, setNewBodyPart] = useState('كامل الجسم');
  const [newEquipment, setNewEquipment] = useState('وزن الجسم');
  const [newDuration, setNewDuration] = useState('10 min');
  const [newCalories, setNewCalories] = useState('100 kcal');
  const [newSets, setNewSets] = useState('3 جولات × 10 تكرارات');
  const [newSteps, setNewSteps] = useState<string[]>(['']);
  const [newMistakes, setNewMistakes] = useState<{ title: string; desc: string }[]>([{ title: '', desc: '' }]);
  const [newTips, setNewTips] = useState('');
  const [newWarnings, setNewWarnings] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newGifUrl, setNewGifUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newTargets, setNewTargets] = useState<string[]>(['']);
  const [newSecondaries, setNewSecondaries] = useState<string[]>(['']);
  const [newTags, setNewTags] = useState<string[]>(['']);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('preset_exercises' as any)
        .select('*')
        .order('title');

      if (error) throw error;
      setExercises((data as any) || []);
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ في تحميل مكتبة التمارين');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => setNewSteps([...newSteps, '']);
  const handleRemoveStep = (idx: number) => {
    const ns = [...newSteps]; ns.splice(idx, 1); setNewSteps(ns);
  };
  const handleStepChange = (idx: number, val: string) => {
    const ns = [...newSteps]; ns[idx] = val; setNewSteps(ns);
  };

  const handleAddMistake = () => setNewMistakes([...newMistakes, { title: '', desc: '' }]);
  const handleRemoveMistake = (idx: number) => {
    const ns = [...newMistakes]; ns.splice(idx, 1); setNewMistakes(ns);
  };
  const handleMistakeChange = (idx: number, field: 'title' | 'desc', val: string) => {
    const ns = [...newMistakes];
    ns[idx][field] = val;
    setNewMistakes(ns);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return toast.error('يرجى إدخال اسم التمرين');

    const cleanSteps = newSteps.filter(s => s.trim() !== '');
    const cleanMistakes = newMistakes.filter(m => m.title.trim() !== '');
    const cleanTargets = newTargets.filter(t => t.trim() !== '');
    const cleanSecondaries = newSecondaries.filter(s => s.trim() !== '');
    const cleanTags = newTags.filter(t => t.trim() !== '');

    const id = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

    try {
      const { error } = await supabase
        .from('preset_exercises' as any)
        .insert([{
          id: id || `ex_${Date.now()}`,
          title: newTitle,
          category: newCategory,
          difficulty: newDifficulty,
          muscle: newMuscle || newBodyPart,
          body_part: newBodyPart,
          equipment: newEquipment,
          exercise_type: newCategory,
          default_duration: newDuration,
          default_calories: newCalories,
          default_sets: newSets,
          steps: cleanSteps,
          mistakes: cleanMistakes,
          tips: newTips,
          warnings: newWarnings || null,
          image_url: newImageUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop',
          gif_url: newGifUrl || null,
          video_url: newVideoUrl || null,
          target_muscles: cleanTargets,
          secondary_muscles: cleanSecondaries,
          tags: cleanTags
        }]);

      if (error) throw error;
      toast.success('تمت إضافة التمرين للمكتبة بنجاح! 🎉');
      setIsAddModalOpen(false);
      fetchExercises();

      // Reset form
      setNewTitle('');
      setNewMuscle('');
      setNewTips('');
      setNewWarnings('');
      setNewImageUrl('');
      setNewGifUrl('');
      setNewVideoUrl('');
      setNewSteps(['']);
      setNewMistakes([{ title: '', desc: '' }]);
      setNewTargets(['']);
      setNewSecondaries(['']);
      setNewTags(['']);
    } catch (err: any) {
      console.error(err);
      toast.error('فشل إضافة التمرين: ' + err.message);
    }
  };

  const handleDeleteExercise = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف تمرين "${name}" من المكتبة؟`)) return;
    try {
      const { error } = await supabase
        .from('preset_exercises' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف التمرين بنجاح');
      if (selectedExercise?.id === id) setSelectedExercise(null);
      fetchExercises();
    } catch (err: any) {
      console.error(err);
      toast.error('فشل الحذف: ' + err.message);
    }
  };

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = 
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.body_part.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.tags && ex.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesBodyPart = !bodyPartFilter || ex.body_part === bodyPartFilter;
    const matchesDifficulty = !difficultyFilter || ex.difficulty === difficultyFilter;
    const matchesEquipment = !equipmentFilter || ex.equipment === equipmentFilter;
    const matchesCategory = !categoryFilter || ex.category === categoryFilter;

    return matchesSearch && matchesBodyPart && matchesDifficulty && matchesEquipment && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto font-tajawal text-right pb-20" dir="rtl">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <Dumbbell className="text-orange" size={32} /> مكتبة التمارين الرياضية
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1">تصفح التمارين المتاحة، ابحث، فلتر أو أضف تمارين جديدة لتصميم خطط الرياضة بسرعة</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-xl shadow-forest/10 shrink-0">
          <Plus size={20} /> إضافة تمرين جديد للمكتبة
        </Button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ابحث باسم التمرين، العضلة، الأدوات أو الوسوم..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-forest transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
          <select 
            value={bodyPartFilter} 
            onChange={(e) => setBodyPartFilter(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-forest transition-colors"
          >
            <option value="">عضلة الجسم (الكل)</option>
            <option value="الصدر">الصدر</option>
            <option value="الظهر">الظهر</option>
            <option value="الساقين">الساقين</option>
            <option value="الأكتاف">الأكتاف</option>
            <option value="الجذع">البطن والجذع</option>
            <option value="كامل الجسم">كامل الجسم</option>
          </select>

          <select 
            value={equipmentFilter} 
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-forest transition-colors"
          >
            <option value="">الأدوات (الكل)</option>
            <option value="وزن الجسم">وزن الجسم</option>
            <option value="دمبلز">دمبلز</option>
            <option value="باربل">باربل</option>
            <option value="بار عقلة">بار عقلة</option>
            <option value="جيم">أجهزة الجيم</option>
          </select>

          <select 
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-forest transition-colors"
          >
            <option value="">الصعوبة (الكل)</option>
            <option value="BEGINNER">مبتدئ</option>
            <option value="INTERMEDIATE">متوسط</option>
            <option value="ADVANCED">متقدم</option>
          </select>

          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-forest transition-colors"
          >
            <option value="">التصنيف (الكل)</option>
            <option value="STRENGTH">قوة وبناء عضلي</option>
            <option value="CARDIO">لياقة وكارديو</option>
            <option value="STRETCHING">مرونة وإطالة</option>
          </select>
        </div>
      </div>

      {/* Grid of Exercises */}
      {loading ? (
        <div className="p-20 text-center font-black text-forest animate-pulse">جاري تحميل مكتبة التمارين...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-20 text-center font-bold text-slate-400">
          لا توجد تمارين تطابق خيارات الفلترة والبحث الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredExercises.map(ex => (
            <div 
              key={ex.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-orange/20 transition-all flex flex-col group relative"
            >
              {/* Delete Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteExercise(ex.id, ex.title); }}
                className="absolute top-3 left-3 bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-2 rounded-xl backdrop-blur-sm transition-colors z-10"
                title="حذف التمرين"
              >
                <Trash2 size={16} />
              </button>

              {/* Cover Image */}
              <div className="h-44 bg-slate-100 overflow-hidden relative">
                <img 
                  src={ex.image_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop'} 
                  alt={ex.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-3 right-3 bg-forest/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {ex.body_part}
                </span>
              </div>

              {/* Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-800 line-clamp-1 mb-2">{ex.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-lg border border-slate-200/50">
                      {ex.equipment}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border 
                      ${ex.difficulty === 'BEGINNER' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        ex.difficulty === 'INTERMEDIATE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {ex.difficulty === 'BEGINNER' ? 'مبتدئ' : ex.difficulty === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedExercise(ex)}
                  className="w-full bg-slate-50 border border-slate-200/80 hover:bg-orange hover:text-white hover:border-orange py-2.5 rounded-2xl text-xs font-black text-slate-600 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye size={14} /> استعراض وتفاصيل التمرين
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAILED EXERCISE MODAL ── */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="bg-orange/10 p-2.5 rounded-2xl text-orange"><Dumbbell size={24} /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{selectedExercise.title}</h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">{selectedExercise.muscle} • {selectedExercise.equipment}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedExercise(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Right Side: Media & Details */}
                <div>
                  <div className="rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video mb-6 relative">
                    <img 
                      src={selectedExercise.gif_url || selectedExercise.image_url} 
                      alt={selectedExercise.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                    <h3 className="font-black text-sm text-slate-700 border-b border-slate-200/60 pb-2">تفاصيل افتراضية</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">الجولات المقترحة</span>
                        <span className="text-slate-800">{selectedExercise.default_sets}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">الصعوبة</span>
                        <span className="text-slate-800">{selectedExercise.difficulty}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">الوقت التقديري</span>
                        <span className="text-slate-800">{selectedExercise.default_duration}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-0.5">الحرق المتوقع</span>
                        <span className="text-slate-800">{selectedExercise.default_calories}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Side: Steps & Warnings */}
                <div className="space-y-6">
                  {/* Steps */}
                  <div>
                    <h3 className="font-black text-sm text-slate-800 mb-3 flex items-center gap-2">
                      <ListChecks size={18} className="text-forest" /> خطوات الأداء الصحيح
                    </h3>
                    <ol className="space-y-2.5">
                      {selectedExercise.steps?.map((step, idx) => (
                        <li key={idx} className="text-xs font-bold text-slate-600 leading-relaxed flex gap-2">
                          <span className="bg-forest/10 text-forest w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black">{idx + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Common Mistakes */}
                  {selectedExercise.mistakes && selectedExercise.mistakes.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm text-slate-800 mb-3 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" /> أخطاء شائعة تجنبها
                      </h3>
                      <div className="space-y-2">
                        {selectedExercise.mistakes.map((m, idx) => (
                          <div key={idx} className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl text-xs font-bold">
                            <span className="text-amber-700 block mb-0.5">{m.title}</span>
                            <span className="text-slate-500 font-normal leading-relaxed">{m.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {selectedExercise.tips && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl text-xs leading-relaxed font-bold text-blue-800">
                      <span className="block mb-1 font-black">💡 نصيحة الطبيب:</span>
                      {selectedExercise.tips}
                    </div>
                  )}

                  {/* Warnings */}
                  {selectedExercise.warnings && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl text-xs leading-relaxed font-bold text-rose-800">
                      <span className="block mb-1 font-black">⚠️ تحذير طبي هام:</span>
                      {selectedExercise.warnings}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD NEW EXERCISE MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2.5rem]">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Plus className="text-forest" /> إضافة تمرين جديد للمكتبة</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveExercise} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">اسم التمرين بالعربية (أو الإنجليزية)</label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                    placeholder="مثال: سكوات منزلي"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">التصنيف الأساسي</label>
                  <select 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                  >
                    <option value="STRENGTH">قوة وبناء عضلي</option>
                    <option value="CARDIO">لياقة وكارديو</option>
                    <option value="STRETCHING">مرونة وإطالة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">الصعوبة</label>
                  <select 
                    value={newDifficulty} 
                    onChange={e => setNewDifficulty(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                  >
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">عضلة الجسم الرئيسية</label>
                  <select 
                    value={newBodyPart} 
                    onChange={e => setNewBodyPart(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                  >
                    <option value="الصدر">الصدر</option>
                    <option value="الظهر">الظهر</option>
                    <option value="الساقين">الساقين</option>
                    <option value="الأكتاف">الأكتاف</option>
                    <option value="الجذع">البطن والجذع</option>
                    <option value="كامل الجسم">كامل الجسم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">اسم العضلة التفصيلي</label>
                  <input 
                    type="text" 
                    value={newMuscle} 
                    onChange={e => setNewMuscle(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                    placeholder="مثال: البايسبس، عضلات البطن العلوية"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">الأداة المطلوبة</label>
                  <select 
                    value={newEquipment} 
                    onChange={e => setNewEquipment(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                  >
                    <option value="وزن الجسم">وزن الجسم</option>
                    <option value="دمبلز">دمبلز</option>
                    <option value="باربل">باربل</option>
                    <option value="بار عقلة">بار عقلة</option>
                    <option value="جيم">أجهزة الجيم</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">الجولات والعدة الافتراضية</label>
                  <input 
                    type="text" 
                    value={newSets} 
                    onChange={e => setNewSets(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                    placeholder="مثال: 3 جولات × 12 تكرار"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">الوقت الافتراضي</label>
                  <input 
                    type="text" 
                    value={newDuration} 
                    onChange={e => setNewDuration(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                    placeholder="مثال: 12 min"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">السعرات المتوقع حرقها</label>
                  <input 
                    type="text" 
                    value={newCalories} 
                    onChange={e => setNewCalories(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                    placeholder="مثال: 90 kcal"
                  />
                </div>
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">رابط الصورة (Image URL)</label>
                  <input 
                    type="text" 
                    value={newImageUrl} 
                    onChange={e => setNewImageUrl(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest text-left"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">رابط الـ GIF التوضيحي (GIF URL)</label>
                  <input 
                    type="text" 
                    value={newGifUrl} 
                    onChange={e => setNewGifUrl(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest text-left"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Steps (Dynamic list) */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 flex justify-between items-center">
                  <span>خطوات الأداء والتنفيذ</span>
                  <button type="button" onClick={handleAddStep} className="text-forest hover:underline text-[10px] font-black flex items-center gap-1"><Plus size={12}/> إضافة خطوة</button>
                </label>
                <div className="space-y-2">
                  {newSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="w-6 text-xs text-slate-400 font-bold text-center">{idx + 1}</span>
                      <input 
                        type="text" 
                        value={step} 
                        onChange={e => handleStepChange(idx, e.target.value)}
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                        placeholder="اكتب تفاصيل هذه الخطوة..."
                      />
                      {newSteps.length > 1 && (
                        <button type="button" onClick={() => handleRemoveStep(idx)} className="text-rose-400 hover:text-rose-600"><X size={18}/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mistakes (Dynamic list) */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 flex justify-between items-center">
                  <span>الأخطاء الشائعة لتجنبها</span>
                  <button type="button" onClick={handleAddMistake} className="text-forest hover:underline text-[10px] font-black flex items-center gap-1"><Plus size={12}/> إضافة خطأ</button>
                </label>
                <div className="space-y-3">
                  {newMistakes.map((mistake, idx) => (
                    <div key={idx} className="flex gap-3 items-center border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          value={mistake.title} 
                          onChange={e => handleMistakeChange(idx, 'title', e.target.value)}
                          className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          placeholder="عنوان الخطأ (مثال: تقوس الظهر)"
                        />
                        <input 
                          type="text" 
                          value={mistake.desc} 
                          onChange={e => handleMistakeChange(idx, 'desc', e.target.value)}
                          className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          placeholder="شرح الخطأ وكيفية تصحيحه..."
                        />
                      </div>
                      {newMistakes.length > 1 && (
                        <button type="button" onClick={() => handleRemoveMistake(idx)} className="text-rose-400 hover:text-rose-600"><X size={18}/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">نصائح إضافية</label>
                  <textarea 
                    value={newTips} 
                    onChange={e => setNewTips(e.target.value)} 
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                    placeholder="نصائح طبية أو طريقة التنفس الصحيحة..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">تحذيرات طبية</label>
                  <textarea 
                    value={newWarnings} 
                    onChange={e => setNewWarnings(e.target.value)} 
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest text-rose-800"
                    placeholder="يمنع في حال وجود خشونة بالركبة أو إصابة كتف سابقة..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 rounded-2xl font-black bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm"
                >
                  إلغاء
                </button>
                <Button type="submit" className="px-8 py-3 rounded-2xl shadow-xl shadow-forest/10 text-sm">
                  حفظ التمرين للمكتبة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExerciseLibrary;
