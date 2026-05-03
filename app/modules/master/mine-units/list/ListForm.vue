<script setup lang="ts">
import { ref, computed, watchEffect, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import { getMineUnitsColumns, type MineUnitsRow } from "~/modules/master/mine-units/list/columns"
import { mineUnitsConfig } from "~/modules/master/mine-units/list/table"
import { mineUnitsFilters } from "~/modules/master/mine-units/list/filters"

import MineUnitsFormDialog from "@/modules/master/mine-units/list/components/MineUnitsFormDialog.vue"
import ExportDialog from "@/components/global/ExportDialog.vue"
import { buildExportSchema } from "@/modules/master/mine-units/list/export"
import { useCurrentRole } from "@/composables/useCurrentRole"

const  {currentRole}  = useCurrentRole()
const { request } = useApi()
const notify = useNotify()

type ApiList<T> = { count: number; results: T[] }

const rows = ref<MineUnitsRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(mineUnitsConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<MineUnitsRow>>(
  () => `mine-units:${JSON.stringify(query.value)}`,
  () => request(mineUnitsConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(mineUnitsConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key
  page.value = 1
  refresh()
}

// ======================
// dialog state
// ======================
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<MineUnitsRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<MineUnitsRow | null>(null)

// ======================
// actions
// ======================
const openCreate = () => {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

const openEdit = (row: MineUnitsRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

const submit = async (payload: {
  id?: number
  unit_code: string
  unit_model?: string | null
  unit_class?: string | null
  brand?: string | null
  id_category?: number | null
  id_vendor?: number | null
  supports?: string | null
  status?: number | null
  description?: string | null
  commisioning_date?: string | null
  on_hire?: string | null
  off_hire?: string | null
}) => {
  formLoading.value = true
  formErrors.value = null
  try {
    if (mode.value === "create") {
      await request(mineUnitsConfig.endpoint, { method: "POST", body: payload })
      notify.success(`Unit "${payload.unit_code}" created`)
    } else {
      await request(`${mineUnitsConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`Unit "${payload.unit_code}" updated`)
    }
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
  } finally {
    formLoading.value = false
  }
}

// ======================
// import/export
// ======================
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/master/mine-units/download-template/",
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
  a.download = "master_equipments_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function onImportCompleted() {
  refresh()
}

// ======================
// delete
// ======================
const remove = (row: MineUnitsRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${mineUnitsConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`Unit "${selectedDelete.value.unit_code}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to delete")
  }
}

// ======================
// bulk delete
// ======================
const bulkDeleteOpen = ref(false)
const bulkDeleteIds = ref<string[]>([])
const bulkDeleting = ref(false)

function askBulkDelete(ids: Array<string | number>) {
  const normalizedIds = ids.map((id) => String(id).trim()).filter(Boolean)

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
    await request("/api/master/mine-units/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} unit(s) deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

// ======================
// columns
// ======================
const columns = getMineUnitsColumns({
  onEdit: openEdit,
  onDelete: remove,
})

// export
const exportOpen = ref(false)

function handleExport() {
  exportOpen.value = true
}

// ======================
// error watcher
// ======================

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
})

watch(error, (v) => {
  if (v) notify.error((v as any)?.message || "Failed to load data")
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 class="text-lg font-semibold">Mine Units</h3>
        <p class="text-muted-foreground">List of mine units</p>
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
      :filtersSchema="mineUnitsFilters"
      :showSyncData="false"
      :showRangeDelete="false"
      @update:search="(v) => { search = v; debouncedSearch() }"
      @applyFilters="onApply"
      @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }"
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort"
      @add="openCreate"
      @import="handleImport"
      @export="handleExport"
      @bulk-delete="askBulkDelete"
      @download-template="handleDownloadTemplate"
    />

    <MineUnitsFormDialog
      v-model:open="dialogOpen"
      :mode="mode"
      :role="'SYSTEM'"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import Mine Equipments"
      moduleKey="master.mine_units"
      importUrl="/api/master/mine-units/import/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Mine Units"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/master/mine-units/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />


    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Mine Unit"
      :description="`Are you sure you want to delete '${selectedDelete?.unit_code}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Mine Units"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} unit(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>