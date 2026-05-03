<template>
  <ClientOnly>

    <div class="flex flex-wrap tems-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
      <!-- Donut Chart -->
      <div class="relative w-20 h-20 ml-2 mr-2">
        <ApexChart type="radialBar" :series="[percent]" :options="chartOptions" width="80" height="80" />
        <div class="absolute inset-0 flex items-center justify-center text-sm font-normal" :class="textColor">
          {{ percent }}%
        </div>
      </div>
      <div class="relative w-20 h-20 ml-2 mr-2">
        <ApexChart type="radialBar" :series="[percent]" :options="chartOptions" width="80" height="80" />
        <div class="absolute inset-0 flex items-center justify-center text-sm font-normal" :class="textColor">
          {{ percent }}%
        </div>
      </div>

    </div>
  </ClientOnly>

</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import { computed } from 'vue'

const props = defineProps({
  percent: Number,
  value: [String, Number],
  label: String,
  color: {
    type: String,
    default: '#0ea5e9' // default: blue
  }
})

const textColor = computed(() =>
  props.color.includes('fbbf24') || props.color.includes('yellow')
    ? 'text-yellow-500 dark:text-yellow-400'
    : 'text-sky-500 dark:text-sky-400'
)

const chartOptions = computed(() => ({
  chart: {
    sparkline  : { enabled: true },
    animations : { enabled: false },
    background : 'transparent'
  },
  tooltip: {
    enabled: true,
  },
  fill: {
    colors: [props.color]
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '70%' // ✅ lebih kecil = tebal pinggir
      },
      track: {
        background: '#f3f4f6',
        strokeWidth: '100%',
        margin: 0
      },
      dataLabels: {
        show: false
      }
    }
  },
  labels: [],
}))
</script>
