<template>
  <ClientOnly>
    <div>
      <ApexChart ref="chart" height="270" :options="mergedOptions" :series="series" />

      <Dialog v-model:open="openDetail">
        <DialogContent class="w-[95vw] max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Detail Barging - {{ selectedDetail?.label || '-' }}
            </DialogTitle>
          </DialogHeader>

          <div class="dialog-scroll space-y-2 pr-2">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div class="rounded-lg border p-2">
                <div class="text-muted-foreground">{{ oreLabel }} Actual</div>
                <div class="font-semibold">{{ fmt(actualValue) }}</div>
              </div>

              <div class="rounded-lg border p-2">
                <div class="text-muted-foreground">{{ oreLabel }} Plan</div>
                <div class="font-semibold">{{ fmt(planValue) }}</div>
              </div>

              <div class="rounded-lg border p-2">
                <div class="text-muted-foreground">Total Barges</div>
                <div class="font-semibold">{{ bargesFiltered.length }}</div>
              </div>
            </div>

            <div v-for="(b, i) in bargesFiltered" :key="`${b.barge_code || 'unknown'}-${i}`"
              class="rounded-lg border p-2 hover:shadow-md transition">
              <div class="font-semibold">
                {{ b.barge_code || 'Unknown' }}
              </div>

              <div class="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div v-if="oreTypeKey === 'lim'">
                  <div class="text-muted-foreground">LIM</div>
                  <div class="font-medium">{{ fmt(b.lim) }}</div>
                </div>

                <div v-if="oreTypeKey === 'sap'">
                  <div class="text-muted-foreground">SAP</div>
                  <div class="font-medium">{{ fmt(b.sap) }}</div>
                </div>

                <div v-if="b.total !== undefined">
                  <div class="text-muted-foreground">Total</div>
                  <div class="font-medium">{{ fmt(b.total) }}</div>
                </div>
              </div>
            </div>

            <div v-if="!bargesFiltered.length" class="text-sm italic text-muted-foreground">
              No barges
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </ClientOnly>
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

const props = defineProps({
  series: {
    type: Array,
    required: true
  },
  colors: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  },
  oreType: {
    type: String as PropType<'LIM' | 'SAP'>,
    required: true
  }
})

const chart = ref<ApexCharts | null>(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

interface Barge {
  barge_code?: string
  lim?: number
  sap?: number
  total?: number
  barges?: Barge[]
}

interface DetailItem {
  label: string
  lim_actual?: number
  sap_actual?: number
  lim_plan?: number
  sap_plan?: number
  barges?: Barge[]
}

const openDetail = ref(false)
const selectedDetail = ref<DetailItem | null>(null)

const oreTypeKey = computed(() => props.oreType === 'LIM' ? 'lim' : 'sap')
const oreLabel = computed(() => props.oreType === 'LIM' ? 'Limonite' : 'Saprolite')

const actualValue = computed(() => {
  if (!selectedDetail.value) return 0
  return props.oreType === 'LIM'
    ? Number(selectedDetail.value.lim_actual || 0)
    : Number(selectedDetail.value.sap_actual || 0)
})

const planValue = computed(() => {
  if (!selectedDetail.value) return 0
  return props.oreType === 'LIM'
    ? Number(selectedDetail.value.lim_plan || 0)
    : Number(selectedDetail.value.sap_plan || 0)
})

const bargesFiltered = computed(() => {
  const barges = selectedDetail.value?.barges || []
  const key = oreTypeKey.value

  return barges.filter((b) => Number(b?.[key] || 0) > 0)
})

function fmt(val?: number | null, digits = 2): string {
  if (val == null || Number.isNaN(Number(val))) return '0'
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

const baseOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    background: 'transparent',
    zoom: {
      enabled: false
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
    fontFamily: 'Inter, sans-serif',
    events: {
      dataPointSelection: (_event: any, _chartContext: any, config: any) => {
        const idx = config?.dataPointIndex
        const sIdx = config?.seriesIndex

        if (idx == null || idx < 0 || sIdx == null) return

        const point =
          config?.w?.config?.series?.[sIdx]?.data?.[idx]

        const detail: DetailItem | undefined = point?.detail
        if (!detail) return

        selectedDetail.value = detail
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
  yaxis: {
    labels: {
      formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b'
      }
    }
  },
  stroke: {
    width: props.series.length > 0
      ? Array(props.series.length - 1).fill(0).concat(0)
      : []
  },
  markers: {
    size: props.series.length > 0
      ? Array(props.series.length - 1).fill(0).concat(3)
      : [],
    strokeColors: '#fff',
    strokeWidth: 2,
    colors: ['#f43f5e']
  },
  legend: {
    show: true,
    showForSingleSeries: true,
    customLegendItems: ['All'],
  },
  plotOptions: {
    bar: {
      columnWidth: '70%',
      endingShape: 'rounded',
      dataLabels: {
        position: 'top'
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  fill: {
    opacity: [0.67],
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    custom: function ({ seriesIndex, dataPointIndex, w }: any) {
      const point: any = w.config.series?.[seriesIndex]?.data?.[dataPointIndex]
      const detail: DetailItem = point?.detail
      if (!detail) return ''

      const actual = props.oreType === 'LIM'
        ? Number(detail.lim_actual || 0)
        : Number(detail.sap_actual || 0)

      const plan = props.oreType === 'LIM'
        ? Number(detail.lim_plan || 0)
        : Number(detail.sap_plan || 0)

      return `
        <div style="
          padding:8px 10px;
          width:190px;
          font-size:12px;
          color:${isDark.value ? '#eee' : '#222'};
        ">
          <div style="font-weight:700; margin-bottom:4px;">
            ${detail.label}
          </div>
          <div>${oreLabel.value} Actual: <strong>${fmt(actual)}</strong></div>
          <div>${oreLabel.value} Plan: <strong>${fmt(plan)}</strong></div>
          <div style="margin-top:6px; font-size:11px; opacity:.7;">
            Click for details →
          </div>
        </div>
      `
    }
  },
  responsive: [
    {
      breakpoint: 768,
      options: {
        legend: {
          position: 'top',
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

const getThemeOptions = (): ApexOptions => ({
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  colors: props.colors.length > 0
    ? props.colors
    : ['#34d399', '#f5b849'],
  grid: {
    borderColor: isDark.value ? '#334155' : '#e5e7eb',
    strokeDashArray: 2
  }
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

<style>
.dialog-scroll {
  max-height: 70vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.dialog-scroll::-webkit-scrollbar {
  width: 6px;
}

.dialog-scroll::-webkit-scrollbar-thumb {
  background: rgba(120, 120, 120, 0.5);
  border-radius: 999px;
}

.dialog-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>