<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from "vue"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import LookupSelect from "@/components/data-table/LookupSelect.vue"
import MultiLookupFilter from "@/components/data-table/MultiLookupFilter.vue"
import { parseDate } from "@internationalized/date"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

const { request } = useApi()

type FilterSchema =
  | {
      kind: "text"
      key: string
      label: string
      placeholder?: string
    }
  | {
      kind: "date"
      key: string
      label: string
    }
  | {
      kind: "daterange"
      label: string
      startKey: string
      endKey: string
    }
  | {
      kind: "static-select"
      key: string
      label: string
      options: { label: string; value: string | number }[]
      multiple?: boolean
    }
  | {
      kind: "select"
      key: string
      label: string
      endpoint: string
      multiple?: boolean
      depends?: string[]
    }

type AsyncExportResponse = {
  job_id: string
  status?: string
}

type AsyncExportJob = {
  id: string
  status: "pending" | "processing" | "done" | "failed"
  progress?: number
  file?: string | null
  file_url?: string | null
  error?: string | null
}

const props = defineProps<{
  open: boolean
  endpoint: string
  title?: string
  filtersSchema?: FilterSchema[]
  method?: "GET" | "POST"
  fileName?: string
  mode?: "direct" | "async"
  jobStatusUrl?: string
  jobDownloadUrl?: string
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "exported"): void
}>()

const notify = useNotify()
const loading = ref(false)
const progress = ref(0)
const statusText = ref("")
const local = ref<Record<string, any>>({})
const downloadUrl = ref("")
const finishedJobId = ref("")

let pollingTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function resetExportState() {
  loading.value = false
  progress.value = 0
  statusText.value = ""
  downloadUrl.value = ""
  finishedJobId.value = ""
  stopPolling()
}

function close() {
  stopPolling()
  emit("update:open", false)
}

function isMulti(f: FilterSchema) {
  return (f.kind === "select" || f.kind === "static-select") && f.multiple === true
}

function initValueForFilter(f: FilterSchema) {
  if (f.kind === "daterange") return null
  if (isMulti(f)) return []
  return null
}

function getKey(f: FilterSchema) {
  return f.kind === "daterange" ? `${f.startKey}_${f.endKey}` : f.key
}

function getDependsObject(keys?: string[]) {
  if (!keys?.length) return undefined
  return Object.fromEntries(keys.map((k) => [k, local.value[k]]))
}

function isDependsMissing(keys?: string[]) {
  return !!keys?.some((k) => !local.value[k])
}

watch(
  () => props.filtersSchema,
  () => {
    const next: Record<string, any> = {}
    for (const f of props.filtersSchema ?? []) {
      if (f.kind === "daterange") {
        next[f.startKey] = null
        next[f.endKey] = null
      } else {
        next[f.key] = initValueForFilter(f)
      }
    }
    local.value = next
  },
  { immediate: true }
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      stopPolling()
      loading.value = false
    } else {
      progress.value = 0
      statusText.value = ""
      downloadUrl.value = ""
      finishedJobId.value = ""
    }
  }
)

onBeforeUnmount(() => {
  stopPolling()
})

function normalizeFilters(obj: Record<string, any>) {
  const out: Record<string, any> = {}

  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      out[k] = v.length ? v.join(",") : undefined
    } else {
      out[k] = v ?? undefined
    }
  }

  return out
}

function formatJobUrl(template: string, jobId: string) {
  return template.replace("{jobId}", jobId)
}

function parseISODate(value?: string | null) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

