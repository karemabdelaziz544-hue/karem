import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Calendar, MapPin, DollarSign, Upload, Loader2, CheckCircle } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface EventModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  
  // 👇 حالة التحقق من السعة
  const [currentCount, setCurrentCount] = useState(0);
  const [checking, setChecking] = useState(true);

  React.useEffect(() => {
    if (isOpen && event) {
        checkCapacity();
        if (user) checkUserBooking();
    }
  }, [isOpen, event, user]);

  // التحقق من السعة
  const checkCapacity = async () => {
      const { count } = await supabase
        .from('event_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .neq('status', 'rejected'); // المرفوض لا يحسب من العدد
      
      setCurrentCount(count || 0);
      setChecking(false);
  };

  // التحقق هل المستخدم حجز بالفعل؟
  const checkUserBooking = async () => {
      const { data } = await supabase.from('event_bookings').select('id').eq('event_id', event.id).eq('user_id', user!.id).single();
      if (data) setIsBooked(true);
  };

  const isSoldOut = currentCount >= (event.max_capacity || 50);

  const handleBooking = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `booking-${user?.id}-${Date.now()}.${file.name.split('.').pop()}`;

    try {
        let proofUrl = null;
        if (event.price > 0) {
            const { error: uploadError } = await supabase.storage.from('payment-receipts').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('payment-receipts').getPublicUrl(filePath);
            proofUrl = data.publicUrl;
        }

        const { error } = await supabase.from('event_bookings').insert([{
            event_id: event.id,
            user_id: user?.id,
            payment_proof: proofUrl,
            status: event.price > 0 ? 'pending' : 'confirmed'
        }]);

        if (error) {
            if (error.code === '23505') throw new Error("أنت مسجل بالفعل في هذا الايفينت!");
            throw error;
        }

        await supabase.from('notifications').insert([{
            is_admin_notification: true,
            type: 'system',
            title: 'حجز ايفينت جديد 🎫',
            message: `قام مستخدم بحجز مقعد في: ${event.title}`,
            link: '/admin/events', // أو '/admin/event-bookings' لما نربطها
            user_id: user?.id
        }]);

        toast.success(event.price > 0 ? "تم إرسال طلب الحجز للمراجعة" : "تم تأكيد حجزك بنجاح!");
        setIsBooked(true);
        // تحديث العدد محلياً عشان يظهر التأثير فوراً
        setCurrentCount(prev => prev + 1);

    } catch (err: any) {
        toast.error(err.message);
    } finally {
        setUploading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* زر الإغلاق */}
        <button onClick={onClose} className="absolute top-4 left-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-md transition-all">
            <X size={24} />
        </button>

        {/* صورة الغلاف */}
        <div className="h-48 md:h-64 relative bg-gray-200 shrink-0">
            <img 
                src={event.image_url || 'https://images.unsplash.com/photo-1544367563-12123d8959bd'} 
                alt={event.title} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 right-4 text-white">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-1">{event.title}</h2>
                <div className="flex gap-4 text-sm font-bold opacity-90">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(event.event_date).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {event.location || 'أونلاين'}</span>
                </div>
            </div>
        </div>

        {/* المحتوى Scrollable */}
        <div className="p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <span className="text-xs text-gray-400 font-bold block">سعر التذكرة</span>
                    <span className={`text-xl font-black ${event.price > 0 ? 'text-forest' : 'text-green-600'}`}>
                        {event.price > 0 ? `${event.price} ج.م` : 'مجانـــاً 🎉'}
                    </span>
                </div>
                {event.price > 0 && <DollarSign className="text-orange opacity-20" size={40} />}
            </div>

            <h3 className="font-bold text-forest mb-2 text-lg">تفاصيل الحدث</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
                {event.description || "لا توجد تفاصيل إضافية."}
            </p>

            {/* منطقة الحجز والتحقق */}
            <div className="border-t border-gray-100 pt-6">
                {checking ? (
                    <div className="text-center text-gray-400 text-sm font-bold flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} /> جاري التحقق من المقاعد...
                    </div>
                ) : isSoldOut && !isBooked ? ( // لو مليان وأنت مش حاجز
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-bold border border-red-100 flex flex-col items-center">
                        <span className="text-2xl mb-1">🚫</span>
                        <span>نعتذر، العدد مكتمل لهذا الحدث (Sold Out)</span>
                        <span className="text-xs font-normal mt-1">تابعنا لمعرفة المواعيد القادمة</span>
                    </div>
                ) : !user ? (
                    <div className="text-center py-4 bg-orange/5 rounded-xl border border-orange/10">
                        <p className="text-orange font-bold mb-2">سجل دخولك لتحجز مكانك!</p>
                        <Link to="/login" className="inline-block px-6 py-2 bg-forest text-white rounded-lg font-bold text-sm hover:bg-forest/90">تسجيل الدخول</Link>
                    </div>
                ) : isBooked ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-bold flex flex-col items-center gap-2">
                        <CheckCircle size={32} />
                        تم تسجيل طلبك بنجاح!
                    </div>
                ) : (
                    /* حالة الحجز المتاح */
                    <>
                        {event.price > 0 ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 font-bold text-center">
                                    لحجز مقعدك، يرجى تحويل المبلغ على <span className="text-black font-mono">010XXXXXXXX</span> ثم رفع الإيصال.
                                    <br/><span className="text-xs text-orange">(المقاعد المتبقية محدودة!)</span>
                                </p>
                                <label className="block w-full py-4 border-2 border-dashed border-forest/30 bg-forest/5 rounded-xl cursor-pointer hover:bg-forest/10 transition-all text-center relative">
                                    <input type="file" accept="image/*" onChange={handleBooking} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                                    <div className="flex flex-col items-center gap-2 text-forest">
                                        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                                        <span className="font-bold">{uploading ? 'جاري الحجز...' : 'رفع الإيصال وتأكيد الحجز'}</span>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <Button 
                                onClick={() => handleBooking({ target: { files: ['dummy'] } } as any)} 
                                className="w-full justify-center py-4 text-lg"
                                disabled={uploading}
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : 'حجز تذكرة مجانية الآن'}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;