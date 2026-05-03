export function buildQueryParams(filter: any) {
  const params = new URLSearchParams()

  if (filter.date) {
    params.append('filter_date', filter.date)
  }

  if (filter.iup_id) {
    const iup = Array.isArray(filter.iup_id)
      ? filter.iup_id.join(',')
      : String(filter.iup_id)

    params.append('iup_id', iup)
  }

  return params.toString()
}