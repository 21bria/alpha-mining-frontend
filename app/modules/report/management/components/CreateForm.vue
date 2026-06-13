<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useRouter } from "#app"
import { useDebounceFn } from "@vueuse/core"
import { Plus, Trash2 } from "lucide-vue-next"
import DatePicker from "@/components/ui/date-picker/DatePicker.vue"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Database,FileText,
} from "lucide-vue-next"

import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"
type MiningGroup = "ORE" | "WASTE" | "BARGING" | "TOTAL"
type PeriodType = "weekly" | "monthly" | "yearly" | "range"

const props = withDefaults(defineProps<{
  mode?: "create" | "edit"
  id?: string
}>(), {
  mode: "create",
})

const router = useRouter()
const notify = useNotify()
const { request } = useApi()

const loading = ref(false)
const role = ref<UserRole>("SYSTEM")

const isEdit = computed(() => props.mode === "edit")

const canChooseIup = computed(() =>
  role.value === "SYSTEM" || role.value === "MANAGEMENT",
)

const canMutate = computed(() =>
  role.value !== "GLOBAL_VIEWER",
)

const emptyMiningRow = (sort = 1) => ({
  material: "",
  description: "",
  plan: undefined as number | undefined,
  actual: undefined as number | undefined,
  status: "STABLE",
  group: "ORE" as MiningGroup,
  source_module: "MANUAL",
  is_total: false,
  is_grand_total: false,
  sort_order: sort,
})

const emptyMetricRow = (sort = 1) => ({
  source_module: "MANUAL",
  section: "SUMMARY",
  title: "",
  value: undefined as number | undefined,
  suffix: "",
  description: "",
  sort_order: sort,
})

const emptyManpowerRow = (sort = 1) => ({
  source_module: "MANUAL",
  contractor: "",
  personnel: undefined as number | undefined,
  description: "",
  sort_order: sort,
})

const emptyDocumentRow = (sort = 1) => ({
  id: undefined as string | undefined,
  title: "",
  document_date: "",
  file: null as File | null,
  file_name: "",
  document_type: "PDF",
  external_url: "",
  description: "",
  sort_order: sort,
})

const form = reactive({
  iup: undefined as number | undefined,

  title: "",
  period_type: "weekly" as PeriodType,

  yearly: new Date().getFullYear(),
  monthly: undefined as number | undefined,
  weekly: undefined as number | undefined,

  period_start: "",
  period_end: "",

  status: "Draft",
  remarks: "",

  mining_source: "MANUAL",
  manpower_source: "MANUAL",

  mining_rows: [emptyMiningRow()],
  metrics: [emptyMetricRow()],
  manpower_rows: [emptyManpowerRow()],
  documents: [emptyDocumentRow()],
})

const mineIUPOptions = ref<Array<{ value: number; label: string }>>([])
const mineIUPLoading = ref(false)
const mineIUPSearch = ref("")
const mineIUPPage = ref(1)
const mineIUPHasMore = ref(true)
const mineIUPContentRef = ref<HTMLElement | null>(null)

async function fetchMineIUP(q = "", page = 1) {
  if (mineIUPLoading.value) return

  mineIUPLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    mineIUPOptions.value = page === 1
      ? items
      : [...mineIUPOptions.value, ...items]

    mineIUPPage.value = page
    mineIUPHasMore.value = mineIUPOptions.value.length < count
  } finally {
    mineIUPLoading.value = false
  }
}

const onMineIUPSearch = useDebounceFn((q: string) => {
  mineIUPPage.value = 1
  mineIUPHasMore.value = true

  fetchMineIUP(q, 1).then(() => {
    if (mineIUPContentRef.value) mineIUPContentRef.value.scrollTop = 0
  })
}, 300)

function onMineIUPScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (nearBottom && mineIUPHasMore.value && !mineIUPLoading.value) {
    fetchMineIUP(mineIUPSearch.value, mineIUPPage.value + 1)
  }
}

function toDateInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

// function getIsoWeekDates(year: number, week: number) {
//   const simple = new Date(year, 0, 1 + (week - 1) * 7)
//   const day = simple.getDay()
//   const isoWeekStart = simple

//   if (day <= 4) {
//     isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1)
//   } else {
//     isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay())
//   }

