import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCycleStore } from '../../stores/cycleStore'
import { useCoachChatStore } from '../../stores/coachChatStore'
import { getCycleWeeks } from '../../lib/juggernaut'

export function TrainerRecommendation() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const llmProvider = useSettingsStore((s) => s.llmProvider)
  const llmApiKey = useSettingsStore((s) => s.llmApiKey)
  const language = useSettingsStore((s) => s.language)
  const currentWeek = useCycleStore((s) => s.currentWeek)
  const setPendingPrompt = useCoachChatStore((s) => s.setPendingPrompt)

  const [showHiitQuestion, setShowHiitQuestion] = useState(false)

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

  function handlePlanWorkout(includeHiit: boolean) {
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

    const prompt = language === 'ru'
      ? `Спланируй мне полную тренировку на сегодня (${today}). Сейчас ${phaseLabel}, неделя ${currentWeek}/16. Включи разминку, основную силовую работу по программе, подсобные упражнения, ${includeHiit ? 'HIIT/кондиционинг после силовой,' : ''} растяжку и заминку. Для каждого упражнения укажи подходы, повторения, вес или время.`
      : `Plan my full workout for today (${today}). Currently in ${phaseLabel}, week ${currentWeek}/16. Include warm-up, main strength work from the program, accessory exercises, ${includeHiit ? 'HIIT/conditioning after strength,' : ''} stretching and cool-down. Specify sets, reps, weight or duration for each exercise.`

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

      {showHiitQuestion ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            {t('dashboard.trainer.hiitQuestion')}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handlePlanWorkout(true)}
              className="flex-1"
            >
              {t('dashboard.trainer.yes')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePlanWorkout(false)}
              className="flex-1"
            >
              {t('dashboard.trainer.no')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowHiitQuestion(true)}
          className="w-full"
        >
          {t('dashboard.trainer.generate')}
        </Button>
      )}
    </Card>
  )
}
