// ~/utils/filter-query.ts

type FilterType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'range'
  | 'all'

export function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  )
}
export function buildFilterQuery(chartFilter: any) {
  const type = chartFilter.type

  const query: Record<string, any> = {
    filter_type: type || undefined,
    iup_id: chartFilter.iup_id || undefined,
  }

  if (type === 'daily') {
    query.filter_date = chartFilter.date || undefined
  }

  if (type === 'weekly') {
    query.year = chartFilter.year || undefined
    query.week = chartFilter.week || undefined
  }

  if (type === 'monthly') {
    query.year = chartFilter.year || undefined

    query.month =
      typeof chartFilter.month === 'object'
        ? chartFilter.month?.value
        : chartFilter.month || undefined
  }

  if (type === 'yearly') {
    query.year = chartFilter.year || undefined
  }

  if (type === 'range') {
    query.date_start = chartFilter.range?.start || undefined
    query.date_end = chartFilter.range?.end || undefined
  }

  return cleanQuery(query)
}