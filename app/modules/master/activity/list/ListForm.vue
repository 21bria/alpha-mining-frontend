<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import ImportDialog from "@/components/import/ImportDialog.vue"
import { getActivityColumns, type ActivityRow } from "@/modules/master/activity/list/columns"
import { activityConfig } from "@/modules/master/activity/list/table"
import { activityFilters } from "@/modules/master/activity/list/filters"

import ActivityForm from "@/modules/master/activity/list/components/ActivityFormDialog.vue"

const { request } = useApi()
const notify = useNotify()

type ApiList<T> = { count: number; results: T[] }

const rows = ref<ActivityRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")              // dipakai query
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(activityConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<ActivityRow>>(
  () => `master-activity:${JSON.stringify(query.value)}`,
  () => request(activityConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(activityConfig.defaultQuery ?? {}) }
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
const selected = ref<ActivityRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<ActivityRow | null>(null)

// actions
const openCreate = () => {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}
const openEdit = (row: ActivityRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}


const submit = async (payload: { id?: number; code: string; name?: string | null }) => {
  formLoading.value = true
  formErrors.value = null
  try {
    if (mode.value === "create") {
      await request(activityConfig.endpoint, { method: "POST", body: payload })
      notify.success(`Activity "${payload.name}" created`)
    } else {
      await request(`${activityConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`Activity "${payload.name}" updated`)
    }
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
  } finally {
    formLoading.value = false
  }
}

// import dialog state
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
    "/api/master/activity/download-template/",
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
  a.download = "master_activity_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>('/api/master/activity/export/', {
    method: 'GET',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}


const remove = (row: ActivityRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${activityConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`Activity "${selectedDelete.value.name}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to delete")
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
    await request("/api/masters/activity/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} activity deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = getActivityColumns({
  onEdit: openEdit,
  onDelete: remove,
})

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
})


watch(error, (v) => {
  if (v) notify.error((v as any)?.message || 'Failed to load data')
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
       <div>
        <h3 class="text-lg font-semibold  tracking-tight">
          Master Acivity
        </h3>
        <p class="text-muted-foreground">
          Master data acivity
        </p>
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
      :filtersSchema="activityFilters" 
      :showAdd="true"
      :showImport="true"
      :showExport="true" 
      :showDownloadTemplate="true" 
      :showSyncData="false"
      :showRangeDelete="false"
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

    <ActivityForm 
      v-model:open="dialogOpen" 
      :mode="mode" 
      :initial="selected" 
      :loading="formLoading"
      :errors="formErrors || undefined" 
      @submit="submit"
    />

    <ImportDialog 
        v-model:open="importOpen"
        title="Import Acitivty" 
        moduleKey="mining.activity"
        importUrl="/api/master/activity/import/" 
        :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
        :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`"
        @completed="onImportCompleted" 
      />
    <!-- optional: tampilkan error api -->
    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || 'Failed to load data' }}
    </div>

     <ConfirmDelete v-model:open="deleteOpen" title="Delete Activity"
      :description="`Are you sure you want to delete '${selectedDelete?.name}'? This action cannot be undone.`"
      @confirm="confirmDelete" 
      />
     <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Activity"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} categories(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
     /> 
  </div>
</template>