//   const isoWeekEnd = new Date(isoWeekStart)
//   isoWeekEnd.setDate(isoWeekStart.getDate() + 6)

//   return {
//     start: toDateInput(isoWeekStart),
//     end: toDateInput(isoWeekEnd),
//   }
// }

// maju 1 minggu dari ISO standard
function getIsoWeekDates(year: number, week: number) {
  const simple = new Date(Date.UTC(year, 0, 4))

  const dayOfWeek = simple.getUTCDay() || 7

  const monday = new Date(simple)
  monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)

  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  return {
    start: toDateInputUTC(monday),
    end: toDateInputUTC(sunday),
  }
}

function toDateInputUTC(date: Date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

function getMonthDates(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)

  return {
    start: toDateInput(start),
    end: toDateInput(end),
  }
}

function getYearDates(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}

function syncPeriodDates() {
  if (form.period_type === "weekly") {
    if (!form.yearly || !form.weekly) return

    const range = getIsoWeekDates(Number(form.yearly), Number(form.weekly))
    form.period_start = range.start
    form.period_end = range.end
  }

  if (form.period_type === "monthly") {
    if (!form.yearly || !form.monthly) return

    const range = getMonthDates(Number(form.yearly), Number(form.monthly))
    form.period_start = range.start
    form.period_end = range.end
  }

  if (form.period_type === "yearly") {
    if (!form.yearly) return

    const range = getYearDates(Number(form.yearly))
    form.period_start = range.start
    form.period_end = range.end
  }
}


watch(
  () => [
    form.period_type,
    form.yearly,
    form.monthly,
    form.weekly,
  ],
  () => {
    syncPeriodDates()
  },
)
function periodLabel() {
  if (form.period_type === "weekly") {
    return form.weekly
      ? `Week ${form.weekly} • ${form.yearly}`
      : `weekly • ${form.yearly}`
  }

  if (form.period_type === "monthly") {
    return form.monthly
      ? `Month ${String(form.monthly).padStart(2, "0")} • ${form.yearly}`
      : `monthly • ${form.yearly}`
  }

  if (form.period_type === "yearly") {
    return `${form.yearly}`
  }

  return `${form.period_start || "-"} - ${form.period_end || "-"}`
}

function calcAchievement(plan?: number, actual?: number) {
  if (!plan || !actual) return 0
  return Number(((actual / plan) * 100).toFixed(1))
}



async function loadDetail() {
  if (!props.id) return

  try {
    const data: any = await request(`/api/analytics/report-management/${props.id}/`, {
      method: "GET",
    })

    Object.assign(form, {
      iup: data.iup,
      title: data.title || "",

      period_type: data.period_type || "weekly",

      yearly: data.year || new Date().getFullYear(),
      monthly: data.month || undefined,
      // weekly: data.weekly || undefined,
      weekly: data.week ?? undefined,

      period_start: data.period_start || "",
      period_end: data.period_end || "",

      status: data.status || "Draft",
      remarks: data.remarks || "",

      mining_source: data.mining_rows?.[0]?.source_module || "MANUAL",
      manpower_source: data.manpower_rows?.[0]?.source_module || "MANUAL",

      mining_rows: data.mining_rows
        ?.filter((row: any) =>
          !row.is_total &&
          !row.is_grand_total &&
          String(row.material || "").trim()
        )
        ?.map((row: any, index: number) => ({
          material: row.material || "",
          description: row.description || "",
          plan: Number(row.plan || 0),
          actual: Number(row.actual || 0),
          status: row.status || "STABLE",
          group: row.group || "ORE",
          source_module: row.source_module || "MANUAL",
          is_total: false,
          is_grand_total: false,
          sort_order: row.sort_order || index + 1,
        })) || [emptyMiningRow()],

      metrics: data.metrics?.length
        ? data.metrics.map((item: any, index: number) => ({
          source_module: item.source_module || "MANUAL",
          section: item.section || "SUMMARY",
          title: item.title || "",
          value: Number(item.value || 0),
          suffix: item.suffix || "",
          description: item.description || "",
          sort_order: item.sort_order || index + 1,
        }))
        : [emptyMetricRow()],

      manpower_rows: data.manpower_rows?.length
        ? data.manpower_rows.map((row: any, index: number) => ({
          source_module: row.source_module || "MANUAL",
          contractor: row.contractor || "",
          personnel: Number(row.personnel || 0),
          description: row.description || "",
          sort_order: row.sort_order || index + 1,
        }))
        : [emptyManpowerRow()],

      documents: data.documents?.length
        ? data.documents.map((doc: any, index: number) => ({
          id: doc.id,
          title: doc.title || "",
          document_date: doc.document_date || "",
          file: null,
          file_name: doc.file_name || "",
          document_type: doc.document_type || "PDF",
          external_url: doc.external_url || "",
          description: doc.description || "",
          sort_order: doc.sort_order || index + 1,
        }))
        : [emptyDocumentRow()],
    })
  } catch (err: any) {
    notify.error(err?.data?.detail || err?.data?.message || "Failed load report management")
  }
}

