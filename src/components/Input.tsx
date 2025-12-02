import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full mb-4 text-right">
      <label className="block text-forest font-bold mb-2 text-sm">
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 bg-white/50 focus:bg-white transition-all outline-none
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-sage/50 focus:border-orange'
          } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>
      )}
    </div>
  );
};

export default Input;