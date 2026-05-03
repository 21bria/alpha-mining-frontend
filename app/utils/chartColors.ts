/**
 * Palette aman (warna jelas & beda)
 * Dipakai dulu sebelum jatuh ke hash
 */

export const DEFAULT_CHART_PALETTE: string[] = [
  '#25658d', // denim
  '#398968', // viridian
  '#8fb141', // Avocado
  '#ee9b00', // Radiant sunset
  '#ee9b00', // Burnt sienna
  '#cad84a', // June bud
  '#379a86', // Dusty teal
  '#439eb0', // hippiie blue
  '#006073', // deep turquoise
  '#0a9396', // lagoon dream
  '#95d3bd', // soothing seafoam
  '#bb3e04', // Rich Terracotta
  '#f97316', // orange
]

/**
 * Hash string → number stabil
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

/**
 * Generate warna dari label (konsisten & minim tabrakan)
 */
export function colorFromLabel(label: string, index = 0): string {
  if (index < DEFAULT_CHART_PALETTE.length) {
    return DEFAULT_CHART_PALETTE[index]!
  }

  const hash = hashCode(label)
  const hue = hash % 360
  const lightness = 45 + (hash % 20)

  return `hsl(${hue}, 65%, ${lightness}%)`
}


/**
 * Generate colors dari labels (PALING DISARANKAN)
 */
export function generateColorsFromLabels(labels: string[]): string[] {
  return labels.map((label, index) => colorFromLabel(label, index))
}

/**
 * Generate colors by count (fallback umum)
 */
export function generateColors(count: number): string[] {
  if (count <= DEFAULT_CHART_PALETTE.length) {
    return DEFAULT_CHART_PALETTE.slice(0, count)
  }

  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count
    const lightness = 50 + (i % 2) * 10 // selang-seling terang
    return `hsl(${hue}, 45%, ${lightness}%)`
  })
}
