<template>
  <!-- <div class="chart-scroll-wrapper"> -->
    <!-- <div class="chart-inner" :style="chartMinWidth ? { minWidth: chartMinWidth + 'px' } : {}"> -->
      <ClientOnly>
        <ApexChart ref="chart" type="line" height="270" :series="series" :options="mergedOptions" />
      </ClientOnly>
    <!-- </div> -->
  <!-- </div> -->

</template>



<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'

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


const { width } = useWindowSize()
const chartMinWidth = computed(() => {
  const count = props.categories?.length ?? 0
  if (count === 0) return 0

  if (width.value < 1024) {
    const isDate = props.categories?.[0]?.includes('-')

    // ⬇ dipersempit dikit
    const perItemWidth = isDate ? 75 : 38

    return Math.max(650, count * perItemWidth)
  }

  return 0
})


function getYValue(d: any): number {
  if (d == null) return 0

  if (typeof d === 'number') {
    return d
  }

  if (Array.isArray(d)) {
    // contoh tipe [number, number | null]
    return typeof d[1] === 'number' ? d[1]! : 0
  }

  if (typeof d === 'object' && 'y' in d && typeof d.y === 'number') {
    return d.y
  }

  return 0
}

const legendColor = computed(() =>
  isDark.value ? '#e5e7eb' : '#1e293b'
)

const chart = ref<ApexCharts | null>(null)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const maxY = computed(() => {
  if (!props.series) return 0

  const allValues = props.series.flatMap(serie =>
    serie.data.map(d => getYValue(d))
  )

  return Math.max(...allValues) * 1.1
})

// === BASE OPTIONS
const baseOptions = computed<ApexOptions>(() => ({
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
  // fill: {
  //   type: 'solid',
  //   opacity: [0.25, 1],
  // },
  fill: {
    type: ['gradient', 'solid'],
    gradient: {
      shade: 'light',
      type: "vertical",
      shadeIntensity: 0.2,
      opacityFrom: 0.6,
      opacityTo: 0.3,
      stops: [0, 100]
    }
  },
  stroke: {
    curve: 'smooth',
    width: [1, 3],
    dashArray: [0, 4]
  },

  dataLabels: {
    enabled: false
  },
  yaxis: [
    {
      min: 0,
      max: maxY.value,
      labels: {
        formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
      },
    },
    {
      min: 0,
      max: maxY.value,
      opposite: true, //sumbu kanan
      show: false,
      title: {
        text: 'Plan',
      },
      labels: {
        formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
      }
    }
  ],
  xaxis: {
  tickPlacement: 'between',
  labels: {
    rotate: -30,
    trim: false,
    style: {
      fontSize: '11px'
    }
  }
},

  tooltip: {
    shared: true,
    intersect: false,
    theme: isDark.value ? 'dark' : 'light',
    y: {
      // formatter: (val: number) => val.toLocaleString() //  menampilkan nilai normal seperti "12,000"
      formatter: (val: number) => {
        const fixed = Number(val).toFixed(1)
        return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
    }
  },
  grid: {
    borderColor: isDark.value ? '#334155' : '#e5e7eb',
    strokeDashArray: 2
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
    labels: {
      // colors: isDark.value ? '#e5e7eb' : '#1e293b'
      colors: legendColor.value
    },
  },
  responsive: [
  {
    breakpoint: 768,
    options: {
      legend: {
        position: 'bottom',
        horizontalAlign: 'left',
        fontSize: '11px',
        itemMargin: {
          horizontal: 8,
          vertical: 4,
        },
      },
    },
  },
],

}))

// === THEME OPTIONS
const getThemeOptions = (): ApexOptions => ({
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  colors: props.colors.length > 0
    ? props.colors : isDark.value
      ? ['#60a5fa', '#facc15'] : ['#3b82f6', '#f59e0b']
})

// === MERGED OPTIONS
const mergedOptions = computed<ApexOptions>(() => ({
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

<style>
.chart-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}

.chart-inner {
  width: fit-content;
  min-width: 100%;
}
</style>