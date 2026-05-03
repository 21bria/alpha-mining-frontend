<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import ImportDialog from "@/components/import/ImportDialog.vue"
import WaybillsForm from "@/modules/geology/waybills/components/WaybillsDialogForm.vue"
import DeleteRangeDialog from "@/components/global/DeleteRangeDialog.vue"
import ExportDialog from "@/components/global/ExportDialog.vue"
import { getWaybillsColumns, type WaybillsRow } from "@/modules/geology/waybills/columns"
import { waybillsConfig } from "@/modules/geology/waybills/table"
import { waybillsCRUDConfig } from "@/modules/geology/waybills/table"
import { waybillsFilters } from "@/modules/geology/waybills/filters"
import { buildExportSchema } from "@/modules/geology/waybills/export"
import { useCurrentRole } from "@/composables/useCurrentRole"

const { request } = useApi()
const notify = useNotify()

const  {currentRole}  = useCurrentRole()
const userRole = ref<UserRole>("SYSTEM")

type ApiList<T> = { count: number; results: T[] }

type waybillsPayload = {
  id?: number | string
  iup?: number | null
  tgl_deliver:  string | null
  delivery_time:  string | null
  waybill_number:  string | null
  qty: number | null
  sample_id: string | null
  sample_status: string | null
  mral_order: string | null
  roa_order: string | null
  remarks: string | null
  delivery: string | null
}

const rows = ref<WaybillsRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")              // dipakai query
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(waybillsConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<WaybillsRow>>(
  () => `waybills:${JSON.stringify(query.value)}`,
  () => request(waybillsConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(waybillsConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key
  page.value = 1
  refresh()
}

// dialog state
const dialogOpen = ref(false)
const mode = ref<'create' | 'edit'>('create')
const selected = ref<WaybillsRow | null>(null)
const formLoading = ref(false)  
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<WaybillsRow | null>(null)

// actions
const openCreate = () => {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}
const openEdit = (row: WaybillsRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}


// import dialog state
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/geology/waybills-crud/download-template/",
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
  a.download = "geology_waybills_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function onImportCompleted(job: any) {
  // kalau sukses atau failed tetap refresh biar data baru muncul (kalau sukses)
  refresh()
}


function remove(row: WaybillsRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteData(ids: (string | number)[]) {
  return request("/api/geology/waybills-crud/bulk-delete/", {
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
    notify.success(`Waybills "${selectedDelete.value.sample_id}" deleted`)
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

const columns = computed(() =>
  getWaybillsColumns(
    {
      onEdit: openEdit,
      onDelete: remove,
    },
    {
      role: currentRole.value,
    }
  )
)

// submit
async function submit(payload: waybillsPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(waybillsCRUDConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success("Waybills created")
    } else {
      await request(`${waybillsCRUDConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success("Waybills updated")
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

// export
const exportOpen = ref(false)

function handleExport() {
  exportOpen.value = true
}

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
})

watch(error, (v) => {
  if (v) notify.error((v as any)?.message || 'Failed to load data')
})


</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">

      <DataTableMaster 
        :columns="columns" 
        :data="rows" 
        :total="total"
        :totalPages="totalPages" 
        :page="page"
        :pageSize="pageSize" 
        :search="search" 
        :loading="pending" 
        :filtersSchema="waybillsFilters" 
        :showImport="true"
        :showExport="true" 
        :showDownloadTemplate="true" 
        :showSyncData="false"
        @update:search="(v) => { search = v; debouncedSearch() }" 
        @applyFilters="onApply" @resetFilters="onReset"
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

    <WaybillsForm 
      v-model:open="dialogOpen" 
      :mode="mode" :role="currentRole" 
      :initial="selected" 
      :loading="formLoading"
      :errors="formErrors || undefined" 
      @submit="submit" 
    />

    <ImportDialog 
      v-model:open="importOpen" 
      title="Import Waybills"
      moduleKey="geology.waybills"
      importUrl="/api/geology/waybills-crud/import/" 
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`" 
      @completed="onImportCompleted"
    />

     <DeleteRangeDialog
      v-model:open="openRangeDelete"
      endpoint="/api/geology/waybills-crud/delete-range/"
      title="Delete by Period"
      :hard="true"
      :role="userRole"
      @deleted="refresh()"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Waybills"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/geology/waybills-crud/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />

    <!-- optional: tampilkan error api -->
    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || 'Failed to load data' }}
    </div>

    <ConfirmDelete v-model:open="deleteOpen" title="Delete Waybills"
      :description="`Are you sure you want to delete '${selectedDelete?.sample_id}'? This action cannot be undone.`"
      @confirm="confirmDelete" />
    <ConfirmDelete v-model:open="bulkDeleteOpen" title="Bulk Delete waybills"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} sample(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete" />
  </div>
</template>
