<template>
  <ClientOnly>
    <div>
      <ApexChart ref="chart" height="270" type="bar" :options="mergedOptions" :series="series" />

      <Dialog v-model:open="openDetail">
        <DialogContent class="w-[95vw] max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Detail Selling - {{ selectedDetail?.label || '-' }}
            </DialogTitle>
          </DialogHeader>

          <div class="dialog-scroll space-y-2 pr-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div class="rounded-lg border p-2">
                <div class="text-muted-foreground">Saprolite</div>
                <div class="font-semibold">{{ fmt(selectedDetail?.sap_actual) }}</div>
              </div>

              <div class="rounded-lg border p-2">
                <div class="text-muted-foreground">Total Barges</div>
                <div class="font-semibold">{{ bargesNormalized.length }}</div>
              </div>
            </div>

            <div v-for="(b, i) in bargesNormalized" :key="`${b.barge_code || b.name || 'unknown'}-${i}`"
              class="rounded-lg border p-2 hover:shadow-md transition">
              <div class="font-semibold">
                {{ b.barge_code || b.name || 'Unknown' }}
              </div>

              <div class="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div v-if="b.sap !== undefined">
                  <div class="text-muted-foreground">SAP</div>
                  <div class="font-medium">{{ fmt(b.sap) }}</div>
                </div>

                <div v-if="b.total !== undefined">
                  <div class="text-muted-foreground">Total</div>
                  <div class="font-medium">{{ fmt(b.total) }}</div>
                </div>

                <div v-if="b.code_lot">
                  <div class="text-muted-foreground">Lot</div>
                  <div class="font-medium">{{ b.code_lot }}</div>
                </div>
              </div>
            </div>

            <div v-if="!bargesNormalized.length" class="text-sm italic text-muted-foreground">
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

interface Barge {
  name?: string
  barge_code?: string
  code_lot?: string
  sap?: number
  total?: number
  [key: string]: any
}

interface DetailItem {
  label: string
  sap_actual: number
  barges?: (string | Barge)[]
}

const props = defineProps({
  series: {
    type: Array as () => { name: string; data: number[]; type?: string }[],
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
  },
  details: {
    type: Array as () => DetailItem[],
    default: () => []
  }
})

const chart = ref<ApexCharts | null>(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const legendColor = computed(() => isDark.value ? '#e5e7eb' : '#1e293b')

const openDetail = ref(false)
const selectedDetail = ref<DetailItem | null>(null)

function fmt(val?: number | null, digits = 2): string {
  if (val == null || Number.isNaN(Number(val))) return '0'
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

const bargesNormalized = computed<Barge[]>(() => {
  const barges = selectedDetail.value?.barges || []

  return barges.map((b) => {
    if (typeof b === 'string') {
      return { name: b }
    }
    return b || {}
  })
})

const baseOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    stackType: 'normal',
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
        const idx = config?.dataPointIndex

        if (idx == null || idx < 0 || !props.details?.[idx]) return

        selectedDetail.value = props.details[idx]
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
    categories: props.categories
  },
  plotOptions: {
    bar: {
      dataLabels: {
        position: 'top'
      },
      columnWidth: '60%',
      borderRadius: 3,
    }
  },
  dataLabels: {
    enabled: false,
    formatter: (val: number) => `${(val / 1000).toFixed()}k`,
    offsetY: -10,
    style: {
      fontSize: '12px',
      fontWeight: 'bold',
      colors: [isDark.value ? '#e5e7eb' : '#1e293b']
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    labels: {
      colors: legendColor.value
    }
  }
}))

const getThemeOptions = (): ApexOptions => ({
  theme: {
    mode: isDark.value ? 'dark' : 'light'
  },
  colors: props.colors.length > 0
    ? props.colors
    : ['#845adf', '#23b7e5', '#f5b849', '#e6533c'],
  xaxis: {
    categories: props.categories,
    labels: {
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b'
      }
    }
  },
  yaxis: {
    tickAmount: 4,
    labels: {
      formatter: (val: number) => `${(val / 1000).toFixed()}k`,
      style: {
        colors: isDark.value ? '#e5e7eb' : '#1e293b'
      }
    }
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    custom: function ({ dataPointIndex }: { dataPointIndex: number }) {
      if (!props.details || !props.details[dataPointIndex]) return ''

      const detail = props.details[dataPointIndex]

      return `
        <div style="
          padding:8px 10px;
          width:180px;
          font-size:12px;
          color:${isDark.value ? '#eee' : '#222'};
        ">
          <div style="font-weight:700; margin-bottom:4px;">
            ${detail.label}
          </div>
          <div>SAP: <strong>${fmt(detail.sap_actual)}</strong></div>
          <div style="margin-top:6px; font-size:11px; opacity:.7;">
            Click for details →
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
  fill: {
    opacity: [0.46, 1],
  },
  stroke: {
    width: [0, 2],
    dashArray: [0, 4]
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