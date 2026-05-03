// utils/query.ts

/**
 * Remove null / undefined / empty string dari query params
 * biar URL clean dan tidak kirim parameter kosong ke backend
 */
export function cleanQuery(params: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
    )
  )
}

/**
 * Convert object ke URLSearchParams (optional helper)
 */
export function toQueryString(params: Record<string, any>) {
  const cleaned = cleanQuery(params)
  return new URLSearchParams(cleaned as any).toString()
}

/**
 * Merge query lama + baru (dipakai saat update filter)
 */
export function mergeQuery(
  oldQuery: Record<string, any>,
  newQuery: Record<string, any>
) {
  return cleanQuery({
    ...oldQuery,
    ...newQuery
  })
}

/**
 * Parse query string ke object (kalau butuh reverse)
 */
export function parseQuery(query: Record<string, any>) {
  const result: Record<string, any> = {}

  for (const key in query) {
    const value = query[key]

    if (Array.isArray(value)) {
      result[key] = value[0]
    } else {
      result[key] = value
    }
  }

  return result
}