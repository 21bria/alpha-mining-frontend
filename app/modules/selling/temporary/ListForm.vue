<script setup lang="ts">
import { ref, computed, watchEffect, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import DeleteRangeDialog from "@/components/global/DeleteRangeDialog.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useCurrentRole } from "@/composables/useCurrentRole"

import {
  getSellingBargingTemporaryColumns,
  type SellingBargingTemporaryRow,
} from "@/modules/selling/temporary/columns"

import { sellingTemporaryConfig, sellingTemporaryRUDConfig } from "@/modules/selling/temporary/table"
import { sellingBargingFilters } from "@/modules/selling/temporary/filters"
import TemporaryForm from "@/modules/selling/temporary/components/TemporaryDialog.vue"
import ExportDialog from "@/components/global/ExportDialog.vue"
import { buildExportSchema } from "@/modules/mining/weather/export"

const { currentRole } = useCurrentRole()
const { request } = useApi()
const notify = useNotify()

export type TemporaryPayload = {
  id?: string

  iup?: number | null
  code_lot: string | null
  barge_code: string | number | null
  date_hauling: string | null
  time_hauling: string | null
  shift: string | null

  id_material: number | null
  id_stockpile: number | null
  id_pile: number | null

  unit_code: string | null
  tonnage: number | null
  type_selling: string | null

  code_inc: string | null
  code_sub: string | null
  code_sub_auto: string | null

  id_user: number | null
  sale_adjust: string | null
  no_urut: number | null
  status: number | null
  description: string | null

  user?: number | null
}

type ApiList<T> = {
  count: number
  results: T[]
}

const rows = ref<SellingBargingTemporaryRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(sellingTemporaryConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<SellingBargingTemporaryRow>>(
  () => `selling-barging-temporary:${JSON.stringify(query.value)}`,
  () => request(sellingTemporaryConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(sellingTemporaryConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = `${dir === "desc" ? "-" : ""}${key}`

  page.value = 1
  refresh()
}

// dialog state
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const formLoading = ref(false)
const selected = ref<SellingBargingTemporaryRow | null>(null)
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<SellingBargingTemporaryRow | null>(null)

const importOpen = ref(false)
const openRangeDelete = ref(false)

function openCreate() {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

async function openEdit(row: SellingBargingTemporaryRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const detail = await request(`${sellingTemporaryRUDConfig.endpoint}${row.id}/`, {
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

function handleImport() {
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const blob = await request<Blob>("/api/selling/temporary-crud/template/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "selling_barging_temporary_template.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}



function remove(row: SellingBargingTemporaryRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteSelling(ids: (string | number)[]) {
  return request("/api/selling/temporary-crud/bulk-delete/", {
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
    await deleteSelling([selectedDelete.value.id])

    notify.success(`Temporary barging "${selectedDelete.value.code_lot ?? selectedDelete.value.date_hauling}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    console.error("DELETE ERROR:", e)
    notify.error(e?.data?.detail || e?.message || "Failed to delete")
  }
}

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
    await deleteSelling(bulkDeleteIds.value)
    notify.success(`${bulkDeleteIds.value.length} temporary barging deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = computed(() =>
  getSellingBargingTemporaryColumns(
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
  if (v) notify.error((v as any)?.message || "Failed to load data")
})

async function submit(payload: TemporaryPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(sellingTemporaryRUDConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success("Temporary barging created")
    } else {
      await request(`${sellingTemporaryRUDConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success("Temporary barging updated")
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
      :filtersSchema="sellingBargingFilters"
      :showAdd="true"
      :showBulkDelete="false"
      :showRangeDelete="true"
      :showImport="false"
      :showExport="true"
      :showDownloadTemplate="false"
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

    <TemporaryForm
      v-model:open="dialogOpen"
      :mode="mode"
      :role="currentRole"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <DeleteRangeDialog
      v-model:open="openRangeDelete"
      endpoint="/api/selling/temporary-crud/delete-range/"
      title="Delete Temporary Barging by Date Range"
      :hard="true"
      :role="currentRole"
      @deleted="refresh()"
    />

   <ExportDialog
      v-model:open="exportOpen"
      title="Export Daily Temp.Barging"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/selling/temporary-crud/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />


    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Barging Temporary"
      :description="`Are you sure you want to delete '${selectedDelete?.code_lot ?? selectedDelete?.date_hauling}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Barging Temporary"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} temporary barging data? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>