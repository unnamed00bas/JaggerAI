import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-surface-600 dark:text-surface-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow ${className}`}
        {...props}
      />
    </div>
  )
}
