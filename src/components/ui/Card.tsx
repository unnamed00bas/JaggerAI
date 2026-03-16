import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const base = 'bg-white dark:bg-surface-800 rounded-2xl p-4 shadow-sm border border-surface-100 dark:border-surface-700'
  const interactive = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''

  return (
    <div className={`${base} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
