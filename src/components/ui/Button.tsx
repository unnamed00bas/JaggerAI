import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-600',
  ghost: 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-medium transition-colors active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
