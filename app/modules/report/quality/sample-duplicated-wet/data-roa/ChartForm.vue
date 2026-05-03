<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue"
import { useDupFilterStore } from "@/stores/filters/duplicated-filter"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import FilterDup from "@/components/filters/FilterDuplicated.vue"
import PlotlyLineChart from "@/components/charts/PlotlyLineChart.vue"
import WetDuplicateSummaryTable from "@/components/tables/WetDuplicateSummaryTable.vue"

const dupStore = useDupFilterStore()
const { request } = useApi()
const notify = useNotify()

// Dummy
const dummySummary = {
  title: "Duplicate Summary - Dummy",
  categories: ["Ni", "Co", "Fe", "MgO","SiO2"],
  acceptable: [80, 70, 90, 60, 85],
  error: [20, 30, 10, 40, 15],
}


type PeriodSummary = {
  title: string
  categories: string[]
  acceptable: number[]
  error: number[]
}

type PlotResponse = {
  year: PeriodSummary
  month: PeriodSummary
  range: PeriodSummary
}

type PlotFilters = {
  iup_id?: number | null
  start_date: string
  end_date: string
}

const plotFilters = ref<PlotFilters | null>(null)
const plotData = ref<PlotResponse | null>(null)
const plotLoading = ref(false)

function emptySummary(title = "No Data"): PeriodSummary {
  return {
    title,
    categories: ["Ni", "Co", "Fe", "MgO", "SiO2"],
    acceptable: [0, 0, 0, 0, 0],
    error: [0, 0, 0, 0, 0],
  }
}
const rawTableData = ref<any>(null)
const rawTableLoading = ref(false)
async function fetchPlotData() {
  if (!plotFilters.value?.start_date || !plotFilters.value?.end_date) {
    plotData.value = null
    rawTableData.value = null
    return
  }

  plotLoading.value = true
  rawTableLoading.value = true

  try {
    const [chartRes, tableRes] = await Promise.all([
      request<PlotResponse>(
        "/api/analytics/raw/geology/sample-duplicated-roa/wet",
        {
          method: "GET",
          query: {
            iup_id: plotFilters.value.iup_id ?? undefined,
            start_date: plotFilters.value.start_date,
            end_date: plotFilters.value.end_date,
          },
        }
      ),
      request(
        "/api/analytics/raw/geology/sample-duplicated-roa/wet/raw",
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
    rawTableData.value = tableRes

  } catch (err: any) {
    plotData.value = null
    rawTableData.value = null
    notify.error(err?.message || "Failed to load data")
  } finally {
    plotLoading.value = false
    rawTableLoading.value = false
  }
}

function applyStoreFilters() {
  if (!dupStore.start_date || !dupStore.end_date) {
    plotFilters.value = null
    plotData.value = null
    return
  }

  plotFilters.value = {
    iup_id: dupStore.iup_id ?? null,
    start_date: dupStore.start_date,
    end_date: dupStore.end_date,
  }

  fetchPlotData()
}

function handleApply(payload: {
  iup_id?: number | null
  start_date: string
  end_date: string
}) {
  dupStore.setFilters({
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

function getTotal(summary?: PeriodSummary | null) {
  if (!summary) return 0
  const acc = (summary.acceptable ?? []).reduce((a, b) => a + Number(b || 0), 0)
  const err = (summary.error ?? []).reduce((a, b) => a + Number(b || 0), 0)
  return acc + err
}

function getAcceptablePercent(summary?: PeriodSummary | null) {
  const total = getTotal(summary)
  if (!summary || total === 0) return 0
  const acc = (summary.acceptable ?? []).reduce((a, b) => a + Number(b || 0), 0)
  return Math.round((acc / total) * 100)
}

function buildBarTraces(summary?: PeriodSummary | null) {
  const data = summary ?? emptySummary()

  return [
    {
      type: "bar",
      name: "Acceptable Sample",
      x: data.acceptable,
      y: data.categories,
      orientation: "h",
    },
    {
      type: "bar",
      name: "Error Sample",
      x: data.error,
      y: data.categories,
      orientation: "h",
    },
  ]
}

function buildBarAnnotations(summary?: PeriodSummary | null) {
  const data = summary ?? emptySummary()
  const annotations: any[] = []

  for (let i = 0; i < data.categories.length; i++) {
    const category = data.categories[i]
    const acceptable = Number(data.acceptable[i] ?? 0)
    const error = Number(data.error[i] ?? 0)
    const total = acceptable + error

    const acceptablePercent = total > 0 ? (acceptable / total) * 100 : 0
    const errorPercent = total > 0 ? (error / total) * 100 : 0

    if (acceptable > 0) {
      annotations.push({
        xref: "x",
        yref: "y",
        x: acceptable / 2,
        y: category,
        text: `${acceptablePercent.toFixed(0)}%`,
        font: {
          family: "Arial",
          size: 12,
          color: "rgb(248, 248, 255)",
        },
        showarrow: false,
      })
    }

    if (error > 0) {
      annotations.push({
        xref: "x",
        yref: "y",
        x: acceptable + error / 2,
        y: category,
        text: `${errorPercent.toFixed(0)}%`,
        font: {
          family: "Arial",
          size: 12,
          color: "rgb(248, 248, 255)",
        },
        showarrow: false,
      })
    }
  }

  return annotations
}

function buildBarLayout(summary?: PeriodSummary | null) {
  const data = summary ?? emptySummary()

  return {
    title: {
      text: data.title,
      x: 0.5,
      xanchor: "center",
      y: 0.98,
      yanchor: "top",
      font: { size: 16 },
    },
    barmode: "stack",
    height: 320,
    margin: { l: 60, r: 20, t: 80, b: 40 },
    legend: {
      orientation: "h",
      x: 0.5,
      xanchor: "center",
      y: 1.08,
      yanchor: "bottom",
    },
    hovermode: "y unified",
    annotations: buildBarAnnotations(data),
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
  }
}
const yearSection = computed(() => plotData.value?.year ?? emptySummary("Duplicate Wet - Year"))
const monthSection = computed(() => plotData.value?.month ?? emptySummary("Duplicate Wet - Month"))
const rangeSection = computed(() => plotData.value?.range ?? emptySummary("Duplicate Wet - Range"))

const yearTraces = computed(() => buildBarTraces(yearSection.value))
const monthTraces = computed(() => buildBarTraces(monthSection.value))
const rangeTraces = computed(() => buildBarTraces(rangeSection.value))

const yearLayout = computed(() => buildBarLayout(yearSection.value))
const monthLayout = computed(() => buildBarLayout(monthSection.value))
const rangeLayout = computed(() => buildBarLayout(rangeSection.value))

onMounted(() => {
  applyStoreFilters()
})

watch(
  () => [dupStore.iup_id, dupStore.start_date, dupStore.end_date],
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

    <div v-if="plotLoading" class="rounded-xl border p-6 text-sm text-muted-foreground">
      Loading wet duplicate charts...
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- YEAR -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Year Summary</h3>
            <p class="text-xs text-muted-foreground">
              Uses the year from end date
            </p>
          </div>

          <div class="min-w-[150px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ getTotal(yearSection) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Acceptable</span>
              <span class="font-semibold text-green-600">
                {{ getAcceptablePercent(yearSection) }}%
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Period</span>
              <span class="font-semibold">
                Year
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
         :traces="yearTraces" 
         :layout="yearLayout" 
         :height="320" />
         <!-- <PlotlyLineChart
          :traces="buildBarTraces(dummySummary)"
          :layout="buildBarLayout(dummySummary)"
        /> -->
      </div>

      <!-- MONTH -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Month Summary</h3>
            <p class="text-xs text-muted-foreground">
              Uses the month from end date
            </p>
          </div>

          <div class="min-w-[150px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ getTotal(monthSection) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Acceptable</span>
              <span class="font-semibold text-green-600">
                {{ getAcceptablePercent(monthSection) }}%
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Period</span>
              <span class="font-semibold">
                Month
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
        :traces="monthTraces" 
        :layout="monthLayout" 
        :height="320" 
        />
        <!-- <PlotlyLineChart
          :traces="buildBarTraces(dummySummary)"
          :layout="buildBarLayout(dummySummary)"
        /> -->
      </div>

      <!-- RANGE -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Range Summary</h3>
            <p class="text-xs text-muted-foreground">
              Uses selected start date and end date
            </p>
          </div>

          <div class="min-w-[150px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ getTotal(rangeSection) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Acceptable</span>
              <span class="font-semibold text-green-600">
                {{ getAcceptablePercent(rangeSection) }}%
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Period</span>
              <span class="font-semibold">
                Range
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
        :traces="rangeTraces" 
        :layout="rangeLayout" 
        :height="320" 
        />
        <!-- <PlotlyLineChart
          :traces="buildBarTraces(dummySummary)"
          :layout="buildBarLayout(dummySummary)"
        /> -->
      </div>
    </div>

    <!-- table 3 -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <WetDuplicateSummaryTable
        title="Table Wet duplicated by Year"
        :section="rawTableData?.year"
        :loading="rawTableLoading"
      />

      <WetDuplicateSummaryTable
        title="Table Wet duplicated by Month"
        :section="rawTableData?.month"
        :loading="rawTableLoading"
      />

      <WetDuplicateSummaryTable
        title="Table Wet duplicated by Range"
        :section="rawTableData?.range"
        :loading="rawTableLoading"
      />
    </div>
  </div>
</template>