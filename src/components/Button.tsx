import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', onClick, ...props }) => {
  const baseStyles = "px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer";
  
  const variants = {
    primary: "bg-orange text-white hover:bg-orange-hover hover:shadow-lg hover:shadow-orange/30",
    outline: "border-2 border-forest text-forest hover:bg-forest hover:text-white",
    ghost: "text-forest hover:bg-sage/50"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={props.disabled}
      type={props.type}
    >
      {children}
    </motion.button>
  );
};

export default Button;