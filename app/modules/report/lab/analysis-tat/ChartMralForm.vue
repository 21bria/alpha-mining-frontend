<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import FilterDup from "@/components/filters/FilterDuplicated.vue"
import PlotlyLineChart from "@/components/charts/PlotlyLineChart.vue"
import TatRoaSummaryTable from "@/components/tables/TatRoaSummaryTable.vue"
import { useTypeFilterStore } from "@/stores/filters/samples-order/count-type-filter"

const notify = useNotify()
const { request } = useApi()
const typeStore = useTypeFilterStore()

type ChartSeriesItem = {
  name: string
  type: "bar" | "line"
  data: number[]
}

type ChartResponse = {
  labels: string[]
  series: ChartSeriesItem[]
  detail: Array<{
    tgl: string
    order: number
    on_tat: number
    over_tat: number
    total_released: number
    not_released: number
    avg_hours: number
    limit_hours: number
  }>
}

type TableResponse = {
  data: Array<{
    tgl_produksi: string
    roa_order: string
    jml_roa: number
    released_on_tat: number
    released_over_tat: number
    total_released: number
    not_released: number
    average_time: string
    time_limit: string
  }>
}

type PlotFilters = {
  iup_id?: number | null
  start_date: string
  end_date: string
}

type TableRow = {
  description: string
  order: number | string
  on_tat: number | string
  over_tat: number | string
  released: number | string
  pre_released: number | string
  tat: number | string
  limit: number | string
}

type TableSection = {
  title?: string
  rows?: TableRow[]
}

const plotFilters = ref<PlotFilters | null>(null)

const chartData = ref<ChartResponse | null>(null)
const tableData = ref<TableResponse | null>(null)

const plotLoading = ref(false)
const tableLoading = ref(false)

async function fetchChartData() {
  if (!plotFilters.value?.start_date || !plotFilters.value?.end_date) {
    chartData.value = null
    return
  }

  plotLoading.value = true

  try {
    const res = await request<ChartResponse>("/api/analytics/raw/geology/chart-tat/mral", {
      method: "GET",
      query: {
        iup_id: plotFilters.value.iup_id ?? undefined,
        startDate: plotFilters.value.start_date,
        endDate: plotFilters.value.end_date,
      },
    })

    chartData.value = res
  } catch (err: any) {
    chartData.value = null
    notify.error(err?.message || "Failed to load TAT MRAL chart")
  } finally {
    plotLoading.value = false
  }
}

async function fetchTableData() {
  if (!plotFilters.value?.start_date || !plotFilters.value?.end_date) {
    tableData.value = null
    return
  }

  tableLoading.value = true

  try {
    const res = await request<TableResponse>("/api/analytics/raw/geology/data-tat/mral", {
      method: "GET",
      query: {
        iup_id: plotFilters.value.iup_id ?? undefined,
        startDate: plotFilters.value.start_date,
        endDate: plotFilters.value.end_date,
      },
    })

    tableData.value = res
  } catch (err: any) {
    tableData.value = null
    notify.error(err?.message || "Failed to load TAT MRAL table")
  } finally {
    tableLoading.value = false
  }
}

async function fetchAll() {
  await Promise.all([fetchChartData(), fetchTableData()])
}

function applyStoreFilters() {
  if (!typeStore.start_date || !typeStore.end_date) {
    plotFilters.value = null
    chartData.value = null
    tableData.value = null
    return
  }

  plotFilters.value = {
    iup_id: typeStore.iup_id ?? null,
    start_date: typeStore.start_date,
    end_date: typeStore.end_date,
  }

  fetchAll()
}

function handleApply(payload: {
  iup_id?: number | null
  start_date: string
  end_date: string
}) {
  typeStore.setFilters({
    iup_id: payload.iup_id ?? null,
    start_date: payload.start_date,
    end_date: payload.end_date,
  })

  plotFilters.value = {
    iup_id: payload.iup_id ?? null,
    start_date: payload.start_date,
    end_date: payload.end_date,
  }

  fetchAll()
}

