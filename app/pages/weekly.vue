<script setup lang="ts">
import NumberFlow from "@number-flow/vue"
import { ChevronDown } from "lucide-vue-next"
import { Activity } from "lucide-vue-next"
import FilterControls from "@/components/filters/FilterWeekly.vue"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"
import { ExternalLink } from "lucide-vue-next"
const route = useRoute()
const notify = useNotify()
const { request } = useApi()

const isLoading = ref(false)

const summaryCards = ref<any[]>([])
const miningRows = ref<any[]>([])
const fleetCards = ref<any[]>([])
const manpowerRows = ref<any[]>([])
const documents = ref<any[]>([])

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  )
}

function formatNumber(v: number) {
  return new Intl.NumberFormat("en-US").format(Number(v || 0))
}

function normalizeText(v: any) {
  return String(v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function mapTrend(status: string | null) {
  if (status === "UP") return "▲"
  if (status === "DOWN") return "▼"
  if (status === "STABLE") return "●"
  return "-"
}

function sortByOrder(rows: any[]) {
  return [...rows].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  )
}

function calcAchievement(plan: number, actual: number) {
  if (!plan) return 0
  return Number(((actual / plan) * 100).toFixed(1))
}

function resetData() {
  summaryCards.value = []
  miningRows.value = []
  fleetCards.value = []
  manpowerRows.value = []
  documents.value = []
}

async function loadReport(payload: {
  date_start: string | null
  date_end: string | null
}) {
  isLoading.value = true

  try {
    const res: any = await request("/api/analytics/bod-weekly-report/", {
      method: "GET",
      query: cleanQuery({
        iup_id: route.query.iup_id,
        period_start: payload.date_start,
        period_end: payload.date_end,
      }),
    })

    const item = res?.results?.[0] || null

    if (!item) {
      resetData()
      notify.info("No BOD report found")
      return
    }

    const metrics = sortByOrder(item.metrics || [])
    const rawMiningRows = sortByOrder(item.mining_rows || [])

    const subtotalRow = rawMiningRows.find((x: any) => {
      const material = normalizeText(x.material)
      return material.includes("SUBTOTAL")
    })

    const bargingRow = rawMiningRows.find((x: any) => {
      const material = normalizeText(x.material)
      return material.includes("BARGING")
    })

    const productionRows = rawMiningRows.filter((x: any) => {
      return ["ORE", "WASTE"].includes(x.group) &&
        !x.is_total &&
        !x.is_grand_total
    })

    const productionPlan = subtotalRow
      ? Number(subtotalRow.weekly_plan || 0)
      : productionRows.reduce(
        (sum: number, row: any) => sum + Number(row.weekly_plan || 0),
        0,
      )

    const productionActual = subtotalRow
      ? Number(subtotalRow.actual || 0)
      : productionRows.reduce(
        (sum: number, row: any) => sum + Number(row.actual || 0),
        0,
      )

    const productionAchievement = subtotalRow
      ? Number(subtotalRow.achievement || 0)
      : calcAchievement(productionPlan, productionActual)

    const metricCards = metrics
      .filter((m: any) =>
        ["SUMMARY", "INVENTORY"].includes(m.section),
      )
      .map((m: any) => ({
        value: Number(m.value || 0),
        suffix: m.suffix || "",
        title: m.title || "-",
        desc: m.description || "",
      }))

    summaryCards.value = []

    summaryCards.value.push({
      value: productionAchievement,
      suffix: "%",
      title: "Production",
      desc: `${formatNumber(productionActual)} vs ${formatNumber(productionPlan)} WMT plan`,
    })

    summaryCards.value.push(...metricCards)

    if (bargingRow) {
      summaryCards.value.push({
        value: Number(((bargingRow.actual || 0) / 1000).toFixed(0)),
        suffix: "K",
        title: "WMT Barging",
        desc: `${Number(bargingRow.achievement || 0)}% of ${formatNumber(bargingRow.weekly_plan || 0)} plan`,
      })
    }

    function mapMiningRow(row: any) {
      return {
        material: row.material,
        group: row.group,
        plan: Number(row.weekly_plan || 0),
        actual: Number(row.actual || 0),
        achievement: Number(row.achievement || 0),
        status: row.is_total || row.is_grand_total
          ? `${Number(row.achievement || 0)}% ${mapTrend(row.status)}`
          : mapTrend(row.status),
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
        !row.is_grand_total
      )
      .map(mapMiningRow)

    const productionSubtotalMapped = rawMiningRows
      .filter((row: any) =>
        row.is_total &&
        !row.is_grand_total &&
        row.group === "TOTAL"
      )
      .map(mapMiningRow)

    const bargingRowsMapped = rawMiningRows
      .filter((row: any) =>
        row.group === "BARGING" &&
        !row.is_total &&
        !row.is_grand_total
      )
      .map(mapMiningRow)

    const bargingSubtotalMapped = rawMiningRows
      .filter((row: any) =>
        row.group === "BARGING" &&
        row.is_total &&
        !row.is_grand_total
      )
    const grandTotalMapped = rawMiningRows
      .filter((row: any) => row.is_grand_total)
      .map(mapMiningRow)

    miningRows.value = [
      ...productionRowsMapped,
      ...productionSubtotalMapped,
      ...bargingRowsMapped,
      ...bargingSubtotalMapped,
      ...grandTotalMapped,
    ]

    fleetCards.value = metrics
      .filter((m: any) =>
        ["HSE", "FLEET", "OTHER"].includes(m.section),
      )
      .map((m: any) => ({
        value: Number(m.value || 0),
        suffix: m.suffix || "",
        title: m.title || "-",
        desc: m.description || "",
      }))

    manpowerRows.value = sortByOrder(item.manpower_rows || [])

    documents.value = sortByOrder(item.documents || []).map((doc: any, index: number) => ({
      title: doc.title || "Document",
      date: doc.document_date || "-",
      fileName: doc.file_name || doc.description || "-",
      fileUrl: doc.file_url || doc.external_url || null,
      document_type: doc.document_type || "OTHER",
      description: doc.description || "Weekly Board Report",
      open: index === 0,
    }))
  } catch (err: any) {
    resetData()
    notify.error(err?.data?.detail || err?.message || "Failed load BOD report")
  } finally {
    isLoading.value = false
  }
}

function handleApply(payload: {
  date_start: string | null
  date_end: string | null
}) {
  loadReport(payload)
}

function toggleDocument(index: number) {
  const doc = documents.value[index]
  if (!doc) return
  doc.open = !doc.open
}

const defaultSummaryCards = [
  {
    value: 0,
    suffix: "%",
    title: "Production",
    desc: "No production data",
  },
  {
    value: 0,
    suffix: "",
    title: "HSE Incidents",
    desc: "No HSE data",
  },
  {
    value: 0,
    suffix: "K",
    title: "Inventory",
    desc: "No inventory data",
  },
  {
    value: 0,
    suffix: "K",
    title: "WMT Barging",
    desc: "No barging data",
  },
]
function openFile(url?: string | null) {
  if (!url) return

  globalThis.window?.open(url, "_blank")
}


</script>

<template>

  <div class="relative min-h-[calc(100vh-56px)] w-full overflow-hidden px-6 lg:px-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">
        Operations Scorecard
      </h2>

      <div class="flex items-center space-x-2">
        <FilterControls @apply="handleApply" />
      </div>
    </div>

    <main class="@container/main mt-6 flex flex-1 flex-col gap-4 md:gap-6">
      <div v-if="isLoading" class="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Loading BOD report...
      </div>

      <!-- SUMMARY CARDS -->

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card v-for="card in summaryCards.length ? summaryCards : defaultSummaryCards" :key="card.title"
          class="overflow-hidden">
          <!-- <CardHeader class="p-4">
            <CardTitle class="flex flex-wrap items-baseline gap-x-2 gap-y-1">

              <span class="text-3xl font-bold leading-none sm:text-4xl ">
                <NumberFlow :value="card.value" />
              </span>

              <span class="text-2xl font-bold leading-none">
                {{ card.suffix }}
              </span>

              <span class="min-w-0 break-words text-lg font-medium leading-tight">
                {{ card.title }}
              </span>

            </CardTitle>

            <CardDescription class="mt-2 break-words text-sm leading-snug text-primary">
              {{ card.desc }}
            </CardDescription>

          </CardHeader> -->
          <CardHeader class="gap-1 px-5 py-3">
            <div class="flex items-center justify-between">
              <CardDescription class="text-sm text-muted-foreground">
                {{ card.title }}
              </CardDescription>

              <Activity class="h-4 w-4 text-muted-foreground" />
            </div>

            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-bold tracking-tight">
                <NumberFlow :value="card.value" />
              </span>

              <span class="text-base font-semibold">
                {{ card.suffix }}
              </span>
            </div>

            <CardDescription class="pt-1 text-sm leading-normal text-primary">
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
              <!-- HEADER -->
              <thead class="
                  bg-gradient-to-r
                  from-muted/80
                  to-muted/40
                  text-xs uppercase tracking-wide
                ">
                <tr class="border-b">
                  <th class="px-5 py-2 text-left font-semibold">
                    Material
                  </th>
                  <th class="px-5 py-2 text-right font-semibold">
                    Weekly Plan (WMT)
                  </th>
                  <th class="px-5 py-2 text-right font-semibold">
                    Actual (WMT)
                  </th>
                  <th class="px-5 py-2 text-right font-semibold">
                    Achievement
                  </th>
                  <th class="px-5 py-2 text-center font-semibold">
                    Trend
                  </th>
                </tr>
              </thead>

              <!-- BODY -->
              <tbody>
                <tr v-for="(row, index) in miningRows" :key="row.material" class="border-b transition-colors hover:bg-muted/30" 
                    :class="[
                      row.isGrandTotal
                        ? 'bg-primary/10 font-bold'
                        : row.isTotal
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 font-semibold'
                          : row.group === 'BARGING'
                            ? 'bg-red-40 dark:bg-red-950/10'
                            : index % 2 === 0
                              ? 'bg-background'
                              : 'bg-muted/10',
                    ]"
                  >

                  <!-- MATERIAL -->
                  <td class="px-5 py-2 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="h-2.5 w-2.5 rounded-full" :class="[
                        row.status?.includes('▲')
                          ? 'bg-emerald-500'
                          : row.status?.includes('▼')
                            ? 'bg-red-500'
                            : 'bg-muted-foreground',
                      ]" />
                      <span>
                        {{ row.material }}
                      </span>
                    </div>
                  </td>
                  <!-- PLAN -->
                  <td class="px-5 py-2 text-right whitespace-nowrap tabular-nums">
                    {{ formatNumber(row.plan) }}
                  </td>
                  <!-- ACTUAL -->
                  <td class="px-5 py-2 text-right whitespace-nowrap tabular-nums">
                    <div class="flex items-center justify-end gap-2">
                      <span>
                        {{ formatNumber(row.actual) }}
                      </span>
                    </div>
                  </td>
                  <!-- ACHIEVEMENT -->
                  <td class="px-5 py-2 text-right whitespace-nowrap font-semibold" :class="[
                    row.achievement >= 100
                      ? 'text-emerald-600'
                      : row.achievement >= 70
                        ? 'text-amber-600'
                        : 'text-red-600',
                  ]">
                    {{ row.achievement }}%
                  </td>

                  <!-- STATUS -->
                  <td class="px-5 py-2 text-center">

                    <span class="
                      inline-flex items-center rounded-full
                        border px-2.5 py-1 text-xs font-medium
                      " :class="[
                        row.status?.includes('▲')
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                          : row.status?.includes('▼')
                            ? 'border-red-500/30 bg-red-500/10 text-red-700'
                            : 'border-muted bg-muted/40 text-muted-foreground',
                      ]">
                      {{ row.status }}
                    </span>
                  </td>
                </tr>
                <!-- EMPTY -->
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

              <div v-for="card in fleetCards" :key="card.title" class="
                  rounded-2xl
                  border border-border/80
                  bg-background/50
                  px-6 py-8
                  text-center
                  transition-all
                  hover:border-primary/30
                  hover:shadow-lg
              ">

                <div class="text-2xl font-bold">
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

              <div v-if="!fleetCards.length" class="col-span-full p-5 text-center text-muted-foreground">
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
              <div v-for="row in manpowerRows" :key="row.id || row.contractor" class="
                    flex items-center justify-between gap-3
                    border-b border-border/70
                    py-2
                    last:border-b-0
                  ">
                <span :class="[
                  row.description ? 'text-muted-foreground' : 'font-semibold',
                ]">
                  {{ row.contractor }}
                </span>

                <span class="font-semibold">
                  {{ formatNumber(row.personnel || 0) }}
                  <span v-if="row.description" class="ml-1 text-sm text-muted-foreground">
                    {{ row.description }}
                  </span>
                </span>
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
                <button type="button" class="flex w-full items-center justify-between px-6 py-4 text-left"
                  @click="toggleDocument(index)">
                  <span class="text-lg font-semibold text-foreground">
                    {{ doc.title }}
                  </span>

                  <ChevronDown class="h-5 w-5 text-primary transition-transform"
                    :class="doc.open ? 'rotate-180' : ''" />
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
                          <Button variant="outline" size="icon" class="h-10 w-10"
                            @click="doc.fileUrl && openFile(doc.fileUrl)">
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

              <div v-if="!documents.length" class="p-5 text-center text-muted-foreground">
                No documents
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>