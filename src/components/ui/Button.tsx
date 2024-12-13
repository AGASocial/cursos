import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
        ${variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transform hover:scale-[1.02]' : ''}
        ${variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : ''}
        ${variant === 'outline' ? 'border bg-white transform hover:scale-[1.02]' : ''}
        ${size === 'sm' ? 'h-9 px-4 text-sm' : ''}
        ${size === 'md' ? 'h-10 px-5 text-base' : ''}
        ${size === 'lg' ? 'h-12 px-6 text-lg' : ''}
        `,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);