const syncing = ref(false)

async function syncReport() {
  if (!props.id) {
    notify.error("Save report first")
    return
  }

  try {
    syncing.value = true

    const res: any = await request(
      `/api/analytics/report-management/${props.id}/sync/`,
      {
        method: "POST",
      }
    )

    notify.success(res?.message || "Report synchronized")

    await loadDetail()
  } catch (err: any) {
    notify.error(
      err?.data?.detail ||
      err?.data?.message ||
      "Failed sync report"
    )
  } finally {
    syncing.value = false
  }
}

const publishing = ref(false)

async function publishReport() {
  if (!props.id) {
    notify.error("Save report first")
    return
  }

  try {
    publishing.value = true

    const res: any = await request(
      `/api/analytics/report-management/${props.id}/publish/`,
      {
        method: "POST",
      }
    )

    notify.success(res?.message || "Report published")

    await loadDetail()
  } catch (err: any) {
    notify.error(
      err?.data?.detail ||
      err?.data?.message ||
      "Failed publish report"
    )
  } finally {
    publishing.value = false
  }
}

const isPublished = computed(
  () => form.status === "Published"
)

onMounted(() => {
  if (canChooseIup.value) fetchMineIUP()
  if (isEdit.value) loadDetail()
  if (!isEdit.value) syncPeriodDates()
})

function addMiningRow() {
  form.mining_rows.push({
    ...emptyMiningRow(form.mining_rows.length + 1),
    source_module: form.mining_source,
  })
}

function removeMiningRow(index: number) {
  form.mining_rows.splice(index, 1)
}

function addMetric() {
  form.metrics.push(emptyMetricRow(form.metrics.length + 1))
}

function removeMetric(index: number) {
  form.metrics.splice(index, 1)
}

function addManpower() {
  form.manpower_rows.push({
    ...emptyManpowerRow(form.manpower_rows.length + 1),
    source_module: form.manpower_source,
  })
}

function removeManpower(index: number) {
  form.manpower_rows.splice(index, 1)
}

function addDocument() {
  form.documents.push(emptyDocumentRow(form.documents.length + 1))
}

function extractApiError(err: any) {
  const data = err?.data

  if (!data) return "Failed save report management"
  if (typeof data === "string") return "Failed save report management"

  const messages: string[] = []

  Object.entries(data).forEach(([field, value]: any) => {
    if (Array.isArray(value)) {
      value.forEach((item: any) => {
        if (typeof item === "string") messages.push(`${field}: ${item}`)
        else if (item && typeof item === "object") {
          Object.entries(item).forEach(([childField, childValue]: any) => {
            const text = Array.isArray(childValue)
              ? childValue.join(", ")
              : String(childValue)

            messages.push(`${field}.${childField}: ${text}`)
          })
        }
      })
    } else {
      messages.push(`${field}: ${String(value)}`)
    }
  })

  return messages.join("\n") || "Failed save report management"
}

function validatePeriodRange() {
  if (!form.iup) {
    notify.error("IUP wajib dipilih")
    return false
  }

  if (!form.period_type) {
    notify.error("Report Type wajib dipilih")
    return false
  }

  if (!form.yearly) {
    notify.error("Year wajib diisi")
    return false
  }

  if (form.period_type === "weekly" && !form.weekly) {
    notify.error("Week wajib diisi untuk weekly report")
    return false
  }

  if (form.period_type === "monthly" && !form.monthly) {
    notify.error("Month wajib diisi untuk monthly report")
    return false
  }

  if (!form.period_start || !form.period_end) {
    notify.error("Period Start dan Period End wajib diisi")
    return false
  }

  const start = new Date(form.period_start)
  const end = new Date(form.period_end)

  if (end < start) {
    notify.error("Period End tidak boleh lebih kecil dari Period Start")
    return false
  }

  return true
}

