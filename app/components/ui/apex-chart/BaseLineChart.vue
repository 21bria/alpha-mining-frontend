<template>
  <ClientOnly>
    <ApexChart
      ref="chart"
      type="line"
      height="260"
      :series="series"
      :options="mergedOptions"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  series: {
    type: Array,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    // default: 'Monthly Trend Mining'
  }
})


const chart = ref<ApexCharts | null>(null)
// ApexChart, bukan ApexChartsLib
// const chart = ref<InstanceType<typeof ApexChart> | null>(null)

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
  stroke: {
    curve: 'smooth',
    width: [2, 1]
  },
  // fill: {
  //   type: 'solid',
  //   opacity: [0.5, 1]
  // },

  fill: {
    type: 'gradient',
    opacity: [0.85, 0.15, 1],
    gradient: {
      inverseColors: false,
      shade: 'light',
      type: "vertical",
      opacityFrom: 0.55,
      opacityTo: 0.2,
      stops: [0, 100, 100, 100]
    }
  },

  dataLabels: {
  enabled: false
},
  xaxis: {
    categories: props.categories,
    labels: {
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b'
      }
    },
    axisBorder: {
      color: isDark.value ? '#334155' : '#e5e7eb'
    },
    axisTicks: {
      color: isDark.value ? '#334155' : '#e5e7eb'
    }
  },
  yaxis: [
    {
      // title: { text: 'Actual' },
      labels: {
        formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
        // style: {
        //   colors: isDark.value ? '#e5e7eb' : '#1e293b'
        // }
      },
      axisTicks: { show: true },
      axisBorder: { show: false },
      min: 0,
      max: 3500
    },
    {
      opposite: true,
      // title: { text: 'Plan' },
      labels: {
        formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
        // style: {
        //   colors: isDark.value ? '#fbbf24' : '#f59e0b'
        // }
      },
      axisTicks: { show: false },
      axisBorder: { show: true},
      min: 0,
      max: 10000
    }
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
    ? props.colors
    : isDark.value
      ? ['#60a5fa', '#facc15']
      : ['#3b82f6', '#f59e0b']
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
