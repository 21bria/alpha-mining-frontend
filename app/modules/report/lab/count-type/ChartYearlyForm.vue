<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue"
import { useTypeFilterStore } from "@/stores/filters/samples-order/count-type-filter"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import FilterDup from "@/components/filters/FilterDuplicated.vue"
import PlotlyLineChart from "@/components/charts/PlotlyLineChart.vue"

const typeStore = useTypeFilterStore()
const { request } = useApi()
const notify = useNotify()

type PeriodSummary = {
  title: string
  categories: string[]
  values: number[]
}

type PlotResponse = {
  year: PeriodSummary
  month: PeriodSummary
  range: PeriodSummary
  week: PeriodSummary
}

type ReleaseYearResponse = {
  title: string
  categories: string[]
  order: number[]
  released: number[]
  unreleased: number[]
}

type PlotFilters = {
  iup_id?: number | null
  start_date: string
  end_date: string
}

const plotFilters = ref<PlotFilters | null>(null)
const plotData = ref<PlotResponse | null>(null)
const plotDataYear = ref<ReleaseYearResponse | null>(null)
const plotLoading = ref(false)
const plotLoadingYear = ref(false)

function emptySummary(title = "No Data"): PeriodSummary {
  return {
    title,
    categories: ["SAS", "LIS", "QA", "GC"],
    values: [0, 0, 0, 0],
  }
}

function emptyReleaseYear(title = "No Data"): ReleaseYearResponse {
  return {
    title,
    categories: [
      "Sas-roa", "Sas-mral",
      "Lis-roa", "Lis-mral",
      "QA-roa", "QA-mral",
      "Gc-roa", "Gc-mral",
    ],
    order: [0, 0, 0, 0, 0, 0, 0, 0],
    released: [0, 0, 0, 0, 0, 0, 0, 0],
    unreleased: [0, 0, 0, 0, 0, 0, 0, 0],
  }
}

async function fetchPlotData() {
  if (!plotFilters.value?.start_date || !plotFilters.value?.end_date) {
    plotData.value = null
    plotDataYear.value = null
    return
  }

  plotLoading.value = true
  plotLoadingYear.value = true

  try {
    const [chartRes, chartResYear] = await Promise.all([
      request<PlotResponse>(
        "/api/analytics/raw/geology/lab-count-type",
        {
          method: "GET",
          query: {
            iup_id: plotFilters.value.iup_id ?? undefined,
            start_date: plotFilters.value.start_date,
            end_date: plotFilters.value.end_date,
          },
        }
      ),
      request<ReleaseYearResponse>(
        "/api/analytics/raw/geology/lab-count-type/section",
        {
          method: "GET",
          query: {
            iup_id: plotFilters.value.iup_id ?? undefined,
            start_date: plotFilters.value.start_date,
            end_date: plotFilters.value.end_date,
          },
        }
      ),
    ])

    plotData.value = chartRes
    plotDataYear.value = chartResYear
  } catch (err: any) {
    plotData.value = null
    plotDataYear.value = null
    notify.error(err?.message || "Failed to load data")
  } finally {
    plotLoading.value = false
    plotLoadingYear.value = false
  }
}

