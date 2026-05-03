// stores/chartFilter.ts
import { defineStore } from 'pinia'

export const filterOptions = [
  { value: '', label: '-- Select --' },
  { value: 'all', label: 'All Data' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'range', label: 'Range' },
  { value: 'daily', label: 'Daily' }
] as const

export type LooseFilterType = typeof filterOptions[number]['value']
export type FilterType = Exclude<LooseFilterType, ''>

export interface ChartFilterPayload {
  type: FilterType
  year?: number | null
  month?: number | null
  week?: string | null
  range: { start: string; end: string }
  date: string
  iup_id?: string | null
}

type MonthOption = {
  name: string
  value: number
}

export const useChartFilterStore = defineStore('chartFilter', {
  state: () => {
    const now = new Date()
    const monthIndex = now.getMonth() + 1
    const monthName = now.toLocaleString('default', { month: 'short' })

    return {
      type: 'monthly' as LooseFilterType,
      year: now.getFullYear() as number | null,
      month: {
        name: monthName,
        value: monthIndex
      } as MonthOption | null,
      week: null as string | null,
      range: {
        start: '',
        end: ''
      },
      date: '',
      iup_id: '' as string
    }
  },

  getters: {
    monthValue: (state): number | null => state.month?.value ?? null,

    filters(state) {
      return {
        filter_type: state.type,
        year: state.year,
        month: state.month?.value ?? null,
        week: state.week,
        date_start: state.range.start || null,
        date_end: state.range.end || null,
        filter_date: state.date || null,
        iup_id: state.iup_id || null
      }
    }
  },

  actions: {
    apply(payload: ChartFilterPayload) {
      this.type = payload.type
      this.year = payload.year ?? null
      this.month = payload.month
        ? {
            name: new Date(0, payload.month - 1).toLocaleString('default', { month: 'short' }),
            value: payload.month
          }
        : null
      this.week = payload.week ?? null
      this.range = payload.range ?? { start: '', end: '' }
      this.date = payload.date ?? ''
      this.iup_id = payload.iup_id ?? ''
    },

    setIup(iupId: string | number | Array<string | number> | null) {
      if (Array.isArray(iupId)) {
        this.iup_id = iupId.map(String).filter(Boolean).join(',')
        return
      }

      this.iup_id = iupId ? String(iupId) : ''
    },

    reset() {
      this.type = ''
      this.year = null
      this.month = null
      this.week = null
      this.range = { start: '', end: '' }
      this.date = ''
      this.iup_id = ''
    }
  }
})