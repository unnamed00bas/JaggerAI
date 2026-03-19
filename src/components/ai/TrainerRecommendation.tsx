import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCycleStore } from '../../stores/cycleStore'
import { useCoachChatStore } from '../../stores/coachChatStore'
import { getCycleWeeks } from '../../lib/juggernaut'
import type { WorkoutType } from '../../types'

const WORKOUT_TYPE_OPTIONS: { type: WorkoutType | 'auto'; icon: string; labelKey: string }[] = [
  { type: 'auto', icon: '🎯', labelKey: 'dashboard.trainer.types.auto' },
  { type: 'strength', icon: '🏋️', labelKey: 'dashboard.trainer.types.strength' },
  { type: 'crossfit', icon: '💪', labelKey: 'dashboard.trainer.types.crossfit' },
  { type: 'tabata', icon: '⏱️', labelKey: 'dashboard.trainer.types.tabata' },
  { type: 'stretching', icon: '🧘', labelKey: 'dashboard.trainer.types.stretching' },
  { type: 'aerobic', icon: '🚴', labelKey: 'dashboard.trainer.types.aerobic' },
]

export function TrainerRecommendation() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const language = useSettingsStore((s) => s.language)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const setPendingPrompt = useCoachChatStore((s) => s.setPendingPrompt)

  const [showTypeSelector, setShowTypeSelector] = useState(false)

  if (!llmProvider || !llmApiKey) {
    return (
      <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
              {t('dashboard.trainer.title')}
            </h3>
            <p className="text-xs text-violet-500 dark:text-violet-400">
              {t('dashboard.trainer.noProvider')}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const weeks = getCycleWeeks()
  const weekInfo = weeks[currentWeek - 1]

  function handleSelectType(selectedType: WorkoutType | 'auto') {
    const today = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    const phaseLabel = weekInfo
      ? language === 'ru'
        ? t(`phases.${weekInfo.phase}`)
        : weekInfo.phase
      : ''

    const typeInstruction = selectedType === 'auto'
      ? language === 'ru'
        ? 'Выбери оптимальный тип тренировки (силовая / кроссфит / табата / растяжка / кардио) с учётом восстановления и баланса нагрузок.'
        : 'Choose the optimal workout type (strength / crossfit / tabata / stretching / aerobic) based on recovery and training balance.'
      : language === 'ru'
        ? `Я хочу ${WORKOUT_TYPE_LABELS_RU[selectedType]}. Спланируй полную тренировку этого типа.`
        : `I want a ${selectedType} workout. Plan a full session of this type.`

    const prompt = language === 'ru'
      ? `Спланируй мне тренировку на сегодня (${today}). Сейчас ${phaseLabel}, неделя ${currentWeek}/16. ${typeInstruction} Включи разминку, основную часть, заминку и растяжку. Для каждого упражнения укажи подходы, повторения, вес или время.`
      : `Plan my workout for today (${today}). Currently in ${phaseLabel}, week ${currentWeek}/16. ${typeInstruction} Include warm-up, main session, cool-down and stretching. Specify sets, reps, weight or duration for each exercise.`

    setPendingPrompt(prompt)
    navigate('/coach')
  }

  return (
    <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">🤖</div>
        <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
          {t('dashboard.trainer.title')}
        </h3>
      </div>

      {showTypeSelector ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">
            {t('dashboard.trainer.selectType')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleSelectType(opt.type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                  bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700/50
                  hover:bg-violet-100 dark:hover:bg-violet-800/30
                  active:bg-violet-200 dark:active:bg-violet-800/50
                  text-violet-800 dark:text-violet-200 transition-colors"
              >
                <span>{opt.icon}</span>
                <span className="truncate">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowTypeSelector(true)}
          className="w-full"
        >
          {t('dashboard.trainer.generate')}
        </Button>
      )}
    </Card>
  )
}

const WORKOUT_TYPE_LABELS_RU: Record<WorkoutType, string> = {
  strength: 'силовую тренировку',
  crossfit: 'кроссфит-комплекс',
  tabata: 'табату',
  stretching: 'растяжку и мобильность',
  aerobic: 'кардио-тренировку',
}
