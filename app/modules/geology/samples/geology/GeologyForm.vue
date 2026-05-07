<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import ImportDialog from "@/components/import/ImportDialog.vue"

import { getGeologyColumns, type GeologyRow } from "@/modules/geology/samples/geology/columns"
import { samplesConfig, samplesCRUDConfig } from "@/modules/geology/samples/geology/table"
import { samplesFilters } from "@/modules/geology/samples/geology/filters"
import { buildExportSchema } from "@/modules/geology/samples/geology/export"
import GeologyForm from "@/modules/geology/samples/geology/components/GeologyDialog.vue"
import SampleBulkEntryDialog from "@/modules/geology/samples/geology/components/SampleBulkEntryDialog.vue"
import DeleteRangeDialog from "@/components/global/DeleteRangeDialog.vue"
import ExportDialog from "@/components/global/ExportDialog.vue"

import { useCurrentRole } from "@/composables/useCurrentRole"

const  {currentRole}  = useCurrentRole()
// const currentRole = ref<UserRole>("SYSTEM")

type ApiList<T> = {
  count: number
  results: T[]
}

type SamplePayload = {
  id?: string | number
  iup?: number | null
  tgl_sample: string | null
  shift: string | null
  id_type_sample: number | null
  id_method: number | null
  id_material: number | null
  sampling_area: number | null
  sampling_point: number | null
  sampling_deskripsi: string | null
  batch_code: string | null
  increments: number | null
  sample_weight: number | null
  sample_number: string | null
  primer_raw: number | null
  duplicate_raw: number | null
  remark: string | null
  type: string | null
}

type SampleDetail = {
  id?: string | number
  iup?: number | null
  tgl_sample?: string | null
  shift?: string | null
  id_type_sample?: number | null
  id_method?: number | null
  id_material?: number | null
  sampling_area?: string | null
  sampling_point?: string | null
  sampling_deskripsi?: string | null
  batch_code?: string | null
  increments?: number | null
  sample_weight?: number | null
  sample_number?: string | null
  primer_raw?: number | null
  duplicate_raw?: number | null
  remark?: string | null
  type?: string | null
  [key: string]: any
}
 

const { request } = useApi()
const notify = useNotify()

const rows = ref<GeologyRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(samplesConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<GeologyRow>>(
  () => `samples-geology:${JSON.stringify(query.value)}`,
  () => request(samplesConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(samplesConfig.defaultQuery ?? {}) }
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
const selected = ref<SampleDetail | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

// delete state
const deleteOpen = ref(false)
const selectedDelete = ref<GeologyRow | null>(null)
const bulkDialogOpen = ref(false)

// create
function openCreate() {
  bulkDialogOpen.value = true
}
// edit
async function openEdit(row: GeologyRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const detail = await request<SampleDetail>(`${samplesCRUDConfig.endpoint}${row.id}/`, {
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
async function submit(payload: SamplePayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(samplesCRUDConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success("Sample created")
    } else {
      await request(`${samplesCRUDConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success("Sample updated")
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
// bulk submit
async function submitBulk(payload: SamplePayload[]) {
  formLoading.value = true

  try {
    await request("/api/geology/samples-crud/bulk-create/", {
      method: "POST",
      body: payload,
    })

    notify.success("Bulk samples created")
    bulkDialogOpen.value = false
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed bulk create")
  } finally {
    formLoading.value = false
  }
}

// import
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/geology/samples-crud/download-template/",
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
  a.download = "geology_samples_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}


function onImportCompleted(_: any) {

  refresh()
}

// delete
function remove(row: GeologyRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteSamples(ids: (string | number)[]) {
  return request("/api/geology/samples-crud/bulk-delete/", {
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
    await deleteSamples([selectedDelete.value.id])

    notify.success(`Sample "${selectedDelete.value.sample_id}" deleted`)
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
    await deleteSamples(bulkDeleteIds.value)
    notify.success(`${bulkDeleteIds.value.length} samples deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

// table columns
const columns = computed(() =>
  getGeologyColumns(
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
        <h3 class="text-lg font-semibold">Samples Geology</h3>
        <p class="text-sm text-muted-foreground">Manage samples geology.</p>
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
      :filtersSchema="samplesFilters" 
      :showImport="true"
      :showExport="true" 
      :showDownloadTemplate="true" 
      :showSyncData="false"
      :showRangeDelete="false"
      @update:search="(v) => { search = v; debouncedSearch() }" 
      @applyFilters="onApply" @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }" 
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort" 
      @add="openCreate" 
      @bulk-delete="askBulkDelete" 
      @import="handleImport"
      @export="handleExport"
      @download-template="handleDownloadTemplate" 
      />

    <ImportDialog 
      v-model:open="importOpen" 
      title="Import Samples" 
      moduleKey="geology.samples"
      importUrl="/api/geology/samples-crud/import/" 
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`" 
      @completed="onImportCompleted" 
    />

    <GeologyForm 
      v-model:open="dialogOpen"
      :mode="mode" 
      :role="currentRole" 
      :initial="selected" 
      :loading="formLoading"
      :errors="formErrors || undefined" 
      @submit="submit" 
    />
    
    <SampleBulkEntryDialog
      v-model:open="bulkDialogOpen"
      :loading="formLoading"
      :role="currentRole"
      @submit="submitBulk"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Daily Sample"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/geology/samples-crud/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete 
      v-model:open="deleteOpen" title="Delete Samples"
      :description="`Are you sure you want to delete '${selectedDelete?.sample_id}'? This action cannot be undone.`"
      @confirm="confirmDelete" 
      />

    <ConfirmDelete v-model:open="bulkDeleteOpen"
       title="Bulk Delete Samples"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} sample(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete" 
    />
  </div>
</template>