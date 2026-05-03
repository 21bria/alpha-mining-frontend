export function formatDuration(
  minutes: number,
  options?: {
    showUnit?: boolean
    decimal?: number
  }
) {
  const showUnit = options?.showUnit ?? true
  const decimal = options?.decimal ?? 1

  if (!minutes || minutes <= 0) {
    return showUnit ? '0 min' : '0'
  }

  // Kurang dari 1 jam
  if (minutes < 60) {
    return showUnit ? `${minutes} min` : minutes
  }

  // Jam (desimal)
  const hours = minutes / 60
  const formatted = Number(hours.toFixed(decimal))

  return showUnit ? `${formatted} h` : formatted
}

export function formatDurationVerbose(minutes?: number | null) {
  if (!minutes || minutes <= 0) return '0 m'

  if (minutes < 60) return `${minutes} m`

  const h = Number((minutes / 60).toFixed(1))
  return `${h} h (${minutes} m)`
}

export function formatDurationCompact(minutes?: number | null) {
  if (!minutes || minutes <= 0) return '0 m'

  if (minutes < 60) {
    return `${minutes} m`
  }

  return `${(minutes / 60).toFixed(1)} h`
}
