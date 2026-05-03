<template>
  <ClientOnly>
    <ApexChart ref="chart" type="line" height="270" :series="series" :options="mergedOptions" />
  </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  series: {
    type: Array as () => ApexAxisChartSeries,
    required: true
  },
  categories: {
    type: Array as () => string[],
    default: () => []
  },
  colors: {
    type: Array as () => string[],
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
})

const chart = ref<ApexCharts | null>(null)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// === BASE OPTIONS
const baseOptions = computed(() => ({
  chart: {
    type: 'line',
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
      }
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 500
    },
    fontFamily: 'Inter, sans-serif'
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
  labels: props.categories,
  markers: {
    size: 0
  },
  stroke: {
    curve: 'smooth',
    width: [0, 3,3],
    dashArray: [0, 0, 5]
  },
  fill: {
    //   opacity: [0.35, 0.45, 1],
    opacity: [0.25, 0.75, 1],
    gradient: {
      inverseColors: false,
      shade: 'light',
      type: "vertical",
      opacityFrom: 0.65,
      opacityTo: 0.35,
      stops: [0, 100, 100, 50]
    }
  },
  dataLabels: {
    enabled: false
  },

  yaxis: [

    {
      // title: {
      //   text: 'Mining',
      // },
      show: true,
      // labels: {
      //   formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
      //   style: {
      //     colors: isDark.value ? '#e5e7eb' : '#1e293b'
      //   },
      // },
    },
    {
      show: false,
      opposite: true,
      title: {
        text: 'Seling',
      },
      //  labels: {
      //   formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
      //   style: {
      //     colors: isDark.value ? '#e5e7eb' : '#1e293b'
      //   },
      // },
    },
    {
      show: true,
      opposite: true,
      title: {
        text: 'Balance',
      },
      labels: {
        formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
        offsetY: 0,
        style: {
          fontSize: '12px',

        },
      },
    },
  ],
  tooltip: {
    shared: true,
    intersect: false,
    theme: isDark.value ? 'dark' : 'light'
  },
  grid: {
    borderColor: isDark.value ? '#334155' : '#e5e7eb',
    strokeDashArray: 2
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
    labels: {
      colors: isDark.value ? '#e5e7eb' : '#1e293b'
    },
    markers: {
      width: 12,
      height: 12,
      radius: 2
    }
  }
}))

// === THEME OPTIONS
const getThemeOptions = () => ({
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  colors: props.colors.length > 0
    ? props.colors : isDark.value
      ? ['#60a5fa', '#facc15'] : ['#3b82f6', '#f59e0b']
})

// === MERGED OPTIONS
const mergedOptions = computed(() => ({
  ...baseOptions.value,
  ...getThemeOptions()
}))

// === WATCH THEME CHANGE
watch(isDark, () => {
  if (chart.value?.updateOptions) {
    chart.value.updateOptions(getThemeOptions(), false, true)
  }
})
</script>
