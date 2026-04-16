import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { db } from '../../lib/db'
import { getProtocolForDay, parseSplit } from '../../lib/rowing'
import { detectRowingPr } from '../../lib/records'
import { useWorkoutStore } from '../../stores/workoutStore'
import type { DayType, Phase, RowingSession, RowingSplit } from '../../types'

interface Props {
  dayType: DayType
  phase: Phase
}

export function RowingEntry({ dayType, phase }: Props) {
  const { t } = useTranslation()
  const active = useWorkoutStore((s) => s.active)
  const setRowingSessionId = useWorkoutStore((s) => s.setRowingSessionId)
  const protocol = useMemo(() => getProtocolForDay(dayType, phase), [dayType, phase])
  const activePhase = phase === 'deload' ? null : (phase as 1 | 2 | 3 | 4)

  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    durationMin: '',
    durationSec: '',
    distanceM: '',
    avgSplit: '',
    avgPower: '',
    maxPower: '',
    avgSpm: '',
    level: '',
    calories: '',
    note: '',
  })
  const [splits, setSplits] = useState<RowingSplit[]>([])
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>(undefined)

  function addSplit() {
    setSplits((prev) => [
      ...prev,
      { splitNum: prev.length + 1, distanceM: 500, splitTime: '', spm: 0 },
    ])
  }

  function updateSplit(idx: number, patch: Partial<RowingSplit>) {
    setSplits((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  function removeSplit(idx: number) {
    setSplits((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, splitNum: i + 1 })))
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setScreenshotDataUrl(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function save() {
    if (!active) return
    const durationSec =
      (parseInt(form.durationMin || '0', 10) * 60) + parseInt(form.durationSec || '0', 10)
    const session: RowingSession = {
      id: crypto.randomUUID(),
      workoutId: active.id,
      protocolId: protocol.id,
      durationSec,
      distanceM: parseInt(form.distanceM || '0', 10),
      avgSplit: form.avgSplit || '0:00',
      avgPower: parseInt(form.avgPower || '0', 10),
      maxPower: parseInt(form.maxPower || '0', 10),
      avgSpm: parseInt(form.avgSpm || '0', 10),
      level: parseInt(form.level || '0', 10),
      calories: parseInt(form.calories || '0', 10),
      splits: splits.filter((s) => parseSplit(s.splitTime) != null),
      screenshotDataUrl,
      note: form.note || undefined,
      date: active.date,
      updatedAt: new Date().toISOString(),
    }
    await db.rowingSessions.put(session)
    await detectRowingPr(session)
    setRowingSessionId(session.id)
    setSaved(true)
  }

  if (protocol.id === 'recovery_easy' && dayType === 'D') {
    return null
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold">{t('rowing.title')}</h3>
          <p className="text-xs text-surface-400">{t(protocol.nameKey)}</p>
        </div>
        {saved && <span className="text-xs text-green-400">{t('common.done')}</span>}
      </div>

      {activePhase && (
        <p className="text-xs text-surface-400 mb-3">
          {t('rowing.target_split')}:{' '}
          <span className="text-surface-200">
            {protocol.targetSplitByPhase?.[activePhase] ?? '—'}
          </span>{' '}
          · {t('rowing.target_spm')}:{' '}
          <span className="text-surface-200">
            {protocol.targetSpmByPhase?.[activePhase] ?? '—'}
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input
          label={`${t('rowing.duration')} (мин)`}
          inputMode="numeric"
          value={form.durationMin}
          onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
        />
        <Input
          label={`${t('rowing.duration')} (с)`}
          inputMode="numeric"
          value={form.durationSec}
          onChange={(e) => setForm((f) => ({ ...f, durationSec: e.target.value }))}
        />
        <Input
          label={t('rowing.distance')}
          inputMode="numeric"
          value={form.distanceM}
          onChange={(e) => setForm((f) => ({ ...f, distanceM: e.target.value }))}
        />
        <Input
          label={t('rowing.avg_split')}
          placeholder="2:05"
          value={form.avgSplit}
          onChange={(e) => setForm((f) => ({ ...f, avgSplit: e.target.value }))}
        />
        <Input
          label={t('rowing.avg_power')}
          inputMode="numeric"
          value={form.avgPower}
          onChange={(e) => setForm((f) => ({ ...f, avgPower: e.target.value }))}
        />
        <Input
          label={t('rowing.max_power')}
          inputMode="numeric"
          value={form.maxPower}
          onChange={(e) => setForm((f) => ({ ...f, maxPower: e.target.value }))}
        />
        <Input
          label={t('rowing.avg_spm')}
          inputMode="numeric"
          value={form.avgSpm}
          onChange={(e) => setForm((f) => ({ ...f, avgSpm: e.target.value }))}
        />
        <Input
          label={t('rowing.level')}
          inputMode="numeric"
          value={form.level}
          onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
        />
        <Input
          label={t('rowing.calories')}
          inputMode="numeric"
          value={form.calories}
          onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
          className="col-span-2"
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-surface-400">{t('rowing.splits')}</span>
          <button onClick={addSplit} className="text-xs text-[color:var(--color-accent-500)]">
            + {t('rowing.add_split')}
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {splits.map((s, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-1">
              <span className="col-span-1 text-[11px] text-surface-500 self-center">#{s.splitNum}</span>
              <input
                value={s.splitTime}
                placeholder="2:05"
                onChange={(e) => updateSplit(idx, { splitTime: e.target.value })}
                className="col-span-2 px-2 py-1.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-100 text-center tabular-nums"
              />
              <input
                value={s.spm || ''}
                placeholder="SPM"
                inputMode="numeric"
                onChange={(e) => updateSplit(idx, { spm: parseInt(e.target.value, 10) || 0 })}
                className="col-span-1 px-2 py-1.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-100 text-center tabular-nums"
              />
              <button
                onClick={() => removeSplit(idx)}
                className="col-span-1 text-xs text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs text-surface-400 block mb-1">{t('rowing.attach_screenshot')}</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs" />
        {screenshotDataUrl && (
          <img src={screenshotDataUrl} alt="screenshot" className="mt-2 rounded-lg max-h-40 border border-surface-700" />
        )}
      </div>

      <Button
        onClick={save}
        disabled={saved}
        className="w-full mt-3"
        variant="secondary"
        size="sm"
      >
        {saved ? t('common.done') : t('rowing.save')}
      </Button>
    </Card>
  )
}
