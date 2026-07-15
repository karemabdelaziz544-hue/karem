import React, { useState } from 'react';
import { Archive, ChevronDown, Info } from 'lucide-react';
import Avatar from './Avatar';
import { CATEGORY_MAP, STATUS_MAP, type InquiryWithClient } from './InquiryList';
import type { InquiryStatus } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface InquiryHeaderProps {
  inquiry: InquiryWithClient;
  onStatusChange: (newStatus: InquiryStatus) => void;
  onToggleProfile: () => void;
  showProfile: boolean;
}

const STATUS_OPTIONS: { value: InquiryStatus; label: string; color: string }[] = [
  { value: 'open', label: '🔵 مفتوح', color: '#3B82F6' },
  { value: 'under_review', label: '🟡 قيد المراجعة', color: '#F59E0B' },
  { value: 'replied', label: '🟢 تم الرد', color: '#10B981' },
  { value: 'closed', label: '⚫ مغلق', color: '#6B7280' },
];

const InquiryHeader: React.FC<InquiryHeaderProps> = ({ inquiry, onStatusChange, onToggleProfile, showProfile }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const cat = CATEGORY_MAP[inquiry.category] || CATEGORY_MAP.other;
  const currentStatus = STATUS_MAP[inquiry.status] || STATUS_MAP.open;

  const handleStatusChange = async (newStatus: InquiryStatus) => {
    setUpdatingStatus(true);
    setIsDropdownOpen(false);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', inquiry.id);
      
      if (error) throw error;
      onStatusChange(newStatus);
      toast.success(`تم تغيير الحالة إلى: ${STATUS_MAP[newStatus]?.label}`);
    } catch {
      toast.error('فشل تحديث الحالة');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4 text-right">
        <Avatar src={inquiry.client_avatar} name={inquiry.client_name} size="sm" />
        <div>
          <h3 className="font-black text-slate-800 text-base leading-tight">{inquiry.client_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs">{cat.icon}</span>
            <span className="text-[11px] font-bold text-slate-500">{inquiry.title}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={updatingStatus}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border-2"
            style={{ backgroundColor: currentStatus.bg, color: currentStatus.color, borderColor: currentStatus.color + '40' }}
          >
            {currentStatus.label}
            <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 min-w-[180px] animate-in fade-in slide-in-from-top-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`w-full text-right px-4 py-3 text-xs font-black hover:bg-slate-50 transition-colors flex items-center gap-2 ${inquiry.status === opt.value ? 'bg-slate-50' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Toggle */}
        <button
          onClick={onToggleProfile}
          className={`p-2.5 rounded-xl transition-colors ${showProfile ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <Info size={20} />
        </button>
      </div>
    </div>
  );
};

export default InquiryHeader;
