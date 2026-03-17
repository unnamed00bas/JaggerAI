import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { isSupabaseConfigured } from '../../lib/sync'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

export function AuthSection() {
  const { t } = useTranslation()
  const { user, isLoading, error, signIn, signUp, signOut, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <h2 className="text-sm font-semibold mb-2">{t('auth.title')}</h2>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {t('auth.notConfigured')}
        </p>
      </Card>
    )
  }

  if (user) {
    return (
      <Card>
        <h2 className="text-sm font-semibold mb-2">{t('auth.title')}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-surface-600 dark:text-surface-400 truncate">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm font-medium text-red-600 dark:text-red-400"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    if (mode === 'signin') {
      await signIn(email, password)
    } else {
      await signUp(email, password)
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold mb-3">{t('auth.title')}</h2>
      <div className="flex gap-2 mb-3">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); clearError() }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
              mode === m
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400'
            }`}
          >
            {t(`auth.${m}`)}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />
        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t(`auth.${mode}`)}
        </button>
      </form>
    </Card>
  )
}
