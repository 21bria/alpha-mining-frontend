<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue"
import { useTypeFilterStore } from "@/stores/filters/samples-order/count-type-filter"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import FilterDup from "@/components/filters/FilterDuplicated.vue"
import PlotlyLineChart from "@/components/charts/PlotlyLineChart.vue"
import WetSummaryTable from "@/components/tables/WetSummaryTable.vue"

const typeStore = useTypeFilterStore()
const { request } = useApi()
const notify = useNotify()

type ChartSection = {
  title: string
  labels: string[]
  series: Record<string, number[]>
}

type ChartResponse = {
  gc: ChartSection
  qa: ChartSection
  sale: ChartSection
}

type PlotFilters = {
  iup_id?: number | null
  start_date: string
  end_date: string
}

const plotFilters = ref<PlotFilters | null>(null)
const chartData = ref<ChartResponse | null>(null)
const plotLoading = ref(false)

function emptySection(title: string, seriesKeys: string[]): ChartSection {
  const series: Record<string, number[]> = {}
  for (const key of seriesKeys) {
    series[key] = []
  }

  return {
    title,
    labels: [],
    series,
  }
}

function getBarColors(keys: string[]) {
  const colorMap: Record<string, string> = {
    spc: "#ff8906",
    cks: "#2b7fff",

    pds: "#12b981",
    qaqc: "#f1b100",
    spc_qa: "#fb2c37",

    sas: "#6466f1",
    lis: "#009689",
  }

  return keys.map((key) => colorMap[key] || "#94a3b8")
}

async function fetchPlotData() {
  if (!plotFilters.value?.start_date || !plotFilters.value?.end_date) {
    chartData.value = null
    return
  }

  plotLoading.value = true

  try {
    const res = await request<ChartResponse>(
      "/api/analytics/raw/geology/lab-count-section/range",
      {
        method: "GET",
        query: {
          iup_id: plotFilters.value.iup_id ?? undefined,
          start_date: plotFilters.value.start_date,
          end_date: plotFilters.value.end_date,
        },
      }
    )

    chartData.value = res
  } catch (err: any) {
    chartData.value = null
    notify.error(err?.message || "Failed to load charts")
  } finally {
    plotLoading.value = false
  }
}

function applyStoreFilters() {
  if (!typeStore.start_date || !typeStore.end_date) {
    plotFilters.value = null
    chartData.value = null
    return
  }

  plotFilters.value = {
    iup_id: typeStore.iup_id ?? null,
    start_date: typeStore.start_date,
    end_date: typeStore.end_date,
  }

  fetchPlotData()
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

  fetchPlotData()
}

function buildStackedTraces(
  section: ChartSection | null | undefined,
  keys: string[],
  labels: string[]
) {
  if (!section) return []

  const colors = getBarColors(keys)

  return keys.map((key, i) => ({
    type: "bar",
    x: section.labels,
    y: section.series[key] ?? [],
    name: labels[i],
    text: section.series[key] ?? [],
    texttemplate: "%{text:.0f}",
    marker: {
      color: colors[i],
      opacity: 0.8,
    },
    hovertemplate: `${labels[i]}: %{y}<extra></extra>`,
  }))
}

function buildStackedLayout(title: string) {
  return {
    title: {
      text: title,
      x: 0.5,
      xanchor: "center",
      font: { size: 16 },
    },
    barmode: "stack",
    height: 320,
    margin: { l: 60, r: 20, t: 90, b: 40 },
    legend: {
      orientation: "h",
      x: 1,
      xanchor: "right",
      y: 1.15,
      yanchor: "top",
      font: { size: 11 },
    },
    hovermode: "x unified",
    xaxis: {
      showgrid: true,
      gridcolor: "rgba(0,0,0,0.05)",
      zeroline: false,
    },
    yaxis: {
      showgrid: false,
      rangemode: "tozero",
    },
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
  }
}

const gcSection = computed(() =>
  chartData.value?.gc ?? emptySection("Data GC", ["spc", "cks"])
)

const qaSection = computed(() =>
  chartData.value?.qa ?? emptySection("Data QAQC", ["pds", "qaqc", "spc_qa"])
)

const saleSection = computed(() =>
  chartData.value?.sale ?? emptySection("Data Sale", ["sas", "lis"])
)

const gcTraces = computed(() =>
  buildStackedTraces(gcSection.value, ["spc", "cks"], ["SPC", "CKS"])
)

const qaTraces = computed(() =>
  buildStackedTraces(
    qaSection.value,
    ["pds", "qaqc", "spc_qa"],
    ["Production", "QAQC", "Special Check"]
  )
)

const saleTraces = computed(() =>
  buildStackedTraces(saleSection.value, ["sas", "lis"], ["SAS", "LIS"])
)

const gcLayout = computed(() => buildStackedLayout(gcSection.value.title))
const qaLayout = computed(() => buildStackedLayout(qaSection.value.title))
const saleLayout = computed(() => buildStackedLayout(saleSection.value.title))

const summaryTableSection = computed(() => {
  const gc = chartData.value?.gc
  const qa = chartData.value?.qa
  const sale = chartData.value?.sale

  const labels = gc?.labels ?? qa?.labels ?? sale?.labels ?? []

  if (!labels.length) {
    return {
      title: "Lab Summary Table",
      rows: [],
    }
  }

  return {
    title: "Lab Summary Table",
    rows: labels.map((label, i) => ({
      description: String(label).slice(0, 10),
      cks: gc?.series?.cks?.[i] ?? 0,
      spc: gc?.series?.spc?.[i] ?? 0,
      pds: qa?.series?.pds?.[i] ?? 0,
      qaqc: qa?.series?.qaqc?.[i] ?? 0,
      spc_qa: qa?.series?.spc_qa?.[i] ?? 0,
      lis: sale?.series?.lis?.[i] ?? 0,
      sas: sale?.series?.sas?.[i] ?? 0,
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

    <div
      v-if="plotLoading"
      class="rounded-xl border p-6 text-sm text-muted-foreground"
    >
      Loading charts...
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <!-- GC -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">GC Summary</h3>
          <p class="text-xs text-muted-foreground">
            SPC and CKS samples by selected date range
          </p>
        </div>

        <PlotlyLineChart
          :traces="gcTraces"
          :layout="gcLayout"
          :height="320"
        />
      </div>

      <!-- QA -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">QAQC Summary</h3>
          <p class="text-xs text-muted-foreground">
            PDS, QAQC, and Special Check by selected date range
          </p>
        </div>

        <PlotlyLineChart
          :traces="qaTraces"
          :layout="qaLayout"
          :height="320"
        />
      </div>

      <!-- SALE -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">Sale Summary</h3>
          <p class="text-xs text-muted-foreground">
            SAS and LIS by selected date range
          </p>
        </div>

        <PlotlyLineChart
          :traces="saleTraces"
          :layout="saleLayout"
          :height="320"
        />
      </div>

      <!-- Table -->
      <div class="mt-2">
        <WetSummaryTable
          title="Sample Order Summary Table"
          :section="summaryTableSection"
          :loading="plotLoading"
        />
      </div>

    </div>
  </div>
</template>