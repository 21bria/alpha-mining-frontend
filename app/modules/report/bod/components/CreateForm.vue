<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { useRouter } from "#app"
import { useDebounceFn } from "@vueuse/core"
import { Plus, Trash2 } from "lucide-vue-next"
import DatePicker from "@/components/ui/date-picker/DatePicker.vue"

import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"
type MiningGroup = "ORE" | "WASTE" | "BARGING" | "TOTAL"

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
  weekly_plan: undefined as number | undefined,
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
  year: new Date().getFullYear(),
  week: undefined as number | undefined,
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

function calcAchievement(plan?: number, actual?: number) {
  if (!plan || !actual) return 0
  return Number(((actual / plan) * 100).toFixed(1))
}

function getWasteLabel(nonOreMaterials: any[] = []) {
  const wasteMap: Record<string, string> = {
    topsoil: "TS",
    ob: "OB",
    waste: "W",
    quarry: "Q",
    ballast: "B",
    biomass: "BIO",
  }

  const activeCodes = nonOreMaterials
    .filter(item => Number(item?.actual || 0) > 0)
    .map(item => wasteMap[String(item?.material || "").toLowerCase()])
    .filter(Boolean)

  return activeCodes.length
    ? `Waste (${activeCodes.join("+")})`
    : "Waste"
}

