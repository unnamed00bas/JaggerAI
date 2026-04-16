interface WeightInputProps {
  label: string
  value: string
  setValue: (v: string) => void
  step: number
}

export function WeightInput({ label, value, setValue, step }: WeightInputProps) {
  function adjust(delta: number) {
    const current = parseFloat(value || '0')
    const next = Number.isFinite(current) ? current + delta : delta
    setValue(String(Math.max(0, next)))
  }

  return (
    <div>
      <label className="text-[11px] text-surface-400 block mb-1">{label}</label>
      <div className="flex items-stretch">
        <button
          type="button"
          aria-label={`${label} −${step}`}
          onClick={() => adjust(-step)}
          className="px-2 bg-surface-800 border border-r-0 border-surface-700 rounded-l-lg text-surface-300"
        >
          −
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          className="flex-1 w-full px-2 py-1.5 bg-surface-800 border border-surface-700 text-center text-sm text-surface-100 tabular-nums"
          aria-label={label}
        />
        <button
          type="button"
          aria-label={`${label} +${step}`}
          onClick={() => adjust(step)}
          className="px-2 bg-surface-800 border border-l-0 border-surface-700 rounded-r-lg text-surface-300"
        >
          +
        </button>
      </div>
    </div>
  )
}
