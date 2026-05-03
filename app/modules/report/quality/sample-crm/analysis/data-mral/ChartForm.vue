<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue"
import { useCrmFilterStore } from "@/stores/filters/crm-filter"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import FilterCrm from "@/components/filters/FilterCrm.vue"
import PlotlyLineChart from "@/components/charts/PlotlyLineChart.vue"

const crmStore = useCrmFilterStore()
const { request } = useApi()
const notify = useNotify()

type PlotSeries = {
  x: string[]
  crm: number[]
  roa: number[]
  plus_10: number[]
  plus_5: number[]
  min_5: number[]
  min_10: number[]
}

type PlotSummary = {
  jml_row: number
  acceptedNi: number
  errorNi: number
  acceptedFe: number
  errorFe: number
  acceptedMgo: number
  errorMgo: number
  acceptedSio2: number
  errorSio2: number
}

type PlotResponse = {
  summary: PlotSummary
  ni: PlotSeries
  fe: PlotSeries
  mgo: PlotSeries
  sio2: PlotSeries
  rows?: any[]
}

const plotFilters = ref<{
  iup_id?: number | null
  filterTypeCrm: string | null
  start_date: string
  end_date: string
} | null>(null)

const plotData = ref<PlotResponse | null>(null)
const plotLoading = ref(false)

async function fetchPlotData() {
  if (!plotFilters.value?.filterTypeCrm) {
    plotData.value = null
    return
  }

  plotLoading.value = true
  try {
    const res = await request<PlotResponse>(
      "/api/analytics/raw/geology/sample-crm-mral/plot-data",
      {
        method: "GET",
        query: {
          iup_id: plotFilters.value.iup_id ?? undefined,
          filterTypeCrm: plotFilters.value.filterTypeCrm,
          start_date: plotFilters.value.start_date,
          end_date: plotFilters.value.end_date,
        },
      }
    )
    plotData.value = res
  } catch (err: any) {
    notify.error(err?.message || "Failed to load plot data")
  } finally {
    plotLoading.value = false
  }
}

function applyStoreFilters() {
  if (!crmStore.crm_type) {
    plotFilters.value = null
    plotData.value = null
    return
  }

  plotFilters.value = {
    iup_id: crmStore.iup_id,
    filterTypeCrm: crmStore.crm_type,
    start_date: crmStore.start_date,
    end_date: crmStore.end_date,
  }

  fetchPlotData()
}

function handleApply(payload: {
  iup_id?: number | null
  filterTypeCrm: string | null
  start_date: string
  end_date: string
}) {
  crmStore.setFilters({
    iup_id: payload.iup_id ?? null,
    crm_type: payload.filterTypeCrm,
    start_date: payload.start_date,
    end_date: payload.end_date,
  })

  plotFilters.value = {
    iup_id: payload.iup_id ?? null,
    filterTypeCrm: payload.filterTypeCrm,
    start_date: payload.start_date,
    end_date: payload.end_date,
  }

  fetchPlotData()
}

onMounted(() => {
  applyStoreFilters()
})

watch(
  () => [
    crmStore.iup_id,
    crmStore.crm_type,
    crmStore.start_date,
    crmStore.end_date,
  ],
  () => {
    applyStoreFilters()
  }
)