async function loadDetail() {
  if (!props.id) return

  try {
    const data: any = await request(`/api/analytics/bod-weekly-report/${props.id}/`, {
      method: "GET",
    })

    Object.assign(form, {
      iup: data.iup,
      title: data.title || "",
      year: data.year || new Date().getFullYear(),
      week: data.week,
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
          weekly_plan: Number(row.weekly_plan || 0),
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
    notify.error(err?.data?.detail || err?.data?.message || "Failed load BOD report")
  }
}

onMounted(() => {
  if (canChooseIup.value) fetchMineIUP()
  if (isEdit.value) loadDetail()
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

// function removeDocument(index: number) {
//   form.documents.splice(index, 1)
// }

function extractApiError(err: any) {
  const data = err?.data

  if (!data) return "Failed save BOD report"
  if (typeof data === "string") return "Failed save BOD report"

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

  return messages.join("\n") || "Failed save BOD report"
}

async function submit() {
  if (!validatePeriodRange()) return
  loading.value = true

  const {
    mining_source,
    manpower_source,
    ...cleanForm
  } = form

  const payload = {
    ...cleanForm,

    iup: form.iup,
    title: form.title || "",
    week: form.week || undefined,
    period_start: form.period_start || null,
    period_end: form.period_end || null,

    mining_rows: form.mining_rows
      .filter(row => String(row.material || "").trim())
      .map((row, index) => ({
        material: row.material,
        weekly_plan: row.weekly_plan ?? 0,
        actual: row.actual ?? 0,
        achievement: calcAchievement(row.weekly_plan, row.actual),
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

  try {
    const endpoint = isEdit.value
      ? `/api/analytics/bod-weekly-report/${props.id}/`
      : "/api/analytics/bod-weekly-report/"

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
        ? "Weekly BOD report updated"
        : "Weekly BOD report created",
    )

    router.push("/report/bod")
  } catch (err: any) {
    notify.error(extractApiError(err))

  } finally {
    loading.value = false
  }
}

async function autoFillMiningBarging() {
  if (!validatePeriodRange()) return

  if (!form.iup || !form.period_start || !form.period_end) {
    notify.error("Pilih IUP, Period Start, dan Period End dulu")
    return
  }

  try {
    const [mining, barging]: any[] = await Promise.all([
      request("/api/analytics/raw/mining/summary/weekly/", {
        method: "GET",
        query: {
          iup_id: form.iup,
          period_start: form.period_start,
          period_end: form.period_end,
        },
      }),
      request("/api/analytics/raw/barging/summary/weekly/", {
        method: "GET",
        query: {
          iup_id: form.iup,
          period_start: form.period_start,
          period_end: form.period_end,
        },
      }),
    ])

    const summary = mining?.summary || {}
    const wasteLabel = getWasteLabel(summary.non_ore_materials || [])

    const rows = [
      {
        material: "Ore (LIM+SAP)",
        weekly_plan: Number(summary.total_ore_plan || 0),
        actual: Number(summary.total_ore || 0),
        group: "ORE" as MiningGroup,
        sort_order: 1,
      },
      {
        material: wasteLabel,
        weekly_plan: Number(summary.total_non_ore_plan || 0),
        actual: Number(summary.total_non_ore || 0),
        group: "WASTE" as MiningGroup,
        sort_order: 2,
      },
      {
        material: "Barging (WTD)",
        weekly_plan: 0,
        actual: Number(barging?.total_barging || 0),
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
    notify.error(err?.data?.detail || err?.data?.message || "Failed auto fill Mining & Barging")
  }
}

function validatePeriodRange() {
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

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  ) + 1

  if (diffDays > 7) {
    notify.error("Periode maksimal 7 hari")
    return false
  }
  return true
}

// Upload file:
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
        `/api/analytics/bod-weekly-document/${doc.id}/`,
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
      await request(`/api/analytics/bod-weekly-document/${doc.id}/`, {
        method: "PATCH",
        body: formData,
      })
    } else {
      await request("/api/analytics/bod-weekly-document/", {
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
          Create Weekly BOD
        </h2>
        <p class="text-muted-foreground">
          Create and manage weekly board operational reports.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.back()">
          Cancel
        </Button>
        <Button :disabled="loading" @click="submit">
          {{ loading ? "Saving..." : "Submit" }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <div class="col-span-12 space-y-5 xl:col-span-9">
        <div class="rounded-xl border bg-background">
          <div class="border-b px-6 py-4">
            <h2 class="text-xl font-semibold">Weekly Report Information</h2>
          </div>
          <div class="grid grid-cols-12 gap-4 p-6">
            <div class="col-span-12">
              <Label>Title</Label>
              <Input v-model="form.title" placeholder="Week-01" />
            </div>
            <div class="col-span-12">
              <Label>Remarks</Label>
              <Textarea v-model="form.remarks" placeholder="Input weekly operational remarks..." />
            </div>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-4 py-4">
            <h2 class="text-xl font-semibold">
              Mining & Barging
            </h2>
            <div class="flex items-center gap-3">
              <!-- GLOBAL SOURCE -->
              <div class="w-[140px]">
                <Select :model-value="form.mining_source" @update:model-value="async v => {
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
                }">
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
                  <Input v-model="row.material" placeholder="Ore (LIM+SAP)" />
                </div>
                <div class="w-[140px]">
                  <Label>Plan</Label>
                  <Input v-model="row.weekly_plan" type="number" placeholder="0" />
                </div>
                <div class="w-[140px]">
                  <Label>Actual</Label>
                  <Input v-model="row.actual" type="number" placeholder="0" />
                </div>
                <div class="w-[90px]">
                  <Label>Achievement</Label>
                  <Input :model-value="calcAchievement(row.weekly_plan, row.actual)" readonly disabled />
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
                <Button variant="destructive" size="icon" class="h-10 w-10" @click="removeMiningRow(index)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-xl font-semibold">
              Summary | HSE & Fleet Performance
            </h2>
            <Button size="sm" @click="addMetric">
              <Plus class="mr-2 h-4 w-4" />Add
            </Button>
          </div>

          <div class="space-y-4 p-6">
            <Card v-for="(item, index) in form.metrics" :key="index">
              <CardContent class="flex flex-wrap items-end gap-4 p-5">
                <div class="w-[110px]">
                  <Label>Section</Label>
                  <Select v-model="item.section">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUMMARY">SUMMARY</SelectItem>
                      <SelectItem value="HSE">HSE</SelectItem>
                      <SelectItem value="FLEET">FLEET</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="min-w-[220px] flex-1">
                  <Label>Title</Label>
                  <Input v-model="item.title" placeholder="-" />
                </div>
                <div class="w-[90px]">
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
                <div class="w-[97px]">
                  <Label>Source</Label>
                  <Select v-model="item.source_module">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="AUTO">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="destructive" size="icon" class="h-10 w-10" @click="removeMetric(index)">
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
                <Select :model-value="form.manpower_source" @update:model-value="v => {
                  form.manpower_source = String(v)
                  form.manpower_rows.forEach(row => {
                    row.source_module = String(v)
                  })
                }">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL"> Manual </SelectItem>
                    <SelectItem value="AUTO"> Auto </SelectItem>
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
                  <Input v-model="row.contractor" placeholder="PT. KAWI" />
                </div>
                <div class="w-[160px]">
                  <Label>Personnel</Label>
                  <Input v-model="row.personnel" type="number" placeholder="0" />
                </div>
                <div class="min-w-[240px] flex-1">
                  <Label>Description</Label>
                  <Input v-model="row.description" placeholder="-" />
                </div>
                <Button variant="destructive" size="icon" class="h-10 w-10" @click="removeManpower(index)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="rounded-xl border bg-background">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <h2 class="text-xl font-semibold">Documents & Attachments</h2>
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
                  <Input v-model="doc.title" placeholder="Weekly BOD Report" />
                </div>
                <div class="w-[180px]">
                  <Label>Date</Label>
                  <DatePicker v-model="doc.document_date" :single="true" class="w-full" />
                </div>
                <div class="min-w-[260px] flex-1">
                  <Label>Attachment</Label>
                  <Input type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.doc,.docx"
                    @change="(e: Event) => onDocumentFileChange(e, doc)" />
                  <p v-if="doc.file_name" class="mt-1 text-xs text-muted-foreground hidden">
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
                  <Input v-model="doc.description" placeholder="Weekly Board Report" />
                </div>
                <Button variant="destructive" size="icon" class="h-10 w-10" @click="removeDocument(index)">
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
            <h2 class="text-xl font-semibold">Report Settings</h2>
          </div>

          <div v-if="canChooseIup" class="space-y-3 p-3 grid">
            <Select :model-value="form.iup != null ? String(form.iup) : ''"
              @update:model-value="v => form.iup = v ? Number(v) : undefined" :disabled="mineIUPLoading || !canMutate">
              <SelectTrigger>
                <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
              </SelectTrigger>
              <SelectContent ref="mineIUPContentRef" class="max-h-80 overflow-auto" @scroll="onMineIUPScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 border-b bg-background p-2">
                    <Input v-model="mineIUPSearch" placeholder="Search IUP..." class="h-8"
                      @input="onMineIUPSearch(mineIUPSearch)" @keydown.stop @click.stop />
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
              <Label>Year</Label>
              <Input v-model="form.year" type="number" placeholder="2026" />
            </div>
            <div>
              <Label>Week</Label>
              <Input v-model="form.week" type="number" placeholder="01" />
            </div>
            <div>
              <Label>Period Start</Label>
              <DatePicker v-model="form.period_start" :single="true" class="w-full" />
            </div>
            <div>
              <Label>Period End</Label>
              <DatePicker v-model="form.period_end" :single="true" class="w-full" />
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
            <h2 class="text-xl font-semibold">Preview</h2>
          </div>
          <div class="space-y-3 p-6">
            <div class="rounded-lg border p-4">
              <p class="font-semibold">
                {{ form.title || "Operations Scorecard" }}
              </p>
              <p class="text-sm text-muted-foreground">
                Week {{ form.week || "19" }} • {{ form.status }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>