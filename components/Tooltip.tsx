
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[100] px-2 py-1 text-[10px] font-bold text-white bg-slate-800 border border-slate-700 rounded shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]}`}>
          {content}
          <div className={`absolute w-1.5 h-1.5 bg-slate-800 border-slate-700 rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-b border-r' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-t border-l' :
            position === 'left' ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-r' :
            'right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-b border-l'
          }`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
