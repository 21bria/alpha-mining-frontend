<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import { getBargeColumns, type BargeRow } from "@/modules/master/barge/columns"
import { bargeConfig } from "@/modules/master/barge/table"
import { bargeFilters } from "@/modules/master/barge/filters"

import BargeForms from "@/modules/master/barge/components/BargeFormDialog.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

const { request } = useApi()
const notify = useNotify()

type ApiList<T> = { count: number; results: T[] }

const rows = ref<BargeRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")              // dipakai query
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(bargeConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<BargeRow>>(
  () => `surveyor:${JSON.stringify(query.value)}`,
  () => request(bargeConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(bargeConfig.defaultQuery ?? {}) }
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
const selected = ref<BargeRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<BargeRow | null>(null)

// actions
const openCreate = () => {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}
const openEdit = (row: BargeRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}


const submit = async (payload: { id?:number; barge_code: string; barge_name: string; description?: string | null }) => {
  formLoading.value = true
  formErrors.value = null
  try {
    if (mode.value === "create") {
      await request(bargeConfig.endpoint, { method: "POST", body: payload })
      notify.success(`Surveyor "${payload.barge_name}" created`)
    } else {
      await request(`${bargeConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`Surveyor "${payload.barge_name}" updated`)
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
  const blob = await request<Blob>('/api/master/selling-barge/template/', {
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
  const blob = await request<Blob>('/api/master/selling-barge/export/', {
    method: 'GET',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

function onImportCompleted(job: any) {
  // kalau sukses atau failed tetap refresh biar data baru muncul (kalau sukses)
  refresh()
}

const remove = (row: BargeRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${bargeConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`Barge "${selectedDelete.value.barge_name}" deleted`)
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
    await request("/api/masters/barge/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} barge deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = getBargeColumns({
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
        <h2 class="text-2xl font-bold tracking-tight">Data Barge</h2>
        <p class="text-muted-foreground">List of Barge</p>
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
      :filtersSchema="bargeFilters"
      :showSyncData="false"
      :showDownloadTemplate="false"
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

    <BargeForms v-model:open="dialogOpen" 
      :mode="mode" 
      :initial="selected" 
      :loading="formLoading"
      :errors="formErrors || undefined" 
      @submit="submit" 
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import Surveroy"
      moduleKey="master.surveyor"
      importUrl="/api/masters/selling-barge/import/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />
  
    <!-- optional: tampilkan error api -->
    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || 'Failed to load data' }}
    </div>

     <ConfirmDelete v-model:open="deleteOpen" title="Delete Barge"
      :description="`Are you sure you want to delete '${selectedDelete?.barge_name}'? This action cannot be undone.`"
      @confirm="confirmDelete" 
      />
     <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Barge"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} barge(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
     /> 
  </div>
</template>
