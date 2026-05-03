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
import { getProductionsColumns, type ProductionsRow } from "@/modules/geology/productions/list/columns"
import { productionsConfig, productionsCRUDConfig } from "@/modules/geology/productions/list/table"
import { productionsFilters } from "@/modules/geology/productions/list/filters"
import { buildExportSchema } from "@/modules/geology/productions/list/export"
import OreForm from "@/modules/geology/productions/list/components/OreFormDialog.vue"
import { useCurrentRole } from "@/composables/useCurrentRole"

const  {currentRole}  = useCurrentRole()
const userRole = ref<UserRole>("SYSTEM")
  

const { request } = useApi()
const notify = useNotify()


type ApiList<T> = {
  count: number
  results: T[]
}

type ProductionPayload = {
  id?: number | string
  iup?: number | null
  tgl_production: string | null
  shift: string | null
  id_block: number | null
  id_prospect_area: number | null
  from_rl: number | null
  to_rl: number | null
  id_material: number | null
  grade_expect: number | null
  grade_control: string | null
  unit_truck: string | null
  id_pile: number | null
  batch_code: string | null
  increment: number | null
  batch_status: string | null
  ritase: number | null
  tonnage: number | null
  pile_status: string | null
  kode_batch: string | null
  pile_original: string | null
  truck_factor: number | null
  ore_class: string | null
  batch_status_set: string | null
  dome_compositing: string | null
  stock_compositing: string | null
  status_dome: string | null
  sale_adjust: number | null
  remarks: string | null
  category: number | null
  direct: string | null
  no_production: string | null
}

type ProductionDetail = {
  id?: number | string
  iup?: number | null
  tgl_production?: string | null
  shift?: string | null
  id_block?: number | null
  block_label?: string | null
  id_prospect_area?: number | null
  prospect_label?: string | null
  from_rl?: number | null
  to_rl?: number | null
  id_material?: number | null
  material_label?: string | null
  grade_expect?: number | null
  grade_control?: string | null
  unit_truck?: string | null
  id_stockpile?: number | null
  stockpile_label?: string | null
  id_pile?: number | null
  pile_label?: string | null
  batch_code?: string | null
  increment?: number | null
  batch_status?: string | null
  ritase?: number | null
  tonnage?: number | null
  pile_status?: string | null
  kode_batch?: string | null
  pile_original?: string | null
  truck_factor?: number | null
  ore_class?: string | null
  batch_status_set?: string | null
  dome_compositing?: string | null
  stock_compositing?: string | null
  status_dome?: string | null
  sale_adjust?: number | null
  remarks?: string | null
  category?: number | null
  direct?: string | null
  no_production?: string | null
  [key: string]: any
}


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
  () => `productions-ore:${JSON.stringify(query.value)}`,
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
    "/api/geology/productions-crud/download-template/",
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
  a.download = "geology_ore_import_template.xlsx"
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
  return request("/api/geology/productions-crud/bulk-delete/", {
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
    notify.success(`Ore Productions "${selectedDelete.value.tgl_production}" deleted`)
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

// export
const exportOpen = ref(false)

function handleExport() {
  exportOpen.value = true
}

// summary
async function fetchSummary() {
  return await request('/api/geology/production-compare-summary/', {
    method: 'GET',
    query: query.value,
  })
}

const summary = ref({
  production_tonnage: 0,
  roa_tonnage: 0,
  mral_tonnage: 0,
})

async function loadSummary() {
  try {
    const res = await fetchSummary()

    summary.value = {
      production_tonnage: res.production_tonnage ?? 0,
      roa_tonnage: res.roa_tonnage ?? 0,
      mral_tonnage: res.mral_tonnage ?? 0,
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

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">List data ore</h3>
        <p class="text-sm text-muted-foreground">Manage ore production geology.</p>
      </div>
      <!-- summary -->
      <div class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
        <div class="px-5 py-4 min-w-[140px]">
          <p class="text-sm text-muted-foreground">Totals Ore</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
           {{ formatShortNumber(summary.production_tonnage) || 0 }}
          </p>
        </div>

        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
          <p class="text-sm text-muted-foreground">Totals (mral)</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.mral_tonnage) || 0 }}
          </p>
        </div>

        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
          <p class="text-sm text-muted-foreground">Totals (roa)</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.roa_tonnage) || 0 }}
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
      :showImport="true"
      :showExport="true" 
      :showDownloadTemplate="true" 
      :showSyncData="false"
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
      title="Import Ore" 
      moduleKey="geology.ore"
      importUrl="/api/geology/productions-crud/import/" 
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted" 
    />

    <OreForm 
      v-model:open="dialogOpen" 
      :mode="mode" :role="currentRole" 
      :initial="selected" 
      :loading="formLoading"
      :errors="formErrors || undefined" 
      @submit="submit" 
      />

    <DeleteRangeDialog
      v-model:open="openRangeDelete"
      endpoint="/api/geology/productions-crud/delete-range/"
      title="Delete by Period"
      :hard="true"
      :role="userRole"
      @deleted="refresh()"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Ore"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/geology/productions-crud/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete v-model:open="deleteOpen" title="Delete Ore"
      :description="`Are you sure you want to delete '${selectedDelete?.tgl_production}'? This action cannot be undone.`"
      @confirm="confirmDelete" />

    <ConfirmDelete v-model:open="bulkDeleteOpen" title="Bulk Delete Ore"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} ore(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete" />
  </div>
</template>