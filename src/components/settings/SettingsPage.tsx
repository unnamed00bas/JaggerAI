import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../stores/settingsStore'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const settings = useSettingsStore()
  const [saved, setSaved] = useState(false)

  const showSaved = useCallback(() => {
    setSaved(true)
  }, [])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(timer)
  }, [saved])

  function handleLanguageChange(lang: 'ru' | 'en') {
    settings.setLanguage(lang)
    i18n.changeLanguage(lang)
    showSaved()
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

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t('settings.theme')}</h2>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => { settings.setTheme(theme); showSaved() }}
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
              onClick={() => { settings.setRestTimerSeconds(seconds); showSaved() }}
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
              onClick={() => { settings.setVariant(v); showSaved() }}
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
                  onClick={() => { settings.setLlmProvider(provider); showSaved() }}
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
              onBlur={showSaved}
              placeholder="https://open.bigmodel.cn/api/paas/v4"
            />
          )}

          <Input
            label={t('settings.llmApiKey')}
            type="password"
            value={settings.llmApiKey}
            onChange={(e) => settings.setLlmApiKey(e.target.value)}
            onBlur={showSaved}
            placeholder="sk-..."
          />

          <Input
            label={t('settings.llmModel')}
            value={settings.llmModel}
            onChange={(e) => settings.setLlmModel(e.target.value)}
            onBlur={showSaved}
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
    </div>
  )
}
