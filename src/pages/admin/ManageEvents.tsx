import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Plus, Edit, Trash2, Image as ImageIcon, Save, X, Loader2 } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ManageEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image_url: '',
    price: 0,
    max_capacity: 50 // 👈 القيمة الافتراضية
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', date: '', location: '', image_url: '', price: 0, max_capacity: 50 });
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: new Date(event.event_date).toISOString().split('T')[0],
      location: event.location || '',
      image_url: event.image_url || '',
      price: event.price || 0,
      max_capacity: event.max_capacity || 50 // 👈 جلب السعة
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `event-${Date.now()}.${file.name.split('.').pop()}`;

    try {
      const { error } = await supabase.storage.from('event-images').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("تم رفع الصورة ✅");
    } catch (err: any) {
      toast.error("فشل الرفع: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return toast.error("يرجى ملء البيانات الأساسية");

    setLoading(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: formData.date,
        location: formData.location,
        image_url: formData.image_url,
        price: formData.price,
        max_capacity: formData.max_capacity // 👈 الحفظ في الداتابيز
      };

      if (editingEvent) {
        // تحديث
        const { error } = await supabase.from('events').update(eventData).eq('id', editingEvent.id);
        if (error) throw error;
        toast.success("تم تعديل الفعالية بنجاح");
      } else {
        // إضافة جديد
        const { error } = await supabase.from('events').insert([eventData]);
        if (error) throw error;
        toast.success("تم إضافة الفعالية بنجاح");
      }

      fetchEvents();
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الفعالية؟")) return;
    try {
      await supabase.from('events').delete().eq('id', id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("تم الحذف");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-forest flex items-center gap-2">
          <Calendar className="text-orange" /> إدارة الفعاليات
        </h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={20} className="ml-2" /> إضافة فعالية
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
            <div className="h-48 bg-gray-100 relative">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={40}/></div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                {new Date(event.event_date).toLocaleDateString('ar-EG')}
              </div>
              <div className="absolute bottom-2 right-2 bg-forest/90 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm flex flex-col items-end">
                <span>{event.price > 0 ? `${event.price} ج.م` : 'مجاني'}</span>
                <span className="text-[10px] opacity-80">سعة: {event.max_capacity}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-forest text-lg mb-1">{event.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <MapPin size={12} /> {event.location || 'أونلاين'}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
              
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <button onClick={() => openEditModal(event)} className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm flex items-center justify-center gap-2">
                  <Edit size={16} /> تعديل
                </button>
                <button onClick={() => handleDelete(event.id)} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm flex items-center justify-center gap-2">
                  <Trash2 size={16} /> حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button onClick={resetForm} className="absolute top-4 left-4 text-gray-400 hover:text-red-500"><X size={24}/></button>
            <h2 className="text-xl font-bold text-forest mb-6 flex items-center gap-2">
              {editingEvent ? <Edit size={20}/> : <Plus size={20}/>}
              {editingEvent ? 'تعديل الفعالية' : 'إضافة فعالية جديدة'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange hover:text-orange hover:bg-orange/5 transition-all relative overflow-hidden"
              >
                {formData.image_url ? (
                  <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <>
                    {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={32} />}
                    <span className="text-sm font-bold mt-2">{uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة'}</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <Input label="عنوان الفعالية" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" label="التاريخ" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                <Input label="الموقع / الرابط" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              {/* 👇 حقول السعر والسعة */}
              <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="سعر التذكرة (0 = مجاني)" 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                />
                <Input 
                    label="أقصى عدد للحضور" 
                    type="number" 
                    value={formData.max_capacity} 
                    onChange={e => setFormData({...formData, max_capacity: Number(e.target.value)})} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">التفاصيل</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-orange focus:ring-0 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <Button className="w-full justify-center py-3" disabled={loading || uploading}>
                <Save size={18} className="ml-2" /> {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;