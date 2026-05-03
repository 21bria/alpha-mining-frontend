// stores/chart-filter.ts
import { defineStore } from 'pinia'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const useDailyFilterStore = defineStore('dailyFilter', {
  state: () => ({
    date: todayISO(),
    iup_id: null as number | null,
  }),

  actions: {
    setDate(date: string) {
      this.date = date
    },
    setIup(iupId: number | null) {
      this.iup_id = iupId
    },
    setFilters(payload: { date?: string; iup_id?: number | null }) {
      if (payload.date !== undefined) this.date = payload.date
      if (payload.iup_id !== undefined) this.iup_id = payload.iup_id
    }
  }
})