import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm whitespace-nowrap',
            side === 'top' && '-top-8 left-1/2 transform -translate-x-1/2',
            side === 'right' && 'top-1/2 left-full ml-2 transform -translate-y-1/2',
            side === 'bottom' && 'top-full left-1/2 mt-2 transform -translate-x-1/2',
            side === 'left' && 'top-1/2 right-full mr-2 transform -translate-y-1/2'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};