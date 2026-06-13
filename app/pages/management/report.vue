<script setup lang="ts">
import NumberFlow from "@number-flow/vue"
import {
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-vue-next"

import { useRoute } from "vue-router"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"

const route = useRoute()
const notify = useNotify()
const { request } = useApi()

const isLoading = ref(false)

const summaryCards = ref<any[]>([])
const miningRows = ref<any[]>([])
const fleetCards = ref<any[]>([])
const manpowerRows = ref<any[]>([])
const documents = ref<any[]>([])

function getPeriodLabel(periodType?: string) {
  switch (periodType) {
    case "weekly":
      return "Weekly"
    case "monthly":
      return "MTD"
    case "yearly":
      return "YTD"
    case "range":
      return "Range"
    case "daily":
      return "Daily"
    default:
      return "Actual"
  }
}

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  )
}

function formatNumber(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatPercent(value: number | string) {
  return `${Math.round(Number(value || 0))}%`
}

function formatK(value: number | string) {
  return Number((Number(value || 0) / 1000).toFixed(0))
}

function formatCompact(value: number | string) {
  const num = Number(value || 0)

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }

  return formatNumber(num)
}

function mapTrend(status: string | null) {
  if (status === "UP") return TrendingUp
  if (status === "DOWN") return TrendingDown
  return Minus
}

function sortByOrder(rows: any[]) {
  return [...rows].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  )
}

function resetData() {
  summaryCards.value = []
  miningRows.value = []
  fleetCards.value = []
  manpowerRows.value = []
  documents.value = []
}

function buildManagementReportQuery() {
  return cleanQuery({
    iup_id: route.query.iup_id,
    period_type: route.query.period_type || route.query.filter_type,
    year: route.query.year,
    month: route.query.month,
    week: route.query.week,
    period_start: route.query.period_start || route.query.date_start,
    period_end: route.query.period_end || route.query.date_end,
  })
}

function calcAchievement(plan: number, actual: number) {
    if (!plan) return 0

    return Math.round((actual / plan) * 100)
}

