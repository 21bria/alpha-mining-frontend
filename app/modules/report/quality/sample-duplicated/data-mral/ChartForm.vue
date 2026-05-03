<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue"
import { useDupFilterStore } from "@/stores/filters/duplicated-filter"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import FilterDup from "@/components/filters/FilterDuplicated.vue"
import PlotlyLineChart from "@/components/charts/PlotlyLineChart.vue"

const dupStore = useDupFilterStore()
const { request } = useApi()
const notify = useNotify()

type ScatterPoint = {
  x: number
  y: number
  release_date?: string | null
  material?: string | null
  sample_number?: string | null
  sample_original?: string | null
  iup_id?: number | null
  iup_code?: string | null
  iup_name?: string | null
}

type ScatterLines = {
  axis_max: number
  upper: { x: number[]; y: number[] }
  center: { x: number[]; y: number[] }
  lower: { x: number[]; y: number[] }
}

type ScatterStats = {
  analyte: string
  count: number
  r_squared: number
  slope?: number
  intercept?: number
}

type ScatterSection = {
  points: ScatterPoint[]
  lines: ScatterLines
  stats?: ScatterStats | null
}


type PlotResponse = {
  ni: ScatterSection
  co: ScatterSection
  fe: ScatterSection
  mgo: ScatterSection
  sio2: ScatterSection
  rows?: any[]
}

type PlotFilters = {
  iup_id?: number | null
  start_date: string
  end_date: string
}

const plotFilters = ref<PlotFilters | null>(null)
const plotData = ref<PlotResponse | null>(null)
const plotLoading = ref(false)

function emptyScatterSection(analyte: string): ScatterSection {
  return {
    points: [],
    lines: {
      axis_max: 1,
      upper: { x: [], y: [] },
      center: { x: [], y: [] },
      lower: { x: [], y: [] },
    },
    stats: {
      analyte,
      count: 0,
      r_squared: 0,
    },
  }
}

function getSection(analyte: "ni" | "co" | "fe" | "mgo" | "sio2"): ScatterSection {
  return plotData.value?.[analyte] ?? emptyScatterSection(analyte)
}

