import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 relative text-center">
        <button onClick={onCancel} className="absolute top-4 left-4 p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
            <X size={20} />
        </button>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
            إلغاء
          </button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="flex-1 py-3 text-white rounded-xl font-bold transition-colors shadow-lg bg-red-500 hover:bg-red-600 shadow-red-200">
            نعم، تأكيد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;