async function submit() {
  syncPeriodDates()

  if (!validatePeriodRange()) return

  loading.value = true

  const payload = {
    iup: form.iup,

    title: form.title || "Operations Management Report",

    period_type: form.period_type,

    year: form.yearly,
    month: form.period_type === "monthly" ? form.monthly : null,
    week: form.period_type === "weekly" ? form.weekly : null,

    yearly: form.yearly,
    monthly: form.period_type === "monthly" ? form.monthly : null,
    weekly: form.period_type === "weekly" ? form.weekly : null,

    period_start: form.period_start || null,
    period_end: form.period_end || null,

    status: form.status,
    remarks: form.remarks || "",

    mining_rows: form.mining_rows
      .filter(row => String(row.material || "").trim())
      .map((row, index) => ({
        material: row.material,
        plan: row.plan ?? 0,
        actual: row.actual ?? 0,
        achievement: calcAchievement(row.plan, row.actual),
        status: row.status || "STABLE",
        group: row.group || "ORE",
        source_module: row.source_module || "MANUAL",
        is_total: false,
        is_grand_total: false,
        sort_order: row.sort_order || index + 1,
      })),

    metrics: form.metrics
      .filter(item => item.title || item.value || item.description)
      .map((item, index) => ({
        source_module: item.source_module || "MANUAL",
        section: item.section || "SUMMARY",
        title: item.title || "",
        value: item.value ?? 0,
        suffix: item.suffix || "",
        description: item.description || "",
        sort_order: item.sort_order || index + 1,
      })),

    manpower_rows: form.manpower_rows
      .filter(row => row.contractor || row.personnel || row.description)
      .map((row, index) => ({
        source_module: row.source_module || "MANUAL",
        contractor: row.contractor || "",
        personnel: row.personnel ?? 0,
        description: row.description || "",
        sort_order: row.sort_order || index + 1,
      })),

    documents: form.documents
      .filter(doc =>
        !doc.file &&
        (
          doc.external_url ||
          doc.id
        )
      )
      .map((doc, index) => ({
        id: doc.id,
        title: doc.title || "",
        document_date: doc.document_date || null,
        file_name: doc.file_name || "",
        document_type: doc.document_type || "PDF",
        external_url: doc.external_url || "",
        description: doc.description || "",
        sort_order: doc.sort_order || index + 1,
      })),


  }

  console.log("payload", payload)

  try {
    const endpoint = isEdit.value
      ? `/api/analytics/report-management/${props.id}/`
      : "/api/analytics/report-management/"

    const method = isEdit.value ? "PATCH" : "POST"

    const savedReport: any = await request(endpoint, {
      method,
      body: payload,
    })

    const reportId = savedReport?.id || props.id

    if (reportId) {
      await uploadDocumentFiles(String(reportId))
    }

    notify.success(
      isEdit.value
        ? "Management report updated"
        : "Management report created",
    )

    router.push("/report/management")
  } catch (err: any) {
    notify.error(extractApiError(err))
  } finally {
    loading.value = false
  }
}

// Load Production & selling Atuo
function getManagementFilterType() {
  return String(form.period_type || "range").toLowerCase()
}

function getSummaryByPeriod(data: any) {
  const type = String(form.period_type || "").toLowerCase()

  switch (type) {
    case "weekly":
      return data?.weekly || data?.wtd || data?.summary || {}

    case "monthly":
      return data?.monthly || data?.mtd || data?.summary || {}

    case "yearly":
      return data?.yearly || data?.ytd || data?.summary || {}

    case "range":
      return data?.range || data?.summary || {}

    default:
      return data?.summary || data?.all || {}
  }
}

function getBargingLabel() {
  if (form.period_type === "weekly") return "Barging (WTD)"
  if (form.period_type === "monthly") return "Barging (MTD)"
  if (form.period_type === "yearly") return "Barging (YTD)"
  return "Barging"
}

