import type { DayType } from '../../types'

export const DAY_COLORS: Record<DayType, { text: string; bg: string; border: string; hex: string; labelKey: string }> = {
  A: { text: 'text-[color:var(--color-day-a)]',  bg: 'bg-[color:var(--color-day-a-bg)]',  border: 'border-[color:var(--color-day-a)]/40',  hex: '#f07a4a', labelKey: 'day.a' },
  B: { text: 'text-[color:var(--color-day-b)]',  bg: 'bg-[color:var(--color-day-b-bg)]',  border: 'border-[color:var(--color-day-b)]/40',  hex: '#c8f135', labelKey: 'day.b' },
  C: { text: 'text-[color:var(--color-day-c)]',  bg: 'bg-[color:var(--color-day-c-bg)]',  border: 'border-[color:var(--color-day-c)]/40',  hex: '#4af0c4', labelKey: 'day.c' },
  D: { text: 'text-[color:var(--color-day-d)]',  bg: 'bg-[color:var(--color-day-d-bg)]',  border: 'border-[color:var(--color-day-d)]/40',  hex: '#888888', labelKey: 'day.d' },
}