function buildReportView(item: any) {
  const periodLabel = getPeriodLabel(item.period_type)

  const metrics = sortByOrder(item.metrics || [])
  const rawMiningRows = sortByOrder(item.mining_rows || [])

  const productionRows = rawMiningRows.filter((row: any) =>
    ["ORE", "WASTE"].includes(row.group) &&
    !row.is_total &&
    !row.is_grand_total,
  )

  const bargingRow = rawMiningRows.find((row: any) =>
    row.group === "BARGING" &&
    !row.is_total &&
    !row.is_grand_total,
  )

  const inventoryMetric = metrics.find((m: any) =>
    m.section === "INVENTORY",
  )

  const hseMetrics = metrics.filter((m: any) =>
    m.section === "HSE",
  )

  const hseIncidents =
    Number(item.hse_incidents || 0) ||
    hseMetrics.reduce(
      (sum: number, m: any) => sum + Number(m.value || 0),
      0,
    )

  const hseDesc = hseIncidents > 0
    ? `${formatNumber(hseIncidents)} incident recorded`
    : "Zero Incident"

  const productionPlan = productionRows.reduce(
    (sum: number, row: any) => sum + Number(row.plan || 0),
    0,
  )

  const bargingPlan = Number(bargingRow?.plan || 0)

  const totalMovementPlan = productionPlan + bargingPlan
  const productionActual =
    Number(item.total_production || 0) ||
    productionRows.reduce(
      (sum: number, row: any) => sum + Number(row.actual || 0),
      0,
    )

  const bargingActual =
    Number(item.total_barging || 0) ||
    Number(bargingRow?.actual || 0)

  const totalMovement =
    Number(item.total_movement || 0) ||
    productionActual + bargingActual

 
  const productionAchievement =
    calcAchievement(productionPlan, productionActual)

  const bargingAchievement =
    calcAchievement(bargingPlan, bargingActual)

  const movementAchievement =
    calcAchievement(
      totalMovementPlan,
      totalMovement,
    )

  const inventoryValue =
    Number(item.total_inventory || 0) ||
    Number(inventoryMetric?.value || 0)

  const inventoryDesc =
    Number(item.stockpile_count || 0) > 0 ||
    Number(item.avg_ni || 0) > 0
      ? `${Number(item.stockpile_count || 0)} Stockpiles • Avg Ni ${Number(item.avg_ni || 0)}%`
      : inventoryMetric?.description || "No inventory data"

  summaryCards.value = [
    {
      value: hseIncidents,
      suffix: "",
      title: "HSE Incidents",
      desc: hseDesc,
      icon: hseIncidents > 0 ? AlertTriangle : ShieldCheck,
      color: hseIncidents > 0 ? "text-red-500" : "text-emerald-500",
    },
    {
      value: movementAchievement,
      suffix: "%",
      title: "Total Movement",
      desc: `${formatCompact(totalMovement)} of ${formatCompact(totalMovementPlan)} Plan`,
      icon: totalMovement > 0 ? TrendingUp : Minus,
      color: totalMovement > 0 ? "text-emerald-500" : "text-muted-foreground",
    },
    {
      value: formatK(productionActual),
      suffix: "K",
      title: "Production",
      // desc: `Plan: ${formatCompact(productionPlan)} | Actual: ${formatCompact(productionActual)} (${periodLabel})`,
      desc: `${formatCompact(productionAchievement)}% of ${formatCompact(productionPlan)} Plan (${periodLabel})`,
      icon: productionActual > 0 ? TrendingUp : Minus,
      color: productionActual > 0 ? "text-emerald-500" : "text-muted-foreground",
    },
    {
      value: formatK(bargingActual),
      suffix: "K",
      title: "Barging",
      desc: `${formatCompact(bargingAchievement)}% of ${formatCompact(bargingPlan)} Plan(${periodLabel})`,
      icon: bargingActual > 0 ? TrendingUp : Minus,
      color: bargingActual > 0 ? "text-emerald-500" : "text-muted-foreground",
    },
    {
      value: formatK(inventoryValue),
      suffix: "K",
      title: "Inventory",
      desc: inventoryDesc,
      icon: inventoryValue > 0 ? TrendingUp : Minus,
      color: inventoryValue > 0 ? "text-emerald-500" : "text-muted-foreground",
    },
  ]

  function mapMiningRow(row: any) {
    return {
      material: row.material,
      group: row.group,
      plan: Number(row.plan || 0),
      actual: Number(row.actual || 0),
      achievement: Number(row.achievement || 0),
      trendIcon: mapTrend(row.status),
      trendStatus: row.status,
      bold: row.is_total || row.is_grand_total,
      isTotal: row.is_total,
      isGrandTotal: row.is_grand_total,
      sourceModule: row.source_module,
    }
  }

  const productionRowsMapped = rawMiningRows
    .filter((row: any) =>
      ["ORE", "WASTE"].includes(row.group) &&
      !row.is_total &&
      !row.is_grand_total,
    )
    .map(mapMiningRow)

  const productionSubtotalMapped = rawMiningRows
    .filter((row: any) =>
      row.is_total &&
      !row.is_grand_total &&
      row.group === "TOTAL",
    )
    .map(mapMiningRow)

  const bargingRowsMapped = rawMiningRows
    .filter((row: any) =>
      row.group === "BARGING" &&
      !row.is_total &&
      !row.is_grand_total,
    )
    .map(mapMiningRow)

  const grandTotalMapped = rawMiningRows
    .filter((row: any) => row.is_grand_total)
    .map(mapMiningRow)

  miningRows.value = [
    ...productionRowsMapped,
    ...productionSubtotalMapped,
    ...bargingRowsMapped,
    ...grandTotalMapped,
  ]

  fleetCards.value = metrics
    .filter((m: any) =>
      ["HSE", "FLEET", "OTHER"].includes(m.section),
    )
    .map((m: any) => {
      const value = Number(m.value || 0)
      const isHse = m.section === "HSE"

      return {
        value,
        suffix: m.suffix || "",
        title: m.title || "-",
        desc: m.description || "",
        icon: isHse
          ? value > 0
            ? AlertTriangle
            : ShieldCheck
          : value > 0
            ? TrendingUp
            : Minus,
        color: isHse
          ? value > 0
            ? "text-red-500"
            : "text-emerald-500"
          : value > 0
            ? "text-emerald-500"
            : "text-muted-foreground",
      }
    })

  manpowerRows.value = sortByOrder(item.manpower_rows || [])

  documents.value = sortByOrder(item.documents || []).map((doc: any, index: number) => ({
    title: doc.title || "Document",
    date: doc.document_date || "-",
    fileName: doc.file_name || doc.description || "-",
    fileUrl: doc.file_url || doc.external_url || null,
    document_type: doc.document_type || "OTHER",
    description: doc.description || "Management Report",
    open: index === 0,
  }))
}

