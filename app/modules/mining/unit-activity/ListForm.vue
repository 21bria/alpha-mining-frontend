<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useCurrentRole } from "@/composables/useCurrentRole"

import {
  getHmUnitColumns,
  type HmUnitRow,
} from "@/modules/mining/unit-activity/columns"

import { activityUnitsConfig } from "@/modules/mining/unit-activity/table"
import { activityUnitsFilters } from "@/modules/mining/unit-activity/filters"

import HmUnitFormDialog from "@/modules/mining/unit-activity/components/HmUnitFormDialog.vue"
import HmUnitDetailDrawer from "@/modules/mining/unit-activity/components/HmUnitDetailDrawer.vue"

const { currentRole } = useCurrentRole()
const { request } = useApi()
const notify = useNotify()

type ApiList<T> = {
  count: number
  results: T[]
}

type HmUnitDetailRow = {
  id?: string
  start_time: string | null
  end_time: string | null
  duration_min: number | null

  status?: number | null
  status_id?: number | null
  status_name?: string | null

  activity?: number | null
  activity_id?: number | null
  activity_name?: string | null

  location?: number | null
  location_id?: number | null
  location_name?: string | null

  category?: string | null
  description?: string | null
}

type HmUnitPayload = {
  id?: string
  iup?: number | null
  unit: string | null
  date: string | null
  shift: string | null
  hm_start: number | null
  hm_end: number | null
  status?: string | null
  details: HmUnitDetailRow[]
}

type HmUnitDetailData = {
  id: string
  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null

  unit?: string | null
  unit_id?: string | null
  unit_code?: string | null
  unit_model?: string | null

  date?: string | null
  shift?: string | null

  hm_start?: number | null
  hm_end?: number | null
  hm_total?: number | null

  status?: string | null
  username?: string | null

  details?: HmUnitDetailRow[]
}

const rows = ref<HmUnitRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(activityUnitsConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<HmUnitRow>>(
  () => `hm-unit:${JSON.stringify(query.value)}`,
  () =>
    request(activityUnitsConfig.endpoint, {
      method: "GET",
      query: query.value,
    }),
  { server: false }
)

watchEffect(() => {
  const results = data.value?.results ?? []
  const count = Number(data.value?.count ?? 0)

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
  ordering.value = null
  serverFilters.value = { ...(activityUnitsConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({
  key,
  dir,
}: {
  key: string | null
  dir: "asc" | "desc" | null
}) {
  ordering.value = !key || !dir ? null : `${dir === "desc" ? "-" : ""}${key}`
  page.value = 1
  refresh()
}

/* form dialog */
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<HmUnitDetailData | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

/* detail drawer */
const detailOpen = ref(false)
const detailLoading = ref(false)
const detailData = ref<HmUnitDetailData | null>(null)

/* delete state */
const deleteOpen = ref(false)
const selectedDelete = ref<HmUnitRow | null>(null)

/* create */
function openCreate() {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

/* view detail */
async function openDetail(row: HmUnitRow) {
  detailOpen.value = true
  detailLoading.value = true

  try {
    const res = await request<HmUnitDetailData>(`${activityUnitsConfig.endpoint}${row.id}/`, {
      method: "GET",
    })
    detailData.value = res
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to load detail")
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

/* edit */
async function openEdit(row: HmUnitRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const res = await request<HmUnitDetailData>(`${activityUnitsConfig.endpoint}${row.id}/`, {
      method: "GET",
    })
    selected.value = res
    mode.value = "edit"
    dialogOpen.value = true
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to load detail")
  } finally {
    formLoading.value = false
  }
}

/* submit */
async function submit(payload: HmUnitPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(activityUnitsConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success("HM Unit created")
    } else {
      await request(`${activityUnitsConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success("HM Unit updated")
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

/* import */
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
    "/api/mining/unit-activity/download-template/",
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
  a.download = "mining_activities_units_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/* export */
async function handleExport() {
  const blob = await request<Blob>("/api/mining/hm-unit/export/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "hm_unit_export.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

/* delete */
function remove(row: HmUnitRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}


async function deleteHM(ids: (string | number)[]) {
  return request("/api/mining/unit-activity/bulk-delete/", {
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
    await deleteHM([selectedDelete.value.id])

    notify.success(`Productions "${selectedDelete.value.unit_code}" deleted`)
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
    await deleteHM(bulkDeleteIds.value)
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
/* columns */
const columns = computed(() =>
  getHmUnitColumns(
    {
      onView: openDetail,
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
      :filtersSchema="activityUnitsFilters"
      :showAdd="false"
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
      @import="handleImport"
      @export="handleExport"
      @download-template="handleDownloadTemplate"
    />

    <HmUnitFormDialog
      v-model:open="dialogOpen"
      :mode="mode"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <HmUnitDetailDrawer
      v-model:open="detailOpen"
      :loading="detailLoading"
      :data="detailData"
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import HM Unit"
      moduleKey="mining.activity_units"
      importUrl="/api/mining/unit-activity/import/"
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete HM Unit"
      :description="`Are you sure you want to delete '${selectedDelete?.unit_code || '-'}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete HM Unit"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} record(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>