async function fetchPlotData() {
  if (!plotFilters.value?.start_date || !plotFilters.value?.end_date) {
    plotData.value = null
    return
  }

  plotLoading.value = true
  try {
    const res = await request<PlotResponse>(
      "/api/analytics/raw/geology/sample-duplicated-mral/scatter",
      {
        method: "GET",
        query: {
          iup_id: plotFilters.value.iup_id ?? undefined,
          start_date: plotFilters.value.start_date,
          end_date: plotFilters.value.end_date,
        },
      }
    )

    plotData.value = res
  } catch (err: any) {
    plotData.value = null
    notify.error(err?.message || "Failed to load scatter data")
  } finally {
    plotLoading.value = false
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

function buildScatterTraces(section: ScatterSection, analyte: string) {
  const points = section?.points ?? []
  const lines = section?.lines ?? {
    axis_max: 1,
    upper: { x: [], y: [] },
    center: { x: [], y: [] },
    lower: { x: [], y: [] },
  }

  return [
    {
      type: "scatter",
      mode: "lines",
      name: "Upper",
      x: lines.upper?.x ?? [],
      y: lines.upper?.y ?? [],
      line: { dash: "dot" },
      hoverinfo: "skip",
    },
    {
      type: "scatter",
      mode: "lines",
      name: "Centre",
      x: lines.center?.x ?? [],
      y: lines.center?.y ?? [],
      line: { width: 2 },
      hoverinfo: "skip",
    },
    {
      type: "scatter",
      mode: "lines",
      name: "Lower",
      x: lines.lower?.x ?? [],
      y: lines.lower?.y ?? [],
      line: { dash: "dot" },
      hoverinfo: "skip",
    },
    {
      type: "scatter",
      mode: "markers",
      name: analyte.toUpperCase(),
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      customdata: points,
      text: points.map((p) =>
        [
          `Date: ${p.release_date ?? "-"}`,
          `Material: ${p.material ?? "-"}`,
          `Dup: ${p.sample_number ?? "-"}`,
          `Ori: ${p.sample_original ?? "-"}`,
          `${analyte.toUpperCase()} Dup: ${p.x ?? "-"}`,
          `${analyte.toUpperCase()} Ori: ${p.y ?? "-"}`,
          `IUP: ${p.iup_code ?? "-"}`,
        ].join("<br>")
      ),
      hovertemplate: "%{text}<extra></extra>",
      marker: {
        size: 9,
      },
    },
  ]
}

function buildScatterLayout(section: ScatterSection, analyte: string, title: string) {
  const axisMax = Number(section?.lines?.axis_max ?? 1)
  const r2 = section?.stats?.r_squared

  return {
    title: {
      text: title,
      x: 0.5,
      xanchor: "center",
      y: 0.98,
      yanchor: "top",
      font: { size: 16 },
    },
    height: 320,
    margin: { l: 50, r: 20, t: 80, b: 40 },
    hovermode: "closest",
    legend: {
      orientation: "h",
      x: 0,
      y: 1.08,
      xanchor: "left",
      yanchor: "bottom",
    },
    xaxis: {
      title: "Duplicated",
      range: [0, axisMax],
      showgrid: false,
      zeroline: false,
      tickformat: ".2f",
    },
    yaxis: {
      title: "Original",
      range: [0, axisMax],
      showgrid: true,
      gridcolor: "rgba(0,0,0,0.07)",
      zeroline: false,
      tickformat: ".2f",
    },
    annotations: r2 != null
      ? [
        {
          xref: "paper",
          yref: "paper",
          x: 0.5,
          y: 1.14,
          showarrow: false,
          text: `R²: ${r2}`,
          font: { size: 12 },
        },
      ]
      : [],
  }
}

const niSection = computed(() => getSection("ni"))
const coSection = computed(() => getSection("co"))
const feSection = computed(() => getSection("fe"))
const mgoSection = computed(() => getSection("mgo"))
const sio2Section = computed(() => getSection("sio2"))

const niTraces = computed(() => buildScatterTraces(niSection.value, "ni"))
const coTraces = computed(() => buildScatterTraces(coSection.value, "co"))
const feTraces = computed(() => buildScatterTraces(feSection.value, "fe"))
const mgoTraces = computed(() => buildScatterTraces(mgoSection.value, "mgo"))
const sio2Traces = computed(() => buildScatterTraces(sio2Section.value, "sio2"))

const niLayout = computed(() =>
  buildScatterLayout(niSection.value, "ni", "Duplicate vs Original (Ni)")
)
const coLayout = computed(() =>
  buildScatterLayout(coSection.value, "co", "Duplicate vs Original (Co)")
)
const feLayout = computed(() =>
  buildScatterLayout(feSection.value, "fe", "Duplicate vs Original (Fe)")
)
const mgoLayout = computed(() =>
  buildScatterLayout(mgoSection.value, "mgo", "Duplicate vs Original (MgO)")
)
const sio2Layout = computed(() =>
  buildScatterLayout(sio2Section.value, "sio2", "Duplicate vs Original (SiO2)")
)

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
      Loading scatter data...
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- NI -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Duplicate - Ni Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between duplicated and original for Ni
            </p>
          </div>

          <div v-if="niSection?.stats" class="min-w-[140px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Samples</span>
              <span class="font-semibold">
                {{ niSection.stats.count }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">R²</span>
              <span class="font-semibold text-blue-600">
                {{ niSection.stats.r_squared }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Quality</span>
              <span class="font-semibold" :class="niSection.stats.r_squared > 0.9 ? 'text-green-600' : 'text-red-600'">
                {{ niSection.stats.r_squared > 0.9 ? 'Good' : 'Poor' }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart :traces="niTraces" :layout="niLayout" :height="320" />
      </div>
      <!-- CO -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Duplicate - Co Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between duplicated and original for Co
            </p>
          </div>

          <div v-if="coSection?.stats" class="min-w-[140px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Samples</span>
              <span class="font-semibold">
                {{ coSection.stats.count }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">R²</span>
              <span class="font-semibold text-blue-600">
                {{ coSection.stats.r_squared }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Quality</span>
              <span class="font-semibold" :class="coSection.stats.r_squared > 0.9 ? 'text-green-600' : 'text-red-600'">
                {{ coSection.stats.r_squared > 0.9 ? 'Good' : 'Poor' }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart :traces="coTraces" :layout="coLayout" :height="320" />
      </div>

      <!-- FE -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Duplicate - Fe Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between duplicated and original for Fe
            </p>
          </div>

          <div v-if="feSection?.stats" class="min-w-[140px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Samples</span>
              <span class="font-semibold">
                {{ feSection.stats.count }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">R²</span>
              <span class="font-semibold text-blue-600">
                {{ feSection.stats.r_squared }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Quality</span>
              <span class="font-semibold" :class="feSection.stats.r_squared > 0.9 ? 'text-green-600' : 'text-red-600'">
                {{ feSection.stats.r_squared > 0.9 ? 'Good' : 'Poor' }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart :traces="feTraces" :layout="feLayout" :height="320" />
      </div>

      <!-- MGO -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Duplicate - MgO Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between duplicated and original for MgO
            </p>
          </div>

          <div v-if="mgoSection?.stats" class="min-w-[140px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Samples</span>
              <span class="font-semibold">
                {{ mgoSection.stats.count }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">R²</span>
              <span class="font-semibold text-blue-600">
                {{ mgoSection.stats.r_squared }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Quality</span>
              <span class="font-semibold" :class="mgoSection.stats.r_squared > 0.9 ? 'text-green-600' : 'text-red-600'">
                {{ mgoSection.stats.r_squared > 0.9 ? 'Good' : 'Poor' }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart :traces="mgoTraces" :layout="mgoLayout" :height="320" />
      </div>

      <!-- SIO2 -->
      <div class="rounded-xl border p-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">Duplicate - SiO2 Analysis</h3>
            <p class="text-xs text-muted-foreground">
              Comparison between duplicated and original for SiO2
            </p>
          </div>

          <div v-if="sio2Section?.stats" class="min-w-[140px] rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">Samples</span>
              <span class="font-semibold">
                {{ sio2Section.stats.count }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">R²</span>
              <span class="font-semibold text-blue-600">
                {{ sio2Section.stats.r_squared }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 border-t pt-2">
              <span class="text-muted-foreground">Quality</span>
              <span class="font-semibold"
                :class="sio2Section.stats.r_squared > 0.9 ? 'text-green-600' : 'text-red-600'">
                {{ sio2Section.stats.r_squared > 0.9 ? 'Good' : 'Poor' }}
              </span>
            </div>
          </div>
        </div>

        <PlotlyLineChart :traces="sio2Traces" :layout="sio2Layout" :height="320" />
      </div>
    </div>
  </div>
</template>