import type { ReactNode } from 'react'
import { Card } from './Card'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center text-center py-8 gap-2">
      {icon && <div className="text-3xl mb-1" aria-hidden>{icon}</div>}
      <h3 className="text-sm font-semibold text-surface-200">{title}</h3>
      {description && (
        <p className="text-xs text-surface-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}