async function autoFillMiningBarging() {
  syncPeriodDates()

  if (!validatePeriodRange()) return

  const filterType = getManagementFilterType()

  try {
    const query = {
      iup_id: form.iup,
      filter_type: filterType,
      yearly: form.yearly,
      monthly: form.monthly,
      weekly: form.weekly,
      period_start: form.period_start,
      period_end: form.period_end,
    }

    const [mining, barging]: any[] = await Promise.all([
      request("/api/analytics/raw/mining/summary/management/", {
        method: "GET",
        query,
      }),
      request("/api/analytics/raw/barging/summary/management/", {
        method: "GET",
        query,
      }),
    ])

    const summary = getSummaryByPeriod(mining)
    const bargingSummary = getSummaryByPeriod(barging)

    const oreMaterials = summary.ore_materials || []
    const nonOreMaterials = summary.non_ore_materials || []

    const oreDetail = oreMaterials
      .map((x: any) => `${x.material}: ${Number(x.actual || 0).toLocaleString()}`)
      .join(" • ")

    const wasteDetail = nonOreMaterials
      .map((x: any) => `${x.material}: ${Number(x.actual || 0).toLocaleString()}`)
      .join(" • ")

    const oreLabel = oreMaterials.length
      ? `Ore (${oreMaterials.map((x: any) => x.material).join("+")})`
      : "Ore"

    const wasteLabel = nonOreMaterials.length
      ? `Waste (${nonOreMaterials.length} Materials)`
      : "Waste"

    const rows = [
      {
        material: oreLabel,
        description: oreDetail,
        plan: Number(summary.total_ore_plan || 0),
        actual: Number(summary.total_ore || 0),
        group: "ORE" as MiningGroup,
        sort_order: 1,
      },
      {
        material: wasteLabel,
        description: wasteDetail,
        plan: Number(summary.total_non_ore_plan || 0),
        actual: Number(summary.total_non_ore || 0),
        group: "WASTE" as MiningGroup,
        sort_order: 2,
      },
      {
        material: getBargingLabel(),
        description: `LIM: ${Number(bargingSummary.total_lim || 0).toLocaleString()} • SAP: ${Number(bargingSummary.total_sap || 0).toLocaleString()}`,
        plan: Number(bargingSummary.total_plan || 0),
        actual: Number(bargingSummary.total_barging || 0),
        group: "BARGING" as MiningGroup,
        sort_order: 3,
      },
    ]

    form.mining_rows = rows.map(row => ({
      ...row,
      status: "STABLE",
      source_module: "AUTO",
      is_total: false,
      is_grand_total: false,
    }))

    notify.success("Mining & Barging auto filled")
  } catch (err: any) {
    notify.error(
      err?.data?.detail ||
      err?.data?.message ||
      "Failed auto fill Mining & Barging",
    )
  }
}

async function autoFillInventory() {
  syncPeriodDates()

  if (!form.iup || !form.period_end) {
    notify.error("Pilih IUP dan period end dulu")
    return
  }

  try {
    const inventory: any = await request(
      "/api/analytics/raw/mining/inventory/management/",
      {
        method: "GET",
        query: {
          iup_id: form.iup,
          cut_date: form.period_end,
        },
      },
    )

    const summary = inventory?.summary || {}

    const inventoryMetrics = [
      {
        source_module: "AUTO",
        section: "INVENTORY",
        title: "Inventory",
        value: Number(summary.total_balance || 0),
        suffix: "t",
        description: `${Number(summary.stockpile_count || 0)} Stockpiles • Avg Ni ${Number(summary.avg_ni || 0)}%`,
        sort_order: 5,
      },
    ]
    form.metrics = [
      ...form.metrics.filter(item => item.section !== "INVENTORY"),
      ...inventoryMetrics,
    ]

    notify.success("Inventory auto filled")
  } catch (err: any) {
    notify.error(
      err?.data?.detail ||
      err?.data?.message ||
      "Failed auto fill Inventory",
    )
  }
}

