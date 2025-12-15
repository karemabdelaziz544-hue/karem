import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;      // رابط الصورة (ممكن يكون فاضي)
  name?: string;            // الاسم (عشان ناخد أول حرف لو مفيش صورة)
  size?: 'sm' | 'md' | 'lg' | 'xl'; // أحجام مختلفة
  className?: string;       // أي تنسيق إضافي
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  
  // تحديد الأبعاد حسب الحجم
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-3xl',
  };

  // لو فيه صورة، اعرضها
  if (src) {
    return (
      <img 
        src={src} 
        alt={name || 'User'} 
        className={`rounded-full object-cover border border-gray-100 shadow-sm ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // لو مفيش صورة، اعرض الحرف الأول بخلفية ملونة
  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold bg-forest/10 text-forest border border-forest/10 ${sizeClasses[size]} ${className}`}
    >
      {name ? name[0].toUpperCase() : <User size={16} />}
    </div>
  );
};

export default Avatar;