function getSeriesColor(name: string) {
  const map: Record<string, string> = {
    Samples: "#2b7fff",
    "TAT MRAL": "#fb2c37",
    "TAT Limit": "#f1b100",
  }
  return map[name] || "#94a3b8"
}

const roaTraces = computed(() => {
  if (!chartData.value?.series?.length) return []

  return chartData.value.series.map((item) => {
    const isBar = item.type === "bar"
    const isLimit = item.name === "TAT Limit"

    return {
      x: chartData.value?.labels ?? [],
      y: item.data ?? [],
      type: item.type,
      name: item.name,

      text: isLimit
        ? (item.data ?? []).map((v) => String(v))
        : item.data ?? [],

      texttemplate: isBar ? "%{text:.0f}" : "%{text}",
      textposition: isLimit ? "top center" : isBar ? "outside" : "top center",

      cliponaxis: false,

      marker: {
        color: getSeriesColor(item.name),
        opacity: isBar ? 0.85 : 1,
        size: isBar ? undefined : 8,
      },

      line: isBar
        ? undefined
        : {
            width: isLimit ? 2.5 : 3,
            color: getSeriesColor(item.name),
            dash: isLimit ? "dash" : "solid",
          },

      mode: isBar ? "text+markers" : "lines+markers+text",

      hovertemplate: `${item.name}: %{y}<extra></extra>`,
      yaxis: item.name === "Samples" ? "y" : "y2",
    }
  })
})

const roaLayout = computed(() => {
  const title =
    plotFilters.value?.start_date && plotFilters.value?.end_date
      ? `TAT MRAL (${plotFilters.value.start_date} to ${plotFilters.value.end_date})`
      : "TAT MRAL"

  return {
    title: {
      text: title,
      x: 0.5,
      xanchor: "center",
      font: { size: 16 },
    },

    height: 370,
    margin: { l: 60, r: 70, t: 100, b: 50 },

    legend: {
      orientation: "h",
      x: 1,
      xanchor: "right",
      y: 1.10,
      yanchor: "bottom",
      font: { size: 11 },
    },

    hovermode: "x unified",
    bargap: 0.25,

    xaxis: {
      showgrid: true,
      gridcolor: "rgba(0,0,0,0.05)",
      zeroline: false,
    },

    yaxis: {
      title: "Samples Order",
      showgrid: false,
      rangemode: "tozero",
      zeroline: false,
    },

    yaxis2: {
      title: "Hours",
      overlaying: "y",
      side: "right",
      showgrid: false,
      rangemode: "tozero",
      zeroline: false,
      range: [0, 130],
    },

    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
  }
})

const summaryTableSection = computed<TableSection>(() => {
  const rows = tableData.value?.data ?? []

  if (!rows.length) {
    return {
      title: "TAT MRAL Summary Table",
      rows: [],
    }
  }

  return {
    title: "TAT MRAL Summary Table",
    rows: rows.map((row) => ({
      description: String(row.tgl_produksi).slice(0, 10),
      order: row.jml_roa ?? 0,
      on_tat: row.released_on_tat ?? 0,
      over_tat: row.released_over_tat ?? 0,
      released: row.total_released ?? 0,
      pre_released: row.not_released ?? 0,
      tat: row.average_time ?? "00:00:00",
      limit: row.time_limit ?? "120:00:00",
    })),
  }
})

onMounted(() => {
  applyStoreFilters()
})

watch(
  () => [typeStore.iup_id, typeStore.start_date, typeStore.end_date],
  () => {
    applyStoreFilters()
  }
)
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex items-center space-x-2">
      <FilterDup @apply="handleApply" />
    </div>

    <div v-if="plotLoading || tableLoading" class="rounded-xl border p-6 text-sm text-muted-foreground">
      Loading TAT MRAL data...
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">TAT MRAL Summary</h3>
          <p class="text-xs text-muted-foreground">
            Samples, TAT MRAL and limit by selected date range
          </p>
        </div>

        <PlotlyLineChart :traces="roaTraces" :layout="roaLayout" :height="360" />
      </div>

      <div class="mt-2">
        <TatRoaSummaryTable title="TAT MRAL Summary Table" :section="summaryTableSection" :loading="tableLoading" />
      </div>
    </div>
  </div>
</template>