function applyStoreFilters() {
  if (!typeStore.start_date || !typeStore.end_date) {
    plotFilters.value = null
    plotData.value = null
    plotDataYear.value = null
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

function getBarColors(values: number[]) {
  const palette = [
    "#ff8906", // orange
    "#2b7fff", // blue
    "#f1b100", // yellow
    "#fb2c37", // red
    "#6466f1", // purple
    "#009689", // teal
    "#12b981", // green
  ]

  return values.map((_, i) => palette[i % palette.length])
}

function buildSampleTypeTraces(section?: PeriodSummary | null) {
  const data = section ?? emptySummary()

  const colors = getBarColors(data.values ?? [])

  return [
    {
      type: "bar",
      x: data.values,
      y: data.categories,
      orientation: "h",
      text: data.values,
      texttemplate: "%{text:.0f}",
      marker: {
          color: colors,
          opacity: 0.9 // 
        },
      hovertemplate: "%{y}: %{x}<extra></extra>",
      showlegend: false,
    },
  ]
}

function buildSampleTypeLayout(section?: PeriodSummary | null) {
  const data = section ?? emptySummary()
  const maxVal = Math.max(...(data.values ?? [0]), 0)

  return {
    title: {
      text: data.title,
      x: 0.5,
      xanchor: "center",
      font: { size: 18 },
    },
    height: 340,
    margin: { l: 70, r: 40, t: 80, b: 40 },
    bargap: 0.2,
    showlegend: false,
    hovermode: "y unified",
    xaxis: {
      title: "Samples",
      showgrid: true,
      gridcolor: "rgba(0,0,0,0.07)",
      zeroline: false,
      rangemode: "tozero",
      range: [0, maxVal * 1.15 || 1],
    },
    yaxis: {
      type: "category",
      showgrid: false,
      zeroline: false,
    },
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
  }
}

function buildReleaseYearTraces(section?: any) {
  const data = section ?? emptyReleaseYear()

  return [
    {
      type: "bar",
      name: "PreReleased", // kiri (paling bawah stack)
      x: data.unreleased,
      y: data.categories,
      orientation: "h",
      text: data.unreleased,
      texttemplate: "%{text:.0f}",
      marker: { color: "#fb2c37",opacity: 0.9}, // cream
    },
    {
      type: "bar",
      name: "Released",
      x: data.released,
      y: data.categories,
      orientation: "h",
      text: data.released,
      texttemplate: "%{text:.0f}",
      marker: { color: "#12b981", opacity: 0.9}, // 
    },
    {
      type: "bar",
      name: "Orders",
      x: data.order,
      y: data.categories,
      orientation: "h",
      text: data.order,
      texttemplate: "%{text:.0f}",
      marker: { color: "#f1b100",opacity: 0.9}, 
    },
  ]
}
function buildReleaseYearLayout(section?: any) {
  const data = section ?? emptyReleaseYear()

  return {

    barmode: "stack",
    height: 420,
    title: {
      text: data.title,
      x: 0.5,
      xanchor: "center",
      y: 0.95,
    },

  legend: {
    orientation: "h",
    x: 1,
    xanchor: "right",
    y: 1.2,
    yanchor: "bottom",
    font: { size: 11 }
  },

  margin: { l: 90, r: 20, t: 120, b: 40 },
    hovermode: "y unified",

    xaxis: {
      title: "Samples",
      showgrid: true,
      gridcolor: "rgba(0,0,0,0.07)",
      zeroline: false,
      rangemode: "tozero",
    },

    yaxis: {
      type: "category",
      autorange: "reversed",
      showgrid: false,
      zeroline: false,
    },

    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
  }
}

const yearSection = computed(() => plotData.value?.year ?? emptySummary("Sample Type - Year"))
const monthSection = computed(() => plotData.value?.month ?? emptySummary("Sample Type - Month"))
const rangeSection = computed(() => plotData.value?.range ?? emptySummary("Sample Type - Range"))
const weekSection = computed(() => plotData.value?.week ?? emptySummary("Sample Type - Week"))
const yearReleasedSection = computed(() => plotDataYear.value ?? emptyReleaseYear("Release Status - Year"))

const yearTraces = computed(() => buildSampleTypeTraces(yearSection.value))
const monthTraces = computed(() => buildSampleTypeTraces(monthSection.value))
const rangeTraces = computed(() => buildSampleTypeTraces(rangeSection.value))
const weekTraces = computed(() => buildSampleTypeTraces(weekSection.value))
const yearReleasedTraces = computed(() => buildReleaseYearTraces(yearReleasedSection.value))

const yearLayout = computed(() => buildSampleTypeLayout(yearSection.value))
const monthLayout = computed(() => buildSampleTypeLayout(monthSection.value))
const rangeLayout = computed(() => buildSampleTypeLayout(rangeSection.value))
const weekLayout = computed(() => buildSampleTypeLayout(weekSection.value))
const yearReleasedLayout = computed(() => buildReleaseYearLayout(yearReleasedSection.value))

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

    <div v-if="plotLoading || plotLoadingYear" class="rounded-xl border p-6 text-sm text-muted-foreground">
      Loading charts...
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <!-- YEAR -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">Year Summary</h3>
          <p class="text-xs text-muted-foreground">
            Uses the year from end date
          </p>
        </div>

        <PlotlyLineChart
          :traces="yearTraces"
          :layout="yearLayout"
          :height="320"
        />
      </div>

      <!-- YEAR RELEASED -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">Year by (Mral & Roa)</h3>
          <p class="text-xs text-muted-foreground">
            Release status summary for the year from end date
          </p>
        </div>

        <PlotlyLineChart
          :traces="yearReleasedTraces"
          :layout="yearReleasedLayout"
          :height="420"
        />
      </div>

      <!-- MONTH -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">Month Summary</h3>
          <p class="text-xs text-muted-foreground">
            Uses the month from end date
          </p>
        </div>

        <PlotlyLineChart
          :traces="monthTraces"
          :layout="monthLayout"
          :height="320"
        />
      </div>

      <!-- RANGE -->
      <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">Range Summary</h3>
          <p class="text-xs text-muted-foreground">
            Uses selected start date and end date
          </p>
        </div>

        <PlotlyLineChart
          :traces="rangeTraces"
          :layout="rangeLayout"
          :height="320"
        />
      </div>
      <!-- Week -->
      <!-- <div class="rounded-xl border p-3 space-y-3">
        <div>
          <h3 class="text-base font-semibold">Week Summary</h3>
          <p class="text-xs text-muted-foreground">
            Uses selected start date and end date
          </p>
        </div>

        <PlotlyLineChart
          :traces="weekTraces"
          :layout="weekLayout"
          :height="320"
        />
      </div> -->
    </div>
  </div>
</template>