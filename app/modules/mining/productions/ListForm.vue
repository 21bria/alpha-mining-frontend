<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import ImportDialog from "@/components/import/ImportDialog.vue"
import DeleteRangeDialog from "@/components/global/DeleteRangeDialog.vue"
import ExportDialog from "@/components/global/ExportDialog.vue"
import { getProductionsColumns, type ProductionsRow } from "@/modules/mining/productions/columns"
import { productionsConfig, productionsCRUDConfig } from "@/modules/mining/productions/table"
import { productionsFilters } from "@/modules/mining/productions/filters"
import { buildExportSchema } from "@/modules/mining/productions/export"
import { useCurrentRole } from "@/composables/useCurrentRole"

const  {currentRole}  = useCurrentRole()
const userRole = ref<UserRole>("SYSTEM")
  
type ApiList<T> = {
  count: number
  results: T[]
}
type ProductionPayload = {
  id?: number | string
  iup?: number | null
  date_production: string | null
}

type ProductionDetail = {
  id?: number | string
  iup?: number | null
  date_production?: string | null
  shift?: string | null
  [key: string]: any
}



const { request } = useApi()
const notify = useNotify()

const rows = ref<ProductionsRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(productionsConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<ProductionsRow>>(
  () => `productions-mining:${JSON.stringify(query.value)}`,
  () => request(productionsConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(productionsConfig.defaultQuery ?? {}) }
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

// dialog state
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<ProductionDetail | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

// delete state
const deleteOpen = ref(false)
const selectedDelete = ref<ProductionsRow | null>(null)

// create
function openCreate() {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

// edit
async function openEdit(row: ProductionsRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const detail = await request<ProductionDetail>(`${productionsCRUDConfig.endpoint}${row.id}/`, {
      method: "GET",
    })

    selected.value = detail
    mode.value = "edit"
    dialogOpen.value = true
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to load detail")
  } finally {
    formLoading.value = false
  }
}

// submit
async function submit(payload: ProductionPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(productionsCRUDConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success("Productions created")
    } else {
      await request(`${productionsCRUDConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success("Productions updated")
    }

    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? {
      detail: e?.message || "Failed to save",
    }
  } finally {
    formLoading.value = false
  }
}

// import
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

function onImportCompleted(_: any) {
  refresh()
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/mining/productions-crud/download-template/",
    {
      method: "GET",
      responseType: "arrayBuffer",
    }
  )

  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "mining_productions_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}


// delete
function remove(row: ProductionsRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteData(ids: (string | number)[]) {
  return request("/api/mining/productions-crud/bulk-delete/", {
    method: "POST",
    body: {
      ids,
      hard: true,
    },
  })
}

async function confirmDelete() {
  if (!selectedDelete.value) return

  try {
    await deleteData([selectedDelete.value.id])

    notify.success(`Productions "${selectedDelete.value.date_production}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    console.error("DELETE ERROR:", e)
    notify.error(e?.data?.detail || e?.message || "Failed to delete")
  }
}

// bulk delete
const bulkDeleteOpen = ref(false)
const bulkDeleteIds = ref<string[]>([])
const bulkDeleting = ref(false)

function askBulkDelete(ids: unknown) {
  const normalizedIds = Array.isArray(ids)
    ? ids.map((id) => String(id).trim()).filter(Boolean)
    : []

  if (!normalizedIds.length) {
    notify.info("No rows selected")
    return
  }

  bulkDeleteIds.value = normalizedIds
  bulkDeleteOpen.value = true
}

async function confirmBulkDelete() {
  if (!bulkDeleteIds.value.length) return

  bulkDeleting.value = true
  try {
    await deleteData(bulkDeleteIds.value)
    notify.success(`${bulkDeleteIds.value.length} ore deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const openRangeDelete = ref(false)

// table columns
const columns = computed(() =>
  getProductionsColumns(
    {
      onEdit: openEdit,
      onDelete: remove,
    },
    {
      role: currentRole.value,
    }
  )
)
// export
const exportOpen = ref(false)

function handleExport() {
  exportOpen.value = true
}


// summary
async function fetchSummary() {
  return await request('/api/mining/production-summary/', {
    method: 'GET',
    query: query.value,
  })
}

const summary = ref({
  production_tonnage: 0,
  total_mining: 0,
  total_project: 0,
})

async function loadSummary() {
  try {
    const res = await fetchSummary()

    summary.value = {
      production_tonnage: res.production_tonnage ?? 0,
      total_mining: res.total_mining ?? 0,
      total_project: res.total_project ?? 0,
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
          Mining productions data
          <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage production records efficiently.
        </p>
      </div>
      <!-- summary -->
      <div class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
        <div class="px-5 py-4 min-w-[140px]">
          <p class="text-sm text-muted-foreground">TMM</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.production_tonnage) || 0 }}
          </p>
        </div>

        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
          <p class="text-sm text-muted-foreground">Mining</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.total_mining) || 0 }}
          </p>
        </div>

        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
          <p class="text-sm text-muted-foreground">Project</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.total_project) || 0 }}
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
      :filtersSchema="productionsFilters" 
      :showAdd="false"
      :showImport="true"
      :showExport="true" 
      :showDownloadTemplate="true" 
      :showSyncData="false"
      :showBulkDelete="false"
      :showRangeDelete="true"
      @update:search="(v) => { search = v; debouncedSearch() }" 
      @applyFilters="onApply" 
      @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }"
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort"
      @add="openCreate" 
      @bulk-delete="askBulkDelete"
      @range-delete="openRangeDelete = true"
      @import="handleImport"
      @export="handleExport" 
      @download-template="handleDownloadTemplate" 
      />

    <ImportDialog 
      v-model:open="importOpen"
      title="Import Productions" 
      moduleKey="mining.productions"
      importUrl="/api/mining/productions-crud/import/" 
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted" 
    />

    <DeleteRangeDialog
      v-model:open="openRangeDelete"
      endpoint="/api/mining/productions-crud/delete-range/"
      title="Delete Productions by Date Range"
      :hard="true"
      :role="userRole"
      @deleted="refresh()"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Mining Productions"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/mining/productions-crud/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete v-model:open="deleteOpen" title="Delete Productions"
      :description="`Are you sure you want to delete '${selectedDelete?.date_production}'? This action cannot be undone.`"
      @confirm="confirmDelete" />

    <ConfirmDelete v-model:open="bulkDeleteOpen" title="Bulk Delete Productions"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} ore(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete" />
  </div>
</template>