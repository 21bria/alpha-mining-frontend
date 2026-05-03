<template>
  <ClientOnly>
    <div class="space-y-3">
      <div v-for="(item, i) in data" :key="i"
        class="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-4">
        <!-- Radial Chart -->
        <div class="relative w-16 h-16">
          <ApexChart :key="`${item.label}-${item.percent}`" type="radialBar" :series="[item.percent || 0]"
            :options="getChartOptions(item.color)" width="64" height="64" />
        </div>

        <!-- Label & Value -->
        <div class="p-4 ml-4 mt-0">
          <p :class="['text-sm font-medium leading-tight', getTextColor(item.color)]">
            {{ item.label }}
          </p>
          <h5 :class="['text-base font-semibold', getTextColor(item.color)]">
            {{ item.value || 0 }}
          </h5>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>


<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
const props = defineProps<{
  data: {
    label: string
    value: number | string
    percent: number
    color: string
  }[]
}>()

const getTextColor = (color: string) => {
  if (color.includes('facc15')) return 'text-yellow-500'
  if (color.includes('0ea5e9')) return 'text-sky-500'
  if (color.includes('fb923c')) return 'text-orange-500'
  return 'text-gray-800 dark:text-gray-100'
}
function getChartOptions(color: string): ApexOptions {
  
  return {
    chart: { sparkline: { enabled: true }, animations: { enabled: false }, background: 'transparent' },
    stroke: { lineCap: 'round' },
    colors: [color],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: '70%',
          background: 'transparent'
        },
        track: {
          background: '#e5e7eb', // light gray
          strokeWidth: '100%',
          margin: 0
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 5,
            fontSize: '13px',
            fontWeight: 700,
            show: true
          }
        }
      }
    },
    labels: ['']
  } as ApexOptions
}

</script>