const dateRangeState = computed(() => {
  const rangeFilter = (props.filtersSchema ?? []).find(
    (f): f is Extract<FilterSchema, { kind: "daterange" }> => f.kind === "daterange"
  )

  if (!rangeFilter) {
    return {
      required: false,
      hasStart: true,
      hasEnd: true,
      isComplete: true,
      exceedsMaxRange: false,
      message: "",
    }
  }

  const startValue = local.value[rangeFilter.startKey]
  const endValue = local.value[rangeFilter.endKey]

  const hasStart = !!startValue
  const hasEnd = !!endValue
  const isComplete = hasStart && hasEnd

  if (!hasStart && !hasEnd) {
    return {
      required: true,
      hasStart,
      hasEnd,
      isComplete: false,
      exceedsMaxRange: false,
      message: "Pilih tanggal awal dan akhir terlebih dulu.",
    }
  }

  if (!isComplete) {
    return {
      required: true,
      hasStart,
      hasEnd,
      isComplete: false,
      exceedsMaxRange: false,
      message: "Tanggal awal dan akhir harus diisi lengkap.",
    }
  }

  const startDate = parseISODate(startValue)
  const endDate = parseISODate(endValue)

  if (!startDate || !endDate) {
    return {
      required: true,
      hasStart,
      hasEnd,
      isComplete: false,
      exceedsMaxRange: false,
      message: "Format tanggal tidak valid.",
    }
  }

  if (endDate < startDate) {
    return {
      required: true,
      hasStart,
      hasEnd,
      isComplete: true,
      exceedsMaxRange: true,
      message: "Tanggal akhir tidak boleh lebih kecil dari tanggal awal.",
    }
  }

  const maxEndDate = addMonths(startDate, 3)
  const exceedsMaxRange = endDate > maxEndDate

  return {
    required: true,
    hasStart,
    hasEnd,
    isComplete: true,
    exceedsMaxRange,
    message: exceedsMaxRange
      ? "Maksimal range export adalah 3 bulan dari tanggal awal."
      : "",
  }
})

const isExportDisabled = computed(() => {
  return (
    loading.value ||
    !dateRangeState.value.isComplete ||
    dateRangeState.value.exceedsMaxRange
  )
})

