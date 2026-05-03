import { defineNuxtPlugin } from '#app'
import { useChartFilterStore } from "~/stores/filters/chart-filter"

export default defineNuxtPlugin(() => {
  const store = useChartFilterStore()

  return {
    provide: {
      chartData: {
        type: store.type,
        year: store.year,
        range: store.range,
        date: store.date
      }
    }
  }
})
