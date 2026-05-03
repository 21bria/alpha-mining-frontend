<template>
  <ClientOnly>
    <ApexChart
      :key="chartKey"
      ref="chart"
      height="260"
      type="bar"
      :options="mergedOptions"
      :series="reversedSeries"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import ApexChartsLib from 'apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'
import { useColorMode } from '#imports'

// Tipe untuk props
interface ChartProps {
  series: { name: string; data: number[] }[]
  categories: string[]
  colors?: string[]
  title?: string
  reverse?: boolean
}

const props = defineProps<ChartProps>()

//  Tipe untuk chart instance
const chart = ref<InstanceType<typeof ApexChartsLib> | null>(null)

const chartKey = ref(0)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// ===== 1. Reverse logic
const reversedCategories = computed(() =>
  props.reverse ? props.categories.slice().reverse() : props.categories
)

const reversedSeries = computed(() =>
  props.reverse
    ? props.series.map(s => ({
        ...s,
        data: s.data.slice().reverse()
      }))
    : props.series
)

// ===== 2. yAxisCategories watcher
const yAxisCategories = ref<string[]>(reversedCategories.value)

watch(
  [() => props.categories, () => props.reverse],
  () => {
    yAxisCategories.value = reversedCategories.value
  },
  { immediate: true }
)

// ===== 3. Base options
const baseOptions = computed(() => ({
  chart: {
    type: 'bar',
    background: 'transparent',
    animations: { enabled: true, easing: 'easeinout', speed: 500 },
    fontFamily: 'Inter, sans-serif',
    toolbar: {
      show: true,
      tools: {
        download: true,
        zoom: false,
        selection: false,
        pan: false,
        reset: false
      }
    }
  },
  title: {
    text: props.title || '',
    align: 'left',
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: isDark.value ? '#e5e7eb' : '#1e293b'
    }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      columnWidth: '60%',
      endingShape: 'rounded',
      dataLabels: {
        position: 'top'
      }
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: reversedCategories.value,
    labels: {
      formatter: (val: string | number) =>
        typeof val === 'number' ? `${(val / 1000).toFixed()}k` : val,
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b'
      }
    }
  },
  yaxis: {
    categories: yAxisCategories.value,
    reversed: props.reverse ?? false,
    labels: {
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b',
        fontSize: '12px'
      }
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    labels: {
      colors: isDark.value ? '#e5e7eb' : '#1e293b'
    }
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light'
  },
  grid: {
    borderColor: isDark.value ? '#334155' : '#e5e7eb',
    strokeDashArray: 3,
    show: false
  }
}))

// ===== 4. Theme
const themeOptions = computed(() => ({
  theme: { mode: isDark.value ? 'dark' : 'light' },
  colors:
    props.colors && props.colors.length > 0
      ? props.colors
      : isDark.value
        ? ['#60a5fa', '#f87171']
        : ['#3b82f6', '#ef4444']
}))

// ===== 5. Final merged options
const mergedOptions = computed(() => ({
  ...baseOptions.value,
  ...themeOptions.value
}))

// ===== 6. Rerender on dark/category change
watch([isDark, reversedCategories], () => {
  chartKey.value += 1
})
</script>
