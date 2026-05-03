import { defineStore } from 'pinia'
import { URL_GET_DATA } from '@/utils/api'  // tambahkan ini

export const useOreStatsStore = defineStore('oreStats', {
  state: () => ({
    stats: {} as Record<string, any>,
    isLoading: false
  }),
  actions: {
    async fetchStats(params: URLSearchParams) {
      this.isLoading = true
      try {
        const res = await fetch(`${URL_GET_DATA}dashboard/api/summary/mines?${params.toString()}`)
        const data = await res.json()
        this.stats = data
      } catch (e) {
        console.error('Gagal ambil data:', e)
        this.stats = {}
      } finally {
        this.isLoading = false
      }
    }
  }
})
