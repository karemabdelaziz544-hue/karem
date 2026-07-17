import React from 'react';
import { X, Calendar, MapPin, DollarSign } from 'lucide-react';

interface EventModalProps {
    event: any;
    isOpen: boolean;
    onClose: () => void;
}

const EventDetailsModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 left-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-md transition-all">
                    <X size={24} />
                </button>

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
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.event_date).toLocaleDateString('ar-EG')}</span>
                            <span className="flex items-center gap-1"><MapPin size={14} /> {event.location || 'أونلاين'}</span>
                        </div>
                    </div>
                </div>

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

                    <div className="border-t border-gray-100 pt-6 text-center space-y-4">
                        <p className="text-base text-forest font-bold">
                            يمكنك حجز الفعاليات من خلال تطبيق Healix.
                        </p>
                        <a
                            href="/#download"
                            onClick={onClose}
                            className="w-full block text-center py-4 bg-forest text-white rounded-full font-black text-base hover:bg-orange shadow-xl shadow-forest/15 hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            تحميل التطبيق الآن
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;