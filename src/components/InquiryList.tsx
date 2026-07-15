import React from 'react';
import { Search, Inbox, Users, History, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Avatar from './Avatar';
import type { Inquiry, InquiryCategory, InquiryStatus, Profile } from '../types';

// ─── Category & Status Maps (matching mobile app) ──────────
export const CATEGORY_MAP: Record<InquiryCategory, { icon: string; label: string; color: string }> = {
  nutrition: { icon: '🥗', label: 'النظام الغذائي', color: '#10B981' },
  meals:     { icon: '🍽️', label: 'الوجبات', color: '#F59E0B' },
  weight:    { icon: '⚖️', label: 'الوزن', color: '#3B82F6' },
  exercises: { icon: '🏋️', label: 'التمارين', color: '#8B5CF6' },
  symptoms:  { icon: '🩺', label: 'الأعراض', color: '#EF4444' },
  other:     { icon: '❓', label: 'مشكلة أخرى', color: '#6B7280' },
};

export const STATUS_MAP: Record<InquiryStatus, { label: string; color: string; bg: string }> = {
  open:         { label: 'مفتوح', color: '#3B82F6', bg: '#DBEAFE' },
  under_review: { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FEF3C7' },
  replied:      { label: 'تم الرد', color: '#10B981', bg: '#D1FAE5' },
  closed:       { label: 'مغلق', color: '#6B7280', bg: '#F3F4F6' },
};

// ─── Types ─────────────────────────────────────────────────
export interface InquiryWithClient extends Inquiry {
  client_name: string;
  client_avatar: string | null;
  unread_count: number;
  last_message_text: string | null;
  last_message_at: string | null;
}

interface InquiryListProps {
  inquiries: InquiryWithClient[];
  selectedInquiryId: string | null;
  onSelectInquiry: (inquiry: InquiryWithClient) => void;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeTab: 'active' | 'archived' | 'all';
  onTabChange: (tab: 'active' | 'archived' | 'all') => void;
}

// ─── Tab Button ────────────────────────────────────────────
const TabButton = ({ active, onClick, icon, label, color }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string }) => (
  <button onClick={onClick} className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${active ? `${color} text-white shadow-lg` : 'text-slate-400 hover:bg-white'}`}>
    {icon} <span className="text-[9px] font-black">{label}</span>
  </button>
);

// ─── Component ─────────────────────────────────────────────
const InquiryList: React.FC<InquiryListProps> = ({
  inquiries, selectedInquiryId, onSelectInquiry, loading,
  searchTerm, onSearchChange, activeTab, onTabChange,
}) => {
  const filtered = inquiries.filter(i =>
    i.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-96 border-l border-slate-50 flex flex-col bg-slate-50/30">
      {/* Header */}
      <div className="p-6 space-y-4 bg-white border-b border-slate-50">
        <div className="flex justify-between items-center w-full">
          <h2 className="font-black text-slate-800 text-xl tracking-tight">استفسارات الأبطال</h2>
          <div className="bg-forest/10 p-2 rounded-xl text-forest"><MessageSquare size={20} /></div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <TabButton active={activeTab === 'active'} onClick={() => onTabChange('active')} label="النشطة" icon={<Inbox size={14} />} color="bg-forest" />
          <TabButton active={activeTab === 'all'} onClick={() => onTabChange('all')} label="الكل" icon={<Users size={14} />} color="bg-slate-700" />
          <TabButton active={activeTab === 'archived'} onClick={() => onTabChange('archived')} label="المؤرشفة" icon={<History size={14} />} color="bg-orange" />
        </div>
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text" placeholder="ابحث بالاسم أو العنوان..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-forest/10 focus:bg-white transition-all shadow-inner text-right"
            value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading && inquiries.length === 0 ? (
          <div className="p-10 text-center animate-pulse"><Loader2 className="animate-spin mx-auto text-forest mb-2" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">لا توجد استفسارات في هذا القسم</div>
        ) : filtered.map((inquiry) => {
          const cat = CATEGORY_MAP[inquiry.category] || CATEGORY_MAP.other;
          const status = STATUS_MAP[inquiry.status] || STATUS_MAP.open;
          const isSelected = selectedInquiryId === inquiry.id;

          return (
            <div
              key={inquiry.id}
              onClick={() => onSelectInquiry(inquiry)}
              className={`p-4 flex items-center gap-4 rounded-[2rem] cursor-pointer transition-all relative ${isSelected ? 'bg-white shadow-lg border-r-4 border-forest' : 'hover:bg-white/60'}`}
            >
              <div className="relative shrink-0">
                <Avatar src={inquiry.client_avatar} name={inquiry.client_name} size="md" />
                {inquiry.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {inquiry.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-slate-800 text-sm truncate">{inquiry.client_name}</h3>
                  <span className="text-[9px] text-slate-400 font-bold">
                    {inquiry.last_message_at ? format(new Date(inquiry.last_message_at), 'p', { locale: ar }) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{cat.icon}</span>
                  <span className="text-[11px] font-bold text-slate-600 truncate flex-1">{inquiry.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[11px] truncate flex-1 ${inquiry.unread_count > 0 ? 'text-forest font-black' : 'text-slate-400 font-bold'}`}>
                    {inquiry.last_message_text || 'لا توجد رسائل'}
                  </p>
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-black ml-2" style={{ backgroundColor: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InquiryList;
