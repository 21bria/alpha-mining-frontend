<template>
  <ClientOnly>
    <ApexChart ref="chart" height="270" type="bar" :options="mergedOptions" :series="series" />
  </ClientOnly>
  <Dialog v-model:open="openDetail">
    <DialogContent class="w-[92vw] max-w-md">
      <DialogHeader>
        <DialogTitle>
          Productivity Detail - {{ selectedDetail?.label || '-' }}
        </DialogTitle>
      </DialogHeader>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-lg border p-3">
          <div class="text-muted-foreground">Productivity</div>
          <div class="font-semibold">
            {{ fmtNumber(selectedDetail?.productivity) }} t/h
          </div>
        </div>

        <div class="rounded-lg border p-3">
          <div class="text-muted-foreground">Fleet</div>
          <div class="font-semibold">
            {{ selectedDetail?.fleet ?? 0 }}
          </div>
        </div>

        <div class="rounded-lg border p-3">
          <div class="text-muted-foreground">Total Ore</div>
          <div class="font-semibold">
            {{ fmtNumber(selectedDetail?.total_ore) }}
          </div>
        </div>

        <div class="rounded-lg border p-3">
          <div class="text-muted-foreground">Working Hours</div>
          <div class="font-semibold">
            {{ fmtNumber(selectedDetail?.working_hours) }} h
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function fmtNumber(val?: number | null, digits = 2) {
  if (val == null || Number.isNaN(Number(val))) return '0'
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

const props = defineProps({
  series: {
    type: Array,
    required: true
  },
  categories: { type: Array, default: () => [] },
  colors: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  details: {
    type: Array as () => any[],
    default: () => []
  }
})

const openDetail = ref(false)
const selectedDetail = ref<any | null>(null)

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

const emit = defineEmits<{
  clickBar: [payload: {
    index: number
    category: string
    value: number
    seriesName: string
  }]
}>()

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

    events: {
      dataPointSelection: (_event: any, _chartContext: any, config: any) => {
        const index = config?.dataPointIndex

        if (index == null || index < 0 || !props.details?.[index]) return

        selectedDetail.value = props.details[index]
        openDetail.value = true
      },

      mounted: (chart: any) => {
        if (chart?.el) {
          chart.el.style.cursor = 'pointer'
        }
      }
    }
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
    theme: isDark.value ? 'dark' : 'light',

    custom: function ({ dataPointIndex }: any) {
      const d = props.details?.[dataPointIndex]
      if (!d) return ''

      return `
      <div style="
        padding:10px 12px;
        min-width:180px;
        font-size:12px;
        color:${isDark.value ? '#eee' : '#222'};
      ">
        <div style="font-weight:700;margin-bottom:6px;">
          ${d.label}
        </div>
        <div>Productivity: <strong>${fmtNumber(d.productivity)} t/h</strong></div>
        <div>Fleet: <strong>${d.fleet}</strong></div>
        <div style="
          margin-top:6px;
          border-top:1px solid ${isDark.value ? '#334155' : '#e5e7eb'};
          padding-top:6px;
          font-size:11px;
          opacity:.7;
        ">
          Click for detail →
        </div>
      </div>
      `
    }
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