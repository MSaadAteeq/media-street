import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '@/assets/media-street-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textColor?: 'dark' | 'light';
}
const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
};
const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
};
const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textColor = 'dark'
}) => {
  return <Link to="/" className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${className}`}>
      {/* Logo Icon */}
      <img 
        src={logoImage} 
        alt="Media Street Logo" 
        className={`${sizes[size]} object-contain`}
      />

      {/* Logo Text */}
      {showText && <span className={`font-bold ${textSizes[size]} leading-none bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent`}>
        Media Street™
      </span>}
    </Link>;
};
export default Logo;