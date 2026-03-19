import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../stores/settingsStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AuthSection } from './AuthSection'
import { SyncSection } from './SyncSection'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const settings = useSettingsStore()
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const initialSnapshot = useRef<string>('')

  function getSnapshot() {
    const s = useSettingsStore.getState()
    return JSON.stringify({
      theme: s.theme,
      language: s.language,
      restTimerSeconds: s.restTimerSeconds,
      variant: s.variant,
      tabataEnabled: s.tabataEnabled,
      tabataEquipment: s.tabataEquipment,
      llmProvider: s.llmProvider,
      llmBaseUrl: s.llmBaseUrl,
      llmApiKey: s.llmApiKey,
      llmModel: s.llmModel,
    })
  }

  useEffect(() => {
    initialSnapshot.current = getSnapshot()
  }, [])

  function markChanged() {
    setHasChanges(getSnapshot() !== initialSnapshot.current)
  }

  const showSaved = useCallback(() => {
    setSaved(true)
    setHasChanges(false)
    initialSnapshot.current = getSnapshot()
  }, [])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(timer)
  }, [saved])

  function handleLanguageChange(lang: 'ru' | 'en') {
    settings.setLanguage(lang)
    i18n.changeLanguage(lang)
    markChanged()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400 font-medium animate-pulse">
            {t('settings.saved')}
          </span>
        )}
      </div>

      <AuthSection />
      <SyncSection />

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.theme')}</h2>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => { settings.setTheme(theme); markChanged() }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                settings.theme === theme
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
              }`}
            >
              {t(`settings.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.language')}</h2>
        <div className="flex gap-2">
          {([['ru', 'Русский'], ['en', 'English']] as const).map(([code, label]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                settings.language === code
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.restTimer')}</h2>
        <div className="flex gap-2">
          {[60, 90, 120, 180, 300].map((seconds) => (
            <button
              key={seconds}
              onClick={() => { settings.setRestTimerSeconds(seconds); markChanged() }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                settings.restTimerSeconds === seconds
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
              }`}
            >
              {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('cycle.selectVariant')}</h2>
        <div className="flex gap-2">
          {(['classic', 'inverted'] as const).map((v) => (
            <button
              key={v}
              onClick={() => { settings.setVariant(v); markChanged() }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                settings.variant === v
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
              }`}
            >
              {t(`cycle.${v}`)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold">{t('tabata.settings.enabled')}</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">{t('tabata.settings.enabledDesc')}</p>
          </div>
          <button
            onClick={() => { settings.setTabataEnabled(!settings.tabataEnabled); markChanged() }}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              settings.tabataEnabled
                ? 'bg-primary-500'
                : 'bg-surface-300 dark:bg-surface-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                settings.tabataEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        {settings.tabataEnabled && (
          <div className="mt-3">
            <h3 className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">
              {t('tabata.equipment.title')}
            </h3>
            <div className="flex gap-2">
              {(['bodyweight', 'kettlebell', 'cardio_machines', 'mixed'] as const).map((eq) => (
                <button
                  key={eq}
                  onClick={() => { settings.setTabataEquipment(eq); markChanged() }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                    settings.tabataEquipment === eq
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
                  }`}
                >
                  {t(`tabata.equipment.${eq}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.llm')}</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5 block">
              {t('settings.llmProvider')}
            </label>
            <div className="flex gap-2">
              {([['claude', 'Claude'], ['openai', 'OpenAI'], ['glm', 'GLM']] as const).map(([provider, label]) => (
                <button
                  key={provider}
                  onClick={() => { settings.setLlmProvider(provider); markChanged() }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                    settings.llmProvider === provider
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {settings.llmProvider === 'glm' && (
            <Input
              label={t('settings.llmBaseUrl')}
              value={settings.llmBaseUrl}
              onChange={(e) => settings.setLlmBaseUrl(e.target.value)}
              onBlur={markChanged}
              placeholder="https://open.bigmodel.cn/api/paas/v4"
            />
          )}

          <Input
            label={t('settings.llmApiKey')}
            type="password"
            value={settings.llmApiKey}
            onChange={(e) => settings.setLlmApiKey(e.target.value)}
            onBlur={markChanged}
            placeholder="sk-..."
          />

          <Input
            label={t('settings.llmModel')}
            value={settings.llmModel}
            onChange={(e) => settings.setLlmModel(e.target.value)}
            onBlur={markChanged}
            placeholder={
              settings.llmProvider === 'claude'
                ? 'claude-sonnet-4-20250514'
                : settings.llmProvider === 'glm'
                  ? 'glm-4-flash'
                  : 'gpt-4o-mini'
            }
          />
        </div>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={showSaved}
        disabled={!hasChanges && !saved}
      >
        {saved ? t('settings.saved') : t('common.save')}
      </Button>
    </div>
  )
}
