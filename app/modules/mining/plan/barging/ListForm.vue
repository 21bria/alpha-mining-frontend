<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useAuthStore } from "@/stores/auth"

import FormDialog, {
  type PlanBargingPayload,
} from "@/modules/mining/plan/barging/components/FormDialog.vue"
import DeleteRangeDialog from "@/components/global/DeleteRangeDialog.vue"
import ExportDialog from "@/components/global/ExportDialog.vue"

import { getplanBargingColumns, type planBargingRow } from "@/modules/mining/plan/barging/columns"
import { planBargingConfig } from "@/modules/mining/plan/barging/table"
import { planBargingFilters } from "@/modules/mining/plan/barging/filters"
import { buildExportSchema } from "@/modules/mining/plan/barging/export"
import { useCurrentRole } from "@/composables/useCurrentRole"

const auth = useAuthStore()
const  {currentRole}  = useCurrentRole()
const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const userRole = ref<UserRole>("SYSTEM")

const { request } = useApi()
const notify = useNotify()

type ApiList<T> = {
  count: number
  results: T[]
}
type PlanBargingDetail = {
  id?: number | string
  iup?: number | null
  date_plan?: string | null
  date_start?: string | null
  date_end?: string | null
  category?: string | null
  vendors?: string | null
  lim?: number | null
  sap?: number | null
  [key: string]: any
}

type ProductionDetail = {
  id?: number | string
  iup?: number | null
  date_production?: string | null
  shift?: string | null
  [key: string]: any
}



const rows = ref<planBargingRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(planBargingConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<planBargingRow>>(
  () => `plan-barging:${JSON.stringify(query.value)}`,
  () => request(planBargingConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(planBargingConfig.defaultQuery ?? {}) }
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
const selected = ref<PlanBargingDetail | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

// delete state
const deleteOpen = ref(false)
const selectedDelete = ref<planBargingRow | null>(null)

// create
function openCreate() {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

// edit
async function openEdit(row: planBargingRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const detail = await request<PlanBargingDetail>(`${planBargingConfig.endpoint}${row.id}/`, {
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
async function submit(payload: PlanBargingPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(planBargingConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success("Plan Barging created")
    } else {
      await request(`${planBargingConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success("Plan Barging updated")
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


async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/mining/plan-productions/download-template/",
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
  a.download = "mining_plan_productions_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function onImportCompleted(_: any) {
  refresh()
}

// delete
function remove(row: planBargingRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}


async function deleteData(ids: (string | number)[]) {
  return request("/api/mining/plan-barging/bulk-delete/", {
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

    notify.success(`Plan Barging "${selectedDelete.value.date_plan}" deleted`)
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
    notify.success(`${bulkDeleteIds.value.length} Plan Barging deleted`)
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
  getplanBargingColumns(
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

    <DataTableMaster 
      :columns="columns" 
      :data="rows" 
      :total="total" 
      :totalPages="totalPages" 
      :page="page"
      :pageSize="pageSize" 
      :search="search" 
      :loading="pending" 
      :filtersSchema="planBargingFilters" 
      :showAdd="true"
      :showImport="false"
      :showExport="true" 
      :showBulkDelete="false"
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

      <FormDialog 
        v-model:open="dialogOpen"
        :mode="mode"
        :role="role"
        :initial="selected"
        :loading="formLoading"
        :errors="formErrors || undefined"
        @submit="submit"
      /> 

    <DeleteRangeDialog
      v-model:open="openRangeDelete"
      endpoint="/api/mining/plan-barging/delete-range/"
      title="Delete Data by Date Range"
      :hard="true"
      :role="currentRole"
      @deleted="refresh()"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Mining Plan Barging"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/mining/plan-barging/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />


    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete v-model:open="deleteOpen" title="Delete Plan Barging"
      :description="`Are you sure you want to delete '${selectedDelete?.date_plan}'? This action cannot be undone.`"
      @confirm="confirmDelete" />

    <ConfirmDelete v-model:open="bulkDeleteOpen" title="Bulk Delete Plan Barging"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} ore(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete" />
  </div>
</template>