async function loadReport() {
  isLoading.value = true

  try {
    // const res: any = await request("/api/analytics/management-report/", {
    //   method: "GET",
    //   query: buildManagementReportQuery(),
    // })

    // const item = res?.results?.[0] || null
    const res: any = await request("/api/analytics/management-report/view/", {
        method: "GET",
        query: buildManagementReportQuery(),
      })

    const item = res?.data || null
    
    if (!item) {
      resetData()
      notify.info("No management report found")
      return
    }

    buildReportView(item)
  } catch (err: any) {
    resetData()
    notify.error(err?.data?.detail || err?.message || "Failed load management report")
  } finally {
    isLoading.value = false
  }
}

function toggleDocument(index: number) {
  const doc = documents.value[index]
  if (!doc) return
  doc.open = !doc.open
}

const defaultSummaryCards = [
  {
    value: 0,
    suffix: "",
    title: "HSE Incidents",
    desc: "Zero Incident",
    icon: ShieldCheck,
    color: "text-emerald-500",
  },
  {
    value: 0,
    suffix: "K",
    title: "Total Movement",
    desc: "No movement data",
    icon: Minus,
    color: "text-muted-foreground",
  },
  {
    value: 0,
    suffix: "K",
    title: "Production",
    desc: "No production data",
    icon: Minus,
    color: "text-muted-foreground",
  },
  {
    value: 0,
    suffix: "K",
    title: "Barging",
    desc: "No barging data",
    icon: Minus,
    color: "text-muted-foreground",
  },
  {
    value: 0,
    suffix: "K",
    title: "Inventory",
    desc: "No inventory data",
    icon: Minus,
    color: "text-muted-foreground",
  },
]

function openFile(url?: string | null) {
  if (!url) return
  globalThis.window?.open(url, "_blank")
}