async function exportData() {
  if (isExportDisabled.value) {
    if (dateRangeState.value.message) {
      notify.error(dateRangeState.value.message)
    }
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = "Preparing export..."
  downloadUrl.value = ""
  finishedJobId.value = ""
  stopPolling()

  try {
    const payload = normalizeFilters(local.value)
    const method = props.method ?? "GET"
    const mode = props.mode ?? "direct"

    if (mode === "async") {
      let res: AsyncExportResponse

      if (method === "POST") {
        res = await request<AsyncExportResponse>(props.endpoint, {
          method: "POST",
          body: payload,
        })
      } else {
        res = await request<AsyncExportResponse>(props.endpoint, {
          method: "GET",
          query: payload,
        })
      }

      const jobId = res?.job_id
      if (!jobId) {
        throw new Error("job_id not found from export response")
      }

      if (!props.jobStatusUrl) {
        throw new Error("jobStatusUrl is required for async mode")
      }

      notify.success("Export queued successfully")
      statusText.value = "Export is being processed..."
      progress.value = 10
      finishedJobId.value = jobId

      pollingTimer = setInterval(async () => {
        try {
          const statusUrl = formatJobUrl(props.jobStatusUrl!, jobId)
          const job = await request<AsyncExportJob>(statusUrl, { method: "GET" })

          progress.value = Number(job?.progress ?? 0)

          if (job.status === "pending") {
            statusText.value = "Waiting in queue..."
            return
          }

          if (job.status === "processing") {
            statusText.value = `Processing... ${job.progress ?? 0}%`
            return
          }

          if (job.status === "done") {
            stopPolling()

            progress.value = 100
            loading.value = false
            statusText.value = "Export completed. File is ready to download."

            downloadUrl.value =
              job.file_url ||
              (props.jobDownloadUrl ? formatJobUrl(props.jobDownloadUrl, jobId) : "")

            notify.success("Export file is ready")
            emit("exported")
            return
          }

          if (job.status === "failed") {
            stopPolling()
            loading.value = false
            statusText.value = job.error || "Export failed"
            notify.error(job.error || "Export failed")
          }
        } catch (err: any) {
          stopPolling()
          loading.value = false
          statusText.value =
            err?.data?.detail || err?.message || "Failed to check export status"
          notify.error(statusText.value)
        }
      }, 2000)

      return
    }

    let blob: Blob

    if (method === "POST") {
      blob = await request<Blob>(props.endpoint, {
        method: "POST",
        body: payload,
        responseType: "blob",
      })
    } else {
      blob = await request<Blob>(props.endpoint, {
        method: "GET",
        query: payload,
        responseType: "blob",
      })
    }

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = props.fileName ?? "export.xlsx"
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)

    notify.success("Export started successfully")
    emit("exported")
    close()
  } catch (e: any) {
    loading.value = false
    statusText.value = e?.data?.detail || e?.message || "Export failed"
    notify.error(statusText.value)
  } finally {
    if ((props.mode ?? "direct") === "direct") {
      loading.value = false
    }
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ props.title || "Export Data" }}
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <template v-if="(props.filtersSchema ?? []).length">
          <template v-for="f in props.filtersSchema" :key="getKey(f)">
            <div v-if="f.kind === 'text'" class="grid gap-2">
              <label class="text-sm font-medium">{{ f.label }}</label>
              <input
                v-model="local[f.key]"
                :placeholder="f.placeholder ?? f.label"
                class="h-9 rounded-md border bg-background px-3 text-sm"
              />
            </div>

            <div v-else-if="f.kind === 'daterange'" class="grid gap-3">
              <label class="text-sm font-medium">{{ f.label }}</label>

              <div class="grid gap-2">
                <label class="text-xs text-muted-foreground">From Date</label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="h-9 w-full justify-start text-left font-normal"
                      :class="!local[f.startKey] && 'text-muted-foreground'"
                    >
                      <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                      <span>{{ local[f.startKey] || "Pick start date" }}</span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      :model-value="local[f.startKey] ? parseDate(local[f.startKey]) : undefined"
                      @update:model-value="(v:any) => {
                        if (!v) return
                        local[f.startKey] = `${v.year}-${String(v.month).padStart(2,'0')}-${String(v.day).padStart(2,'0')}`
                      }"
                      initial-focus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div class="grid gap-2">
                <label class="text-xs text-muted-foreground">To Date</label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="h-9 w-full justify-start text-left font-normal"
                      :class="!local[f.endKey] && 'text-muted-foreground'"
                    >
                      <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                      <span>{{ local[f.endKey] || "Pick end date" }}</span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent class="w-auto p-0">
                    <Calendar
                      :model-value="local[f.endKey] ? parseDate(local[f.endKey]) : undefined"
                      @update:model-value="(v:any) => {
                        if (!v) return
                        local[f.endKey] = `${v.year}-${String(v.month).padStart(2,'0')}-${String(v.day).padStart(2,'0')}`
                      }"
                      initial-focus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div v-else-if="f.kind === 'select' && !f.multiple" class="grid gap-2 pt-1 w-full">
              <label class="text-sm font-medium">{{ f.label }}</label>
              <LookupSelect
                v-model="local[f.key]"
                variant="field"
                :label="f.label"
                :endpoint="f.endpoint"
                :depends="getDependsObject(f.depends)"
                :disabled="loading || isDependsMissing(f.depends)"
              />
            </div>

            <div v-else-if="f.kind === 'select' && f.multiple" class="grid gap-2">
              <label class="text-sm font-medium">{{ f.label }}</label>
              <MultiLookupFilter
                v-model="local[f.key]"
                :title="f.label"
                :endpoint="f.endpoint"
                :depends="getDependsObject(f.depends)"
                :disabled="loading || isDependsMissing(f.depends)"
              />
            </div>

            <div v-else-if="f.kind === 'static-select'" class="grid gap-2">
              <label class="text-sm font-medium">{{ f.label }}</label>
              <select
                v-model="local[f.key]"
                class="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option :value="null">All</option>
                <option v-for="o in f.options" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </div>
          </template>
        </template>

        <div v-else class="text-sm text-muted-foreground">
          No filters. Export all data?
        </div>

        <div v-if="loading && props.mode === 'async'" class="space-y-2 rounded-md border p-3">
          <div class="text-sm font-medium">{{ statusText }}</div>
          <div class="h-2 w-full overflow-hidden rounded bg-muted">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <div class="text-xs text-muted-foreground">{{ progress }}%</div>
        </div>

        <div
          v-if="downloadUrl && !loading"
          class="space-y-3 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30"
        >
          <div class="text-sm font-medium text-green-700 dark:text-green-300">
            File export sudah siap.
          </div>

          <div v-if="finishedJobId" class="text-xs text-muted-foreground break-all">
            Job ID: {{ finishedJobId }}
          </div>

         <div class="pt-2">
          <div class="ml-auto flex w-fit items-center gap-3">
            <Button
              variant="outline"
              class="relative z-10 shrink-0"
              @click="close"
            >
              Close
            </Button>

            <Button as-child class="shrink-0">
              <a :href="downloadUrl" target="_blank" rel="noopener noreferrer">
                <Icon name="i-lucide-download" class="mr-2 h-4 w-4" />
                Download File
              </a>
            </Button>
          </div>
        </div>

        </div>
      </div>

    <div
        v-if="dateRangeState.message && !downloadUrl"
        class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"
      >
        {{ dateRangeState.message }}
      </div>

      <DialogFooter v-if="!downloadUrl" class="flex gap-2">
        <Button variant="outline" @click="close" :disabled="loading">
          Cancel
        </Button>
        <Button :disabled="isExportDisabled" @click="exportData">
          {{ loading ? "Exporting..." : "Export" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>