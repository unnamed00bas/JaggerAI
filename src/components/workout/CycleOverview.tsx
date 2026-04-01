import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCycleStore } from '../../stores/cycleStore'
import { db } from '../../lib/db'
import { getCycleWeeks, getBlock } from '../../lib/juggernaut'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { Block } from '../../types'
import { MAIN_LIFTS, workingWeightKey } from '../../types'

const BLOCK_COLORS: Record<Block, string> = {
  1: 'bg-blue-500',
  2: 'bg-yellow-500',
  3: 'bg-red-500',
}

export function CycleOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const setCurrentWeek = useCycleStore((s) => s.setCurrentWeek)
  const resetCycle = useCycleStore((s) => s.resetCycle)
  const startNextCycle = useCycleStore((s) => s.startNextCycle)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const cycle = useLiveQuery(
    () => (activeCycleId ? db.cycles.get(activeCycleId) : undefined),
    [activeCycleId],
  )

  const weeks = getCycleWeeks()

  if (!cycle) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-surface-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{t('cycle.overview')}</h1>
      </div>

      {/* Block legend */}
      <div className="flex gap-3 text-xs">
        {([1, 2, 3] as Block[]).map((block) => (
          <div key={block} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded-full ${BLOCK_COLORS[block]}`} />
            <span className="text-surface-500 dark:text-surface-400">{t(`blocks.short${block}`)}</span>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-4 gap-2">
        {weeks.map((week) => {
          const isCurrent = week.weekNumber === currentWeek
          const isPast = week.weekNumber < currentWeek
          const block = getBlock(week.weekNumber)

          return (
            <Card
              key={week.weekNumber}
              onClick={() => {
                setCurrentWeek(week.weekNumber)
                navigate('/')
              }}
              className={`text-center p-3 ${
                isCurrent ? 'ring-2 ring-primary-500' : ''
              } ${isPast ? 'opacity-60' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${BLOCK_COLORS[block]}`} />
              <div className="text-xs text-surface-500 dark:text-surface-400">
                {t('cycle.week', { number: week.weekNumber })}
              </div>
              <div className="text-xs font-medium mt-0.5">
                {week.isAmrapTest
                  ? 'AMRAP'
                  : week.isDeload
                    ? t('dashboard.tips.deloadTitle').replace(/.*:?\s*/, '').slice(0, 6)
                    : t(`blocks.short${block}`).slice(0, 6)}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Working weights for main lifts */}
      <Card>
        <h2 className="text-sm font-semibold mb-2">{t('analytics.weightProgress')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {MAIN_LIFTS.map((lift) => {
            const hyp = cycle.workingWeights[workingWeightKey(lift, 'hypertrophy')] ?? 0
            const str = cycle.workingWeights[workingWeightKey(lift, 'strength')] ?? 0
            return (
              <div key={lift} className="text-center">
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {t(`exercises.short.${lift}`)}
                </div>
                <div className="text-sm font-bold">
                  {hyp}/{str} {t('common.kg')}
                </div>
                <div className="text-xs text-surface-400">
                  H / S
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-surface-400 mt-2 text-center">
          1RM: {MAIN_LIFTS.map(l => `${t(`exercises.short.${l}`)} ${cycle.oneRepMaxes[l]}`).join(' / ')}
        </p>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <Button
          onClick={async () => {
            await startNextCycle()
            navigate('/')
          }}
        >
          {t('cycle.startNextCycle')}
        </Button>
        <p className="text-xs text-surface-500 dark:text-surface-400 text-center -mt-1">
          {t('cycle.nextCycleDesc')}
        </p>

        {!showResetConfirm ? (
          <Button
            variant="secondary"
            onClick={() => setShowResetConfirm(true)}
            className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
          >
            {t('cycle.resetCycle')}
          </Button>
        ) : (
          <Card className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">
              {t('cycle.resetConfirm')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowResetConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await resetCycle()
                  navigate('/cycle/new')
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