function onDocumentFileChange(event: Event, doc: any) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  doc.file = file
  doc.file_name = file.name

  const ext = file.name.split(".").pop()?.toLowerCase()

  if (["pdf"].includes(ext || "")) {
    doc.document_type = "PDF"
  } else if (["xls", "xlsx"].includes(ext || "")) {
    doc.document_type = "EXCEL"
  } else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
    doc.document_type = "IMAGE"
  } else {
    doc.document_type = "OTHER"
  }
}

async function removeDocument(index: number) {
  const doc = form.documents[index]

  try {
    if (doc?.id) {
      await request(
        `/api/analytics/report-management-document/${doc.id}/`,
        {
          method: "DELETE",
        },
      )
    }

    form.documents.splice(index, 1)

    notify.success("Document removed")
  } catch (err: any) {
    notify.error(
      err?.data?.detail ||
      err?.data?.message ||
      "Failed remove document",
    )
  }
}

async function uploadDocumentFiles(reportId: string) {
  const docsWithFile = form.documents.filter(doc => doc.file)

  for (const doc of docsWithFile) {
    const formData = new FormData()

    formData.append("report", reportId)
    formData.append("title", doc.title || "")
    formData.append("document_date", doc.document_date || "")
    formData.append("document_type", doc.document_type || "PDF")
    formData.append("description", doc.description || "")
    formData.append("sort_order", String(doc.sort_order || 1))

    if (doc.file) {
      formData.append("file", doc.file)
    }

    if (doc.id) {
      await request(`/api/analytics/report-management-document/${doc.id}/`, {
        method: "PATCH",
        body: formData,
      })
    } else {
      await request("/api/analytics/report-management-document/", {
        method: "POST",
        body: formData,
      })
    }
  }
}

