import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export const useTypeFilterStore = defineStore('crmFilter', () => {
  const iup_id = useLocalStorage<number | null>('crm_iup_id', null)
  const start_date = useLocalStorage<string>('crm_start_date', todayISO())
  const end_date = useLocalStorage<string>('crm_end_date', todayISO())

  function setFilters(payload: {
    iup_id?: number | null
    crm_type?: string | null
    start_date?: string
    end_date?: string
  }) {
    if (payload.iup_id !== undefined) iup_id.value = payload.iup_id
    if (payload.start_date !== undefined) start_date.value = payload.start_date
    if (payload.end_date !== undefined) end_date.value = payload.end_date
  }

  function reset() {
    iup_id.value = null
    start_date.value = todayISO()
    end_date.value = todayISO()
  }

  return {
    iup_id,
    start_date,
    end_date,
    setFilters,
    reset,
  }
})