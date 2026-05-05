<template>
  <ClientOnly>
    <ApexChart 
      ref="chart" 
      height="260" 
      type="bar" 
      :options="mergedOptions"
     :series="series" 
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  series: {
    type: Array,
    required: true
  },
  categories: { type: Array, default: () => [] },
  colors: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const chart = ref<ApexCharts | null>(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const categoryCount = computed(() => props.categories.length)

const barColumnWidth = computed(() => {
  if (categoryCount.value < 3) return '10%'
  if (categoryCount.value < 5) return '20%'
  if (categoryCount.value < 10) return '35%'
  return '50%'
})

const shouldRotateLabels = computed(() => categoryCount.value > 6)

const xLabelOptions = computed(() => ({
  rotate: shouldRotateLabels.value ? -45 : 0,
  rotateAlways: shouldRotateLabels.value,
  hideOverlappingLabels: false,
  trim: true,
  style: {
    fontSize: shouldRotateLabels.value ? '11px' : '12px',
    colors: isDark.value ? '#e5e7eb' : '#1e293b'
  }
}))

const baseOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    background: 'transparent',
    zoom: {
      enabled: true,
      type: 'x',
      autoScaleYaxis: true
    },
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false
      },
      autoSelected: 'zoom'
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 500
    },
    fontFamily: 'Inter, sans-serif',
  },
  title: {
    text: props.title,
    align: 'left',
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: isDark.value ? '#e5e7eb' : '#1e293b'
    }
  },
  xaxis: {
    categories: props.categories,
    labels: xLabelOptions.value
  },
  plotOptions: {
    bar: {
      dataLabels: { position: 'top' },
      columnWidth: barColumnWidth.value,
      endingShape: 'rounded'
    }
  },
  dataLabels: {
    enabled: false
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    labels: {
      colors: isDark.value ? '#e5e7eb' : '#1e293b'
    }
  }
}))

const getThemeOptions = (): ApexOptions => ({
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  colors: props.colors.length > 0
    ? props.colors
    : isDark.value
      ? ['#60a5fa', '#f87171']
      : ['#3b82f6', '#ef4444'],
  xaxis: {
    categories: props.categories,
    labels: xLabelOptions.value
  },
  yaxis: {
    tickAmount: 4,
    labels: {
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b'
      }
    }
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light'
  },
  grid: {
    borderColor: isDark.value ? '#334155' : '#e5e7eb',
    strokeDashArray: 2
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    fontSize: '12px',
    labels: {
      colors: isDark.value ? '#e5e7eb' : '#1e293b'
    }
  },
  responsive: [
    {
      breakpoint: 768,
      options: {
        legend: {
          position: 'bottom',
          horizontalAlign: 'left',
          fontSize: '12px',
          itemMargin: {
            horizontal: 8,
            vertical: 4,
          },
        },
        xaxis: {
          labels: {
            rotate: -45,
            rotateAlways: true,
            style: {
              fontSize: '12px',
              colors: isDark.value ? '#e5e7eb' : '#1e293b'
            }
          }
        }
      },
    },
  ],
})

const mergedOptions = computed<ApexOptions>(() => ({
  ...baseOptions.value,
  ...getThemeOptions()
}))

watch(isDark, () => {
  if (chart.value?.updateOptions) {
    chart.value.updateOptions(getThemeOptions(), false, true)
  }
})
</script>