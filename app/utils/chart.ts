export function buildFilterParams(filterType: string, chartFilter: any): URLSearchParams {
  const params = new URLSearchParams()
  params.append('filter_type', filterType)

  switch (filterType) {
    case 'daily':
      if (chartFilter.date) params.append('filter_date', chartFilter.date)
      break

    case 'weekly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      if (chartFilter.month) params.append('month', chartFilter.month.value.toString())
      if (chartFilter.week) {
        const weekParam = `${chartFilter.year}-${String(chartFilter.week).padStart(2, '0')}`
        params.append('week', weekParam)
      }
      break

    case 'monthly':
      if (chartFilter.year) params.append('filter_year', chartFilter.year.toString())
      if (chartFilter.month) params.append('filter_month', chartFilter.month.value.toString())
      break

    case 'range':
      if (chartFilter.range?.start) params.append('date_start', chartFilter.range.start)
      if (chartFilter.range?.end) params.append('date_end', chartFilter.range.end)
      break

    case 'yearly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      break

    case 'all':
      // tidak perlu param tambahan
      break
  }

  return params
}
