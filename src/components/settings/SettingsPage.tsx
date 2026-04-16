import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useProfileStore } from '../../stores/profileStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { db } from '../../lib/db'
import i18n from '../../i18n'

export function SettingsPage() {
  const { t } = useTranslation()
  const profile = useProfileStore((s) => s.profile)
  const cycle = useProfileStore((s) => s.cycle)
  const setProfile = useProfileStore((s) => s.setProfile)
  const setCurrentWeek = useProfileStore((s) => s.setCurrentWeek)
  const resetCycle = useProfileStore((s) => s.resetCycle)

  const s = useSettingsStore()

  const workoutCount = useLiveQuery(async () => db.workouts.count(), []) ?? 0

  async function exportData() {
    const [workouts, rowingSessions, prs] = await Promise.all([
      db.workouts.toArray(),
      db.rowingSessions.toArray(),
      db.personalRecords.toArray(),
    ])
    const json = JSON.stringify(
      {
        version: 1,
        profile,
        cycle,
        workouts,
        rowingSessions,
        prs,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    )
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jaggerai-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </header>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.profile')}</h2>
        <div className="flex flex-col gap-2.5">
          <Input
            label={t('settings.name')}
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              label={t('settings.age')}
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ age: parseInt(e.target.value, 10) || 0 })}
            />
            <Input
              label={t('settings.height_cm')}
              type="number"
              value={profile.heightCm}
              onChange={(e) => setProfile({ heightCm: parseInt(e.target.value, 10) || 0 })}
            />
            <Input
              label={t('settings.weight_kg')}
              type="number"
              value={profile.weightKg}
              onChange={(e) => setProfile({ weightKg: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label={t('settings.goal')}
            value={profile.goal}
            onChange={(e) => setProfile({ goal: e.target.value })}
          />
          <Input
            label={t('settings.experience')}
            value={profile.experience}
            onChange={(e) => setProfile({ experience: e.target.value })}
          />
          <Input
            label={t('settings.equipment')}
            value={profile.equipment}
            onChange={(e) => setProfile({ equipment: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t('settings.sessions_per_week')}
              type="number"
              value={profile.sessionsPerWeek}
              onChange={(e) => setProfile({ sessionsPerWeek: parseInt(e.target.value, 10) || 0 })}
            />
            <Input
              label={t('settings.session_duration')}
              type="number"
              value={profile.sessionDurationMin}
              onChange={(e) => setProfile({ sessionDurationMin: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.cycle')}</h2>
        <Input
          label={t('settings.current_week')}
          type="number"
          min={1}
          max={16}
          value={cycle.currentWeek}
          onChange={(e) => setCurrentWeek(parseInt(e.target.value, 10) || 1)}
        />
        <p className="text-xs text-surface-500 mt-2">
          {workoutCount} {t('workout.title').toLowerCase()}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (confirm(t('settings.reset_cycle_confirm'))) resetCycle()
          }}
          className="mt-3 w-full"
        >
          {t('settings.reset_cycle')}
        </Button>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.appearance')}</h2>
        <div className="flex flex-col gap-2.5">
          <div>
            <label className="text-xs text-surface-400 block mb-1">{t('settings.theme')}</label>
            <select
              value={s.theme}
              onChange={(e) => s.setTheme(e.target.value as 'system' | 'light' | 'dark')}
              className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100"
            >
              <option value="system">{t('settings.theme_system')}</option>
              <option value="light">{t('settings.theme_light')}</option>
              <option value="dark">{t('settings.theme_dark')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-surface-400 block mb-1">{t('settings.language')}</label>
            <select
              value={s.language}
              onChange={(e) => {
                const lng = e.target.value as 'ru' | 'en'
                s.setLanguage(lng)
                i18n.changeLanguage(lng)
              }}
              className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.training')}</h2>
        <Input
          label={t('settings.rest_timer_sec')}
          type="number"
          value={s.defaultRestTimerSec}
          onChange={(e) => s.setDefaultRestTimerSec(parseInt(e.target.value, 10) || 60)}
        />
        <label className="flex items-center gap-2 text-sm mt-3">
          <input
            type="checkbox"
            checked={s.notificationsEnabled}
            onChange={(e) => s.setNotificationsEnabled(e.target.checked)}
          />
          {t('settings.notifications_on')}
        </label>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.ai')}</h2>
        <div className="flex flex-col gap-2.5">
          <div>
            <label className="text-xs text-surface-400 block mb-1">{t('settings.llm_provider')}</label>
            <select
              value={s.llmProvider ?? ''}
              onChange={(e) =>
                s.setLlmProvider((e.target.value || null) as typeof s.llmProvider)
              }
              className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100"
            >
              <option value="">{t('settings.llm_none')}</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">OpenAI</option>
              <option value="glm">GLM</option>
            </select>
          </div>
          <Input
            label={t('settings.llm_api_key')}
            type="password"
            value={s.llmApiKey}
            onChange={(e) => s.setLlmApiKey(e.target.value)}
          />
          <Input
            label={t('settings.llm_model')}
            placeholder={
              s.llmProvider === 'claude'
                ? 'claude-sonnet-4-5'
                : s.llmProvider === 'openai'
                ? 'gpt-4o-mini'
                : 'glm-4-flash'
            }
            value={s.llmModel}
            onChange={(e) => s.setLlmModel(e.target.value)}
          />
          {s.llmProvider === 'glm' && (
            <Input
              label={t('settings.llm_base_url')}
              value={s.llmBaseUrl}
              onChange={(e) => s.setLlmBaseUrl(e.target.value)}
            />
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-2">Данные</h2>
        <Button onClick={exportData} variant="secondary" size="sm" className="w-full">
          {t('settings.export_data')}
        </Button>
      </Card>

      <p className="text-xs text-surface-600 text-center pt-2">
        {t('settings.version')} 1.0.0
      </p>
    </div>
  )
}
