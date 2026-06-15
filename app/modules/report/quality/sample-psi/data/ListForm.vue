<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"

import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import {
  MapPinCheck,
  ClipboardCopy,
  CheckCircle2,
  AlertCircle,
} from "lucide-vue-next"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import ExportDialog from "@/components/global/ExportDialog.vue"

import { getSampleDomeColumns, type SampleDomeRow } from "@/modules/report/quality/sample-psi/data/columns"
import { samplePsiConfig } from "@/modules/report/quality/sample-psi/data/table"
import { samplePsiFilters } from "@/modules/report/quality/sample-psi/data/filters"
import { buildExportSchema } from "@/modules/report/quality/sample-psi/data/export"
import { useCurrentRole } from "@/composables/useCurrentRole"


const { currentRole } = useCurrentRole()

type ApiList<T> = {
  count: number
  results: T[]
}


const { request } = useApi()
const notify = useNotify()

const rows = ref<SampleDomeRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(samplePsiConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<SampleDomeRow>>(
  () => `sample-dome:${JSON.stringify(query.value)}`,
  () => request(samplePsiConfig.endpoint, { method: "GET", query: query.value }),
  { server: false }
)

watchEffect(() => {
  const results = data.value?.results ?? []
  const count = data.value?.count ?? 0

  rows.value = results
  total.value = count
  totalPages.value = Math.max(1, Math.ceil(count / pageSize.value))
})

const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  refresh()
}, 350)

function onApply({ search: s, filters }: any) {
  search.value = s ?? ""
  serverFilters.value = { ...(filters ?? {}) }
  page.value = 1
  refresh()
}

function onReset() {
  search.value = ""
  serverFilters.value = { ...(samplePsiConfig.defaultQuery ?? {}) }
  ordering.value = null
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) {
    ordering.value = null
  } else {
    ordering.value = (dir === "desc" ? "-" : "") + key
  }
  page.value = 1
  refresh()
}
// table columns
const columns = computed(() =>
  getSampleDomeColumns()
)

// export
const exportOpen = ref(false)
function handleExport() {
  exportOpen.value = true
}

// summary
async function fetchSummary() {
  return await request('/api/analytics/sample-psi/summary/', {
    method: 'GET',
    query: query.value,
  })
}

const summary = ref({
  total_tonnage: 0,
  total_sample: 0,
  total_assay: 0,
  difference: 0,
})

async function loadSummary() {
  try {
    const res = await fetchSummary()

    summary.value = {
      total_tonnage: res.total_tonnage ?? 0,
      total_sample: res.total_sample ?? 0,
      total_assay: res.total_assay ?? 0,
      difference: res.difference ?? 0,
    }
  } catch (e) {
    console.warn("Gagal load summary", e)
  }
}
const loadSummaryDebounced = useDebounceFn(loadSummary, 300)

watch(query, () => {
  loadSummaryDebounced()
}, { deep: true })

onMounted(() => {
  loadSummary()
})

watchEffect(() => {
  if (error.value) {
    notify.error((error.value as any)?.message || "Failed to load data")
  }
})

watch(error, (v) => {
  if (v) {
    notify.error((v as any)?.message || "Failed to load data")
  }
})

</script>

<template>
<div class="space-y-4">
  <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-normal tracking-tight">
          Samples of psi data
          <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage samples of psi records efficiently.
        </p>
      </div>

    <!-- summary -->
    <div class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-4 xl:w-auto">
        <!-- Sample -->
        <div class="px-5 py-4 min-w-[150px]">
          <div class="flex items-center gap-2">
            <MapPinCheck class="h-4 w-4 text-orange-500" />
            <p class="text-sm text-muted-foreground">Tonnage</p>
          </div>
          <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.total_tonnage) || 0 }}
          </p>
        </div>
        <!-- Sample -->
        <div class="px-5 py-4 min-w-[150px]">
          <div class="flex items-center gap-2">
            <ClipboardCopy class="h-4 w-4 text-blue-500" />
            <p class="text-sm text-muted-foreground">Sample</p>
          </div>
          <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.total_sample) || 0 }}
          </p>
        </div>
        <!-- Released -->
        <div class="border-t px-5 py-4 min-w-[150px] sm:border-l sm:border-t-0">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="h-4 w-4 text-green-500" />
            <p class="text-sm text-muted-foreground">Released</p>
          </div>
          <p class="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
            {{ formatShortNumber(summary.total_assay) || 0 }}
          </p>
        </div>
      <!-- Pending -->
       <div class="border-t px-5 py-4 min-w-[150px] sm:border-l sm:border-t-0">
          <div class="flex items-center gap-2">
            <AlertCircle class="h-4 w-4":class=" summary.difference > 0? 'text-red-500': 'text-green-500'"/>
            <p class="text-sm text-muted-foreground">Pending</p>
          </div>
          <p
            class="mt-1 text-lg font-semibold" 
            :class="summary.difference > 0 ? 'text-red-600 dark:text-red-400': 'text-green-600 dark:text-green-400'"
          >
          {{ formatShortNumber(summary.difference) || 0 }}
          </p>
      </div>
      
    </div>

  </div>

  <DataTableMaster 
    :columns="columns" 
    :data="rows" 
    :total="total" 
    :totalPages="totalPages" 
    :page="page"
    :pageSize="pageSize" 
    :search="search" 
    :loading="pending" 
    :filtersSchema="samplePsiFilters" 
    :showAdd="false"
    :showImport="false"
    :showExport="true" 
    :showDownloadTemplate="false" 
    :showSyncData="false"
    :showBulkDelete="false"
    :showRangeDelete="false"
    @update:search="(v) => { search = v; debouncedSearch() }" 
    @applyFilters="onApply" 
    @resetFilters="onReset"
    @changePage="(v) => { page = v; refresh() }"
    @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
    @changeSorting="onSort"
    @export="handleExport" 
  /> 
    
  <ExportDialog
    v-model:open="exportOpen"
    title="Export Dome Sample"
    :filtersSchema="buildExportSchema(currentRole)"
    endpoint="/api/analytics/sample-dome/export/"
    method="GET"
    mode="async"
    jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
  />

  <div v-if="error" class="text-sm text-destructive">
    {{ (error as any)?.message || "Failed to load data" }}
  </div>

</div>
</template>