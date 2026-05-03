<template>
  <ClientOnly>
    <ApexChart
      type="donut"
      :options="options"
      :series="props.series"
      :width="props.width"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import type { PropType } from 'vue'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function formatNumberShort(value: number) {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return value.toFixed(1)
}

const props = defineProps({
  series: {
    type: Array as PropType<number[]>,
    required: true,
  },
  labels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  colors: {
    type: Array as PropType<string[]>,
    required: false,
  },
  width: {
    type: [String, Number],
    default: 310,
  },
  legend: {
    type: Boolean,
    default: true,
  },
})

const options = computed<ApexOptions>(() => ({
  chart: {
    type: 'donut',
    width: props.width,
    background: 'transparent',
  },
  labels: props.labels,
  theme: {
    mode: isDark.value ? 'dark' : 'light',
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: isDark.value ? ['#1f2937'] : ['#f9fafb'],
  },
  legend: {
    show: false,
    position: 'bottom',
    labels: {
      colors: isDark.value ? '#e5e7eb' : '#1e293b'
    }
  },
  fill: {
    opacity: 0.9,
  },
  plotOptions: {
    pie: {
      expandOnClick: false,
      donut: {
        size: '80%',
        background: 'transparent',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '20px',
            color: isDark.value ? '#e5e7eb' : '#495057',
            offsetY: -4,
          },
          value: {
            show: true,
            fontSize: '18px',
            color: isDark.value ? '#e5e7eb' : '#495057',
            offsetY: 8,
            formatter: (val: string) => `${Number(val).toFixed(1)}%`,
          },
          total: {
            show: true,
            showAlways: true,
            label: 'Total',
            fontSize: '22px',
            fontWeight: 600,
            color: isDark.value ? '#e5e7eb' : '#495057',
            formatter: (w: any) => {
              const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
              return formatNumberShort(total)
            },
          },
        },
      },
    },
  },
  ...(props.colors?.length ? { colors: props.colors } : {}),
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: { width: 260 },
        legend: { show: false },
      },
    },
  ],
}))
</script>