/**
 * Parse a non-negative integer from a free-form text input.
 * Returns clamp(min, parsed, max). Invalid/empty input falls back to `fallback`.
 */
export function parsePositiveInt(
  raw: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 }: { min?: number; max?: number; fallback?: number } = {},
): number {
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

/**
 * Parse a non-negative float (with 0.1 precision) from free-form text.
 */
export function parsePositiveFloat(
  raw: string,
  { min = 0, max = Number.MAX_VALUE, fallback = 0 }: { min?: number; max?: number; fallback?: number } = {},
): number {
  const n = parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

/** `mm:ss` format validator — returns true if input is a plausible 500m split. */
export function isValidSplit(s: string): boolean {
  if (!s) return false
  const m = /^(\d{1,2}):([0-5]\d)(?:\.\d+)?$/.exec(s.trim())
  if (!m) return false
  const min = parseInt(m[1], 10)
  return min >= 0 && min < 20
}

/** Clamp a user age to a reasonable window (0-120). */
export function clampAge(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 120) return 120
  return Math.round(n)
}

/** Clamp a body weight to a reasonable window (0-400kg). */
export function clampBodyWeight(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 400) return 400
  return Math.round(n * 10) / 10
}

/** Clamp a height in cm (0-260). */
export function clampHeight(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 260) return 260
  return Math.round(n)
}
