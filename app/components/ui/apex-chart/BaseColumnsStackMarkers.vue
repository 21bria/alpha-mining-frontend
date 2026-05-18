<template>
  <ClientOnly>
    <div>
      <ApexChart
      ref="chart"
      height="270"
      type="bar"
      :options="mergedOptions"
      :series="props.series"
    />

      <Dialog v-model:open="openDetail">
        <DialogContent class="w-[95vw] max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Detail Barging - {{ selectedDetail?.label || '-' }}
            </DialogTitle>
          </DialogHeader>

          <div class="dialog-scroll space-y-4 pr-2">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div class="rounded-lg border p-3">
                <div class="text-muted-foreground">Limonite</div>
                <div class="font-semibold">{{ fmt(selectedDetail?.lim_actual) }}</div>
              </div>
              <div class="rounded-lg border p-3">
                <div class="text-muted-foreground">Saprolite</div>
                <div class="font-semibold">{{ fmt(selectedDetail?.sap_actual) }}</div>
              </div>
              <div class="rounded-lg border p-3">
                <div class="text-muted-foreground">Total</div>
                <div class="font-semibold">{{ fmt(selectedDetail?.total_actual) }}</div>
              </div>
            </div>

            <div class="text-sm text-muted-foreground">
              Total Barges: {{ bargesSorted.length }}
            </div>

            <div v-for="(b, i) in bargesSorted" :key="`${b.barge_code || 'unknown'}-${b.code_lot || i}`"
              class="rounded-lg border p-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-semibold">{{ b.barge_code || 'Unknown' }}</div>
                  <div v-if="b.tugboat_name" class="text-xs text-muted-foreground">
                    {{ b.tugboat_name }}
                  </div>
                </div>

                <div class="text-sm font-semibold" :class="(b.variance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ fmt(b.variance) }}
                </div>
              </div>

              <div class="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div v-if="b.code_lot">
                  <div class="text-muted-foreground">Lot</div>
                  <div class="font-medium">{{ b.code_lot }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Total</div>
                  <div class="font-medium">{{ fmt(b.total) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Plan</div>
                  <div class="font-medium">{{ fmt(b.tonnage_plan) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">LIM</div>
                  <div class="font-medium">{{ fmt(b.lim) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">SAP</div>
                  <div class="font-medium">{{ fmt(b.sap) }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Ni Plan</div>
                  <div class="font-medium">{{ fmt(b.ni_plan, 2) }}</div>
                </div>
              </div>
            </div>

            <div v-if="!bargesSorted.length" class="text-sm italic text-muted-foreground">
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
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
  }
})

const chart = ref<ApexCharts | null>(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const openDetail = ref(false)


interface Barge {
  barge_code?: string
  code_lot?: string
  tugboat_name?: string
  lim?: number
  sap?: number
  total?: number
  tonnage_plan?: number
  ni_plan?: number
  variance?: number
}

interface DetailItem {
  label: string
  lim_actual: number
  sap_actual: number
  total_plan?: number
  total_actual?: number
  barges?: Barge[]
}

const selectedDetail = ref<DetailItem | null>(null)

function fmt(val?: number | null, digits = 2): string {
  if (val == null || Number.isNaN(Number(val))) return '0'
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

const bargesSorted = computed(() => {
  return [...(selectedDetail.value?.barges || [])]
    .filter((b) => (b.total ?? 0) > 0)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
})

const baseOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    background: 'transparent',
    zoom: { enabled: false },
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

        if (!point?.detail) return

        selectedDetail.value = point.detail as DetailItem
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
  // yaxis: {
  //   labels: {
  //     formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
  //     style: {
  //       colors: isDark.value ? '#e5e7eb' : '#1e293b'
  //     }
  //   }
  // },
yaxis: {
  tickAmount: 4,
  decimalsInFloat: 0,

  labels: {
    formatter: (val: number) => {
      return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 0
      }).format(val)
    },

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
    show: false,
    showForSingleSeries: false,
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
    custom: function ({ seriesIndex, dataPointIndex, w }) {
      const point: any = w.config.series?.[seriesIndex]?.data?.[dataPointIndex]
      const detail = point?.detail
      if (!detail) return ''

      const bg = isDark.value ? '#1f2937' : '#ffffff'
      const text = isDark.value ? '#f8fafc' : '#111827'
      const border = isDark.value ? '#334155' : '#e5e7eb'

      return `
      <div style="
        padding:8px 10px;
        width:180px;
        font-size:12px;
        background:${bg};
        color:${text};
        border:1px solid ${border};
        border-radius:8px;
      ">
        <div style="font-weight:700; margin-bottom:4px;">
          ${detail.label}
        </div>

        <div>LIM: <strong>${fmt(detail.lim_actual)}</strong></div>
        <div>SAP: <strong>${fmt(detail.sap_actual)}</strong></div>

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
    chart.value.updateOptions(mergedOptions.value, false, true, true)
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