</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ isEdit ? "Edit Management Report" : "Create Management Report" }}
        </h2>
        <p class="text-muted-foreground">
          Create and manage weekly, monthly, yearly, and custom operational reports.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button v-if="isEdit" variant="outline" :disabled="syncing || form.status !== 'Draft'" @click="syncReport" >
          <Database class="mr-1 h-4 w-4" />
           Sync Data
        </Button>

        <Button v-if="isEdit" variant="default" :disabled="publishing || form.status !== 'Draft'" @click="publishReport" >
          <FileText class="mr-1 h-4 w-4" />
          Publish
        </Button>

        <Button variant="outline" @click="router.back()">
          Cancel
        </Button>

        <Button :disabled="loading || form.status === 'Published'" @click="submit">
          {{ loading ? "Saving..." : "Save Draft" }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <div class="col-span-12 space-y-5 xl:col-span-9">
        <div class="rounded-xl border bg-background">
          <div class="border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Report Information
            </h2>
          </div>

          <div class="grid grid-cols-12 gap-4 p-6">
            <div class="col-span-12">
              <Label>Title</Label>
              <Input
                v-model="form.title"
                placeholder="Operations Management Report"
              />
            </div>

            <div class="col-span-12">
              <Label>Remarks</Label>
              <Textarea
                v-model="form.remarks"
                placeholder="Input operational remarks..."
              />
            </div>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-4 py-4">
            <h2 class="text-xl font-semibold">
              Mining & Barging
            </h2>

            <div class="flex items-center gap-3">
              <div class="w-[140px]">
                <Select
                  :model-value="form.mining_source"
                  @update:model-value="async v => {
                    form.mining_source = String(v)

                    if (String(v) === 'AUTO') {
                      await autoFillMiningBarging()
                    } else {
                      form.mining_rows = [
                        {
                          ...emptyMiningRow(),
                          source_module: 'MANUAL',
                        },
                      ]
                    }
                  }"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTO">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" @click="addMiningRow">
                <Plus class="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div class="space-y-4 p-6">
            <Card v-for="(row, index) in form.mining_rows" :key="index">
              <CardContent class="flex flex-wrap items-end gap-4 p-5">
                <div class="w-[120px]">
                  <Label>Group</Label>
                  <Select v-model="row.group">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ORE">Ore</SelectItem>
                      <SelectItem value="WASTE">Waste</SelectItem>
                      <SelectItem value="BARGING">Barging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="min-w-[190px] flex-1">
                  <Label>Material</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Input
                          v-model="row.material"
                          placeholder="Ore (LIM+SAP)"
                        />
                      </TooltipTrigger>

                      <TooltipContent v-if="row.description"side="top" >
                        <div class="max-w-xs text-xs">
                          {{ row.description }}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div class="w-[140px]">
                  <Label>Plan</Label>
                  <Input v-model="row.plan" type="number" placeholder="0" />
                </div>

                <div class="w-[140px]">
                  <Label>Actual</Label>
                  <Input v-model="row.actual" type="number" placeholder="0" />
                </div>

                <div class="w-[100px]">
                  <Label>Ach %</Label>
                  <Input :model-value="calcAchievement(row.plan, row.actual)" readonly disabled/>
                </div>

                <div class="w-[130px]">
                  <Label>Trend</Label>
                  <Select v-model="row.status">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="UP">▲ Up</SelectItem>
                      <SelectItem value="DOWN">▼ Down</SelectItem>
                      <SelectItem value="STABLE">● Stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="destructive" size="icon" class="h-10 w-10"@click="removeMiningRow(index)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Inventory | HSE & Fleet Performance
            </h2>
            <Button size="sm" @click="addMetric">
              <Plus class="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div class="space-y-4 p-6">
            <Card v-for="(item, index) in form.metrics" :key="index">
              <CardContent class="flex flex-wrap items-end gap-4 p-5">
                <div class="w-[140px]">
                  <Label>Section</Label>
                  <Select v-model="item.section">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INVENTORY">INVENTORY</SelectItem>
                      <SelectItem value="HSE">HSE</SelectItem>
                      <SelectItem value="FLEET">FLEET</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="min-w-[160px] flex-1">
                  <Label>Title</Label>
                  <Input v-model="item.title" placeholder="-" />
                </div>

                <div class="w-[120px]">
                  <Label>Value</Label>
                  <Input v-model="item.value" type="number" placeholder="0" />
                </div>

                <div class="w-[70px]">
                  <Label>Suffix</Label>
                  <Input v-model="item.suffix" placeholder="h" />
                </div>

                <div class="min-w-[220px] flex-1">
                  <Label>Description</Label>
                  <Input v-model="item.description" placeholder="-" />
                </div>

                <div class="w-[70px]">
                  <Label>Sort</Label>
                  <Input v-model="item.sort_order" type="number" />
                </div>

                <div class="w-[100px]">
                  <Label>Source</Label>
                  <!-- <Select v-model="item.source_module">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="AUTO">Auto</SelectItem>
                    </SelectContent>
                  </Select> -->
                  <Select
                    v-model="item.source_module"
                    @update:model-value="async v => {
                      item.source_module = String(v)
                      if (item.section === 'INVENTORY' && String(v) === 'AUTO') {
                        await autoFillInventory()
                      }
                    }"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="AUTO">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="destructive" size="icon" class="h-10 w-10" @click="removeMetric(index)" >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Manpower Summary
            </h2>

            <div class="flex items-center gap-3">
              <div class="w-[140px]">
                <Select
                  :model-value="form.manpower_source"
                  @update:model-value="v => {
                    form.manpower_source = String(v)
                    form.manpower_rows.forEach(row => {
                      row.source_module = String(v)
                    })
                  }"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTO">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" @click="addManpower">
                <Plus class="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div class="space-y-4 p-6">
            <Card v-for="(row, index) in form.manpower_rows" :key="index">
              <CardContent class="flex flex-wrap items-end gap-4 p-5">
                <div class="min-w-[220px] flex-1">
                  <Label>Contractor</Label>
                  <Input v-model="row.contractor" placeholder="Company" />
                </div>

                <div class="w-[160px]">
                  <Label>Personnel</Label>
                  <Input v-model="row.personnel" type="number" placeholder="0" />
                </div>

                <div class="min-w-[240px] flex-1">
                  <Label>Description</Label>
                  <Input v-model="row.description" placeholder="-" />
                </div>

                <Button variant="destructive" size="icon" class="h-10 w-10" @click="removeManpower(index)" >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Documents & Attachments
            </h2>

            <Button size="sm" @click="addDocument">
              <Plus class="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div class="space-y-4 p-6">
            <Card v-for="(doc, index) in form.documents" :key="index">
              <CardContent class="flex flex-wrap items-end gap-4 p-5">
                <div class="min-w-[220px] flex-1">
                  <Label>Title</Label>
                  <Input v-model="doc.title" placeholder="Management Report" />
                </div>

                <div class="w-[180px]">
                  <Label>Date</Label>
                  <DatePicker
                    v-model="doc.document_date"
                    :single="true"
                    class="w-full"
                  />
                </div>

                <div class="min-w-[260px] flex-1">
                  <Label>Attachment</Label>
                  <Input type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.doc,.docx"  @change="(e: Event) => onDocumentFileChange(e, doc)"/>

                  <p v-if="doc.file_name" class="mt-1 text-xs text-muted-foreground" >
                    {{ doc.file_name }}
                  </p>
                </div>

                <div class="w-[140px]">
                  <Label>Type</Label>
                  <Select v-model="doc.document_type">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="EXCEL">EXCEL</SelectItem>
                      <SelectItem value="IMAGE">IMAGE</SelectItem>
                      <SelectItem value="LINK">LINK</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="min-w-[240px] flex-1">
                  <Label>Description</Label>
                  <Input v-model="doc.description" placeholder="Management Report" />
                </div>

                <Button variant="destructive" size="icon" class="h-10 w-10 "@click="removeDocument(index)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div class="col-span-12 space-y-5 xl:col-span-3">
        <div class="rounded-xl border bg-background">
          <div class="border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Report Settings
            </h2>
          </div>

          <div v-if="canChooseIup" class="space-y-3 p-3">
            <Label>IUP</Label>
            <Select
              :model-value="form.iup != null ? String(form.iup) : ''"
              :disabled="mineIUPLoading || !canMutate"
              @update:model-value="v => form.iup = v ? Number(v) : undefined"
            >
              <SelectTrigger>
                <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
              </SelectTrigger>

              <SelectContent ref="mineIUPContentRef" class="max-h-80 overflow-auto" @scroll="onMineIUPScroll" >
                <SelectGroup>
                  <div class="sticky top-0 z-10 border-b bg-background p-2">
                    <Input
                      v-model="mineIUPSearch"
                      placeholder="Search IUP..."
                      class="h-8"
                      @input="onMineIUPSearch(mineIUPSearch)"
                      @keydown.stop
                      @click.stop
                    />
                  </div>

                  <SelectItem v-for="o in mineIUPOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="mineIUPLoading" class="p-2 text-sm text-muted-foreground">
                    Loading...
                  </div>

                  <div v-if="!mineIUPLoading && mineIUPOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-3 p-3">
            <div>
              <Label>Report Type</Label>
              <Select v-model="form.period_type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="range">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year</Label>
              <Input v-model="form.yearly" type="number" placeholder="2026" />
            </div>

            <div v-if="form.period_type === 'monthly'">
              <Label>Month</Label>
              <Input v-model="form.monthly" type="number" min="1" max="12" placeholder="1 - 12"
              />
            </div>

            <!-- <div v-if="form.period_type === 'weekly'"> -->
              <!-- <Label>Week</Label>
              <Input
                v-model="form.weekly"
                type="number"
                min="1"
                max="53"
                placeholder="1 - 53"
              />
            </div> -->

            <div v-if="form.period_type === 'weekly'">
              <Label>Week</Label>

              <Select
                :model-value="form.weekly ? String(form.weekly) : ''"
                @update:model-value="v => form.weekly = Number(v)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Week" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem
                    v-for="week in 53"
                    :key="week"
                    :value="String(week)"
                  >
                    Week {{ week }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Period Start</Label>
              <DatePicker v-model="form.period_start" :single="true" class="w-full":disabled="form.period_type !== 'range'"/>
            </div>

            <div>
              <Label>Period End</Label>
              <DatePicker v-model="form.period_end" :single="true" class="w-full":disabled="form.period_type !== 'range'"/>
            </div>

            <div>
              <Label>Status</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Preview
            </h2>
          </div>

          <div class="space-y-3 p-6">
            <div class="rounded-lg border p-4">
              <p class="font-semibold">
                {{ form.title || "Operations Management Report" }}
              </p>

              <p class="text-sm text-muted-foreground">
                {{ form.period_type }} • {{ periodLabel() }} • {{ form.status }}
              </p>

              <p class="mt-2 text-xs text-muted-foreground">
                {{ form.period_start || "-" }} to {{ form.period_end || "-" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>