watch(
  () => route.query,
  () => {
    loadReport()
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="relative min-h-[calc(100vh-56px)] w-full overflow-hidden px-6 lg:px-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
     <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
      Operations Scorecard
      <span class="text-xl">👋</span>
    </h2>
    </div>

    <main class="@container/main mt-5 flex flex-1 flex-col gap-4 md:gap-6">
      <div v-if="isLoading" class="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Loading Management Report...
      </div>

      <!-- SUMMARY CARDS -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card v-for="card in summaryCards.length ? summaryCards : defaultSummaryCards" :key="card.title" class="overflow-hidden" >
          <CardHeader class="gap-1 px-5 py-0.2">
            <div class="flex items-center justify-between">
              <CardDescription class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {{ card.title }}
              </CardDescription>

              <div
                class="flex h-9 w-9 items-center justify-center rounded-full border"
                :class="[
                  card.color?.includes('red')
                    ? 'border-red-500/20 bg-red-500/10'
                    : 'border-emerald-500/20 bg-emerald-500/10',
                ]"
              >
              <component :is="card.icon || Minus" class="h-4 w-4":class="card.color || 'text-muted-foreground'"/>
              </div>
            </div>

            <div class="flex items-end gap-1">
              <span class="text-[2.5rem] font-semibold leading-none tracking-tight">
                <NumberFlow :value="card.value" />
              </span>

              <span class="mb-2.5 text-lg font-semibold text-muted-foreground">
                {{ card.suffix }}
              </span>
            </div>

            <CardDescription class="pt-0.5 text-xs leading-snug text-muted-foreground">
              {{ card.desc }}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <!-- MINING TABLE -->
      <div class="overflow-hidden rounded-xl border border-border/60 bg-background">
        <div class="flex items-center bg-primary px-6 py-4 text-primary-foreground opacity-90">
          <h2 class="text-normal font-semibold leading-none">
            MINING & BARGING
          </h2>
        </div>

        <div class="p-3">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="bg-gradient-to-r from-muted/80 to-muted/40 text-xs uppercase tracking-wide">
                <tr class="border-b">
                  <th class="px-5 py-2 text-left font-semibold">
                    Material
                  </th>
                  <th class="px-5 py-2 text-right font-semibold">
                    Plan
                  </th>
                  <th class="px-5 py-2 text-right font-semibold">
                    Actual
                  </th>
                  <th class="px-5 py-2 text-right font-semibold">
                    Achievement
                  </th>
                  <th class="px-5 py-2 text-center font-semibold">
                    Trend
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, index) in miningRows"
                  :key="row.material"
                  class="border-b transition-colors hover:bg-muted/30"
                  :class="[
                    row.isGrandTotal
                      ? 'bg-primary/10 font-bold'
                      : row.isTotal
                        ? 'bg-emerald-50 font-semibold dark:bg-emerald-950/20'
                        : row.group === 'BARGING'
                          ? 'bg-red-50/40 dark:bg-red-950/10'
                          : index % 2 === 0
                            ? 'bg-background'
                            : 'bg-muted/10',
                  ]"
                >
                  <!-- MATERIAL -->
                  <td class="whitespace-nowrap px-5 py-2">
                    <div class="flex items-center gap-3">
                      <div
                        class="h-2.5 w-2.5 rounded-full"
                        :class="[
                          row.trendStatus === 'UP'
                            ? 'bg-emerald-500'
                            : row.trendStatus === 'DOWN'
                              ? 'bg-red-500'
                              : 'bg-muted-foreground',
                        ]"
                      />

                      <span>
                        {{ row.material }}
                      </span>
                    </div>
                  </td>

                  <!-- PLAN -->
                  <td class="whitespace-nowrap px-5 py-2 text-right tabular-nums">
                    {{ formatNumber(row.plan) }}
                  </td>

                  <!-- ACTUAL -->
                  <td class="whitespace-nowrap px-5 py-2 text-right tabular-nums">
                    {{ formatNumber(row.actual) }}
                  </td>

                  <!-- ACHIEVEMENT -->
                  <td
                    class="whitespace-nowrap px-5 py-2 text-right font-semibold"
                    :class="[
                      row.achievement >= 100
                        ? 'text-emerald-600'
                        : row.achievement >= 70
                          ? 'text-amber-600'
                          : 'text-red-600',
                    ]"
                  >
                   {{ formatPercent(row.achievement) }}
                  </td>

                  <!-- TREND -->
                  <td class="px-5 py-2 text-center">
                    <span
                      class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                      :class="[
                        row.trendStatus === 'UP'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                          : row.trendStatus === 'DOWN'
                            ? 'border-red-500/30 bg-red-500/10 text-red-700'
                            : 'border-muted bg-muted/40 text-muted-foreground',
                      ]"
                    >
                      <component
                        :is="row.trendIcon || Minus"
                        class="h-3.5 w-3.5"
                      />

                      <span v-if="row.isTotal || row.isGrandTotal">
                      {{ formatPercent(row.achievement) }}
                      </span>
                    </span>
                  </td>
                </tr>

                <tr v-if="!miningRows.length">
                  <td colspan="5" class="py-14 text-center text-muted-foreground">
                    No mining data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-5 pt-2">
        <!-- HSE / FLEET -->
        <div class="col-span-12 xl:col-span-7">
          <div class="overflow-hidden rounded-xl border border-border/60 bg-background">
            <div class="flex items-center bg-primary px-6 py-4 text-primary-foreground opacity-90">
              <h2 class="text-normal font-semibold leading-none">
                HSE & FLEET PERFORMANCE
              </h2>
            </div>

            <div class="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
              <div
                v-for="card in fleetCards"
                :key="card.title"
                class="rounded-2xl border border-border/80 bg-background/50 px-6 py-8 text-center transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div class="mb-3 flex justify-center">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-full border"
                    :class="[
                      card.color?.includes('red')
                        ? 'border-red-500/20 bg-red-500/10'
                        : 'border-emerald-500/20 bg-emerald-500/10',
                    ]"
                  >
                    <component
                      :is="card.icon || TrendingUp"
                      class="h-6 w-6"
                      :class="card.color || 'text-emerald-500'"
                    />
                  </div>
                </div>

                <div class="text-2xl font-bold" :class="card.color || 'text-emerald-600'">
                  <NumberFlow :value="card.value" />
                  <span>{{ card.suffix }}</span>
                </div>
                <div class="mt-3 text-xl font-medium">
                  {{ card.title }}
                </div>

                <div class="mt-2 text-sm text-muted-foreground">
                  {{ card.desc }}
                </div>
              </div>

              <div v-if="!fleetCards.length"  class="col-span-full p-5 text-center text-muted-foreground" >
                No HSE/Fleet data
              </div>
            </div>
          </div>
        </div>

        <!-- MANPOWER -->
        <div class="col-span-12 xl:col-span-5">
          <div class="overflow-hidden rounded-xl border border-border/60 bg-background">
            <div class="flex items-center bg-primary px-6 py-4 text-primary-foreground opacity-90">
              <h2 class="text-normal font-semibold leading-none">
                MANPOWER SUMMARY
              </h2>
            </div>

            <div class="space-y-1 p-4 text-normal">
             <div
                v-for="row in manpowerRows"
                :key="row.id || row.contractor"
                class="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-b-0"
              >
                <span
                  :class="[
                    row.description ? 'text-muted-foreground' : 'font-medium',
                  ]"
                >
                  {{ row.contractor }}
                </span>

                <div class="flex items-center gap-2">
                  <span class="font-medium text-foreground">
                    {{ formatNumber(row.personnel || 0) }}

                    <span
                      v-if="row.description"
                      class="ml-1 text-sm text-muted-foreground"
                    >
                      {{ row.description }}
                    </span>
                  </span>

                  <span
                    class="inline-flex items-center rounded-full border px-2 py-0.5"
                    :class="[
                      Number(row.personnel || 0) > 0
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                        : 'border-red-500/30 bg-red-500/10 text-red-700',
                    ]"
                  >
                    <component
                      :is="Number(row.personnel || 0) > 0 ? TrendingUp : TrendingDown"
                      class="h-3.5 w-3.5"
                    />
                  </span>
                </div>
              </div>

              <div v-if="!manpowerRows.length" class="py-5 text-center text-muted-foreground">
                No manpower data
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DOCUMENTS -->
      <div class="grid grid-cols-12 gap-5 pt-2">
        <div class="col-span-12 xl:col-span-7">
          <div class="overflow-hidden rounded-xl border bg-background shadow-sm">
            <div class="flex items-center bg-primary px-6 py-4 text-primary-foreground opacity-90">
              <h2 class="text-normal font-semibold leading-none">
                DOCUMENTS & ATTACHMENTS
              </h2>
            </div>

            <div class="divide-y divide-border/60">
              <div v-for="(doc, index) in documents" :key="doc.title" class="transition-colors hover:bg-muted/20">
                <button type="button" class="flex w-full items-center justify-between px-6 py-4 text-left" @click="toggleDocument(index)">
                  <span class="text-lg font-semibold text-foreground">
                    {{ doc.title }}
                  </span>

                  <ChevronDown
                    class="h-5 w-5 text-primary transition-transform"
                    :class="doc.open ? 'rotate-180' : ''"
                  />
                </button>

                <div v-if="doc.open" class="px-6 pb-5">
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">
                    {{ doc.date }}
                  </p>

                  <div class="mt-2 flex items-center justify-between gap-4">
                    <div>
                      <p class="text-base font-semibold">
                        {{ doc.fileName }}
                      </p>

                      <p class="text-sm text-muted-foreground">
                        {{ doc.document_type }} Document • {{ doc.description }}
                      </p>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Button variant="outline"size="icon" class="h-10 w-10" @click="doc.fileUrl && openFile(doc.fileUrl)" >
                            <ExternalLink class="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent>
                          View Attachment
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div v-if="!documents.length" class="p-5 text-center text-muted-foreground" >
                No documents
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>