const niTraces = computed(() => {
  const d = plotData.value?.ni
  if (!d) return []

  return [
    { x: d.x, y: d.roa, name: "ROA", type: "scatter", mode: "lines+markers" },
    { x: d.x, y: d.crm, name: "CRM", type: "scatter", mode: "lines" },
    { x: d.x, y: d.plus_10, name: "+10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.plus_5, name: "+5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_5, name: "-5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_10, name: "-10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
  ]
})

const feTraces = computed(() => {
  const d = plotData.value?.fe
  if (!d) return []

  return [
    { x: d.x, y: d.roa, name: "ROA", type: "scatter", mode: "lines+markers" },
    { x: d.x, y: d.crm, name: "CRM", type: "scatter", mode: "lines" },
    { x: d.x, y: d.plus_10, name: "+10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.plus_5, name: "+5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_5, name: "-5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_10, name: "-10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
  ]
})

const mgoTraces = computed(() => {
  const d = plotData.value?.mgo
  if (!d) return []

  return [
    { x: d.x, y: d.roa, name: "ROA", type: "scatter", mode: "lines+markers" },
    { x: d.x, y: d.crm, name: "CRM", type: "scatter", mode: "lines" },
    { x: d.x, y: d.plus_10, name: "+10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.plus_5, name: "+5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_5, name: "-5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_10, name: "-10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
  ]
})

const sio2Traces = computed(() => {
  const d = plotData.value?.sio2
  if (!d) return []

  return [
    { x: d.x, y: d.roa, name: "ROA", type: "scatter", mode: "lines+markers" },
    { x: d.x, y: d.crm, name: "CRM", type: "scatter", mode: "lines" },
    { x: d.x, y: d.plus_10, name: "+10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.plus_5, name: "+5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_5, name: "-5%", type: "scatter", mode: "lines", line: { dash: "dot" } },
    { x: d.x, y: d.min_10, name: "-10%", type: "scatter", mode: "lines", line: { dash: "dot" } },
  ]
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex items-center space-x-2">
      <FilterCrm @apply="handleApply" />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <!-- NI -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">MRAL -  Ni Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between CRM and MRAL for Ni
            </p>
          </div>

          <div v-if="plotData?.summary" class="min-w-[130px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Accepted</span>
              <span class="font-semibold text-green-600">
                {{ plotData.summary.acceptedNi }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Error</span>
              <span class="font-semibold text-red-600">
                {{ plotData.summary.errorNi }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ plotData.summary.acceptedNi + plotData.summary.errorNi }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
        :traces="niTraces"
        :layout="{
          xaxis: { showticklabels: false, showgrid: false },
          yaxis: { showgrid: false }
        }"
        :height="320" />
      </div>

      <!-- FE -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">MRAL -  Fe Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between CRM and MRAL for Fe
            </p>
          </div>

          <div v-if="plotData?.summary" class="min-w-[130px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Accepted</span>
              <span class="font-semibold text-green-600">
                {{ plotData.summary.acceptedFe }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Error</span>
              <span class="font-semibold text-red-600">
                {{ plotData.summary.errorFe }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ plotData.summary.acceptedFe + plotData.summary.errorFe }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
        :traces="feTraces"
        :layout="{
          xaxis: { showticklabels: false, showgrid: false },
          yaxis: { showgrid: false }
        }"
         :height="320" />
      </div>

      <!-- MGO -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">MRAL -  MgO Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between CRM and MRAL for MgO
            </p>
          </div>

          <div v-if="plotData?.summary" class="min-w-[130px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Accepted</span>
              <span class="font-semibold text-green-600">
                {{ plotData.summary.acceptedMgo }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Error</span>
              <span class="font-semibold text-red-600">
                {{ plotData.summary.errorMgo }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ plotData.summary.acceptedMgo + plotData.summary.errorMgo }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
        :traces="mgoTraces"
        :layout="{
            xaxis: { showticklabels: false, showgrid: false },
            yaxis: { showgrid: false }
          }"
        :height="320" />
      </div>

      <!-- SIO2 -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">MRAL -  SiO2 Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between CRM and MRAL for SiO2
            </p>
          </div>

          <div v-if="plotData?.summary" class="min-w-[130px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Accepted</span>
              <span class="font-semibold text-green-600">
                {{ plotData.summary.acceptedSio2 }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Error</span>
              <span class="font-semibold text-red-600">
                {{ plotData.summary.errorSio2 }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Total</span>
              <span class="font-semibold">
                {{ plotData.summary.acceptedSio2 + plotData.summary.errorSio2 }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart 
        :traces="sio2Traces"
        :layout="{
          xaxis: { showticklabels: false, showgrid: false },
          yaxis: { showgrid: false }
        }"
        :height="320" />
      </div>
    </div>
  </div>
</template>