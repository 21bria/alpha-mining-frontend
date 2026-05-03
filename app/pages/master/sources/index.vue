<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import { getIUPColumns, type IUPRow } from "@/modules/master/iup/columns"
import { iupConfig } from "@/modules/master/iup/table"
import { iupFilters } from "@/modules/master/iup/filters"

import IupFormDialog from "@/modules/master/iup/components/IupFormDialog.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

const { request } = useApi()
const notify = useNotify()

type ApiList<T> = { count: number; results: T[] }

const rows = ref<IUPRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")              // dipakai query
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(iupConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<IUPRow>>(
  () => `mine-iup:${JSON.stringify(query.value)}`,
  () => request(iupConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(iupConfig.defaultQuery ?? {}) }
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
const selected = ref<IUPRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<IUPRow | null>(null)

// actions
const openCreate = () => {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}
const openEdit = (row: IUPRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

type IUPPayload = {
  id?: number
  iup_code: string
  iup_name: string
  center_lat?: number | null
  center_lng?: number | null
  default_zoom?: number | null
}
const submit = async (payload: IUPPayload) => {
  formLoading.value = true
  formErrors.value = null
  try {
    if (mode.value === "create") {
      await request(iupConfig.endpoint, { method: "POST", body: payload })
      notify.success(`IUP "${payload.iup_name}" created`)
    } else {
      await request(`${iupConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`IUP "${payload.iup_name}" updated`)
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

async function handleDownloadTemplate() {
  const blob = await request<Blob>('/api/master/iup/template/', {
    method: 'GET',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>('/api/master/iup/export/', {
    method: 'GET',
  })
}

function onImportCompleted(job: any) {
  // kalau sukses atau failed tetap refresh biar data baru muncul (kalau sukses)
  refresh()
}

const remove = (row: IUPRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${iupConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`IUP "${selectedDelete.value.iup_name}" deleted`)
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
    await request("/api/masters/iup/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} material deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = getIUPColumns({
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
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Mine IUP</h2>
        <p class="text-muted-foreground">List of Mine IUP</p>
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
      :filtersSchema="iupFilters"
      :showImport="false"
      :showSyncData="false"
      :showRangeDelete="false"
      :showDownloadTemplate="false"
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

    <IupFormDialog v-model:open="dialogOpen" :mode="mode" :initial="selected" :loading="formLoading"
      :errors="formErrors || undefined" @submit="submit" />

    <ImportDialog
      v-model:open="importOpen"
      title="Import IUP"
      moduleKey="master.iup"
      importUrl="/api/masters/iup/import/"
      templateUrl="/api/masters/iup/template/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />
  
    <!-- optional: tampilkan error api -->
    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || 'Failed to load data' }}
    </div>

     <ConfirmDelete v-model:open="deleteOpen" title="Delete IUP"
      :description="`Are you sure you want to delete '${selectedDelete?.iup_name}'? This action cannot be undone.`"
      @confirm="confirmDelete" 
      />
     <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete IUP"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} IUP(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
     /> 
  </div>
</template>
