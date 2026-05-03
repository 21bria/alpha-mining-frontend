<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import { getCRMCertificateColumns, type CRMCertificateRow } from "@/modules/report/quality/sample-crm/certified/columns"
import { crmCertifiedConfig } from "@/modules/report/quality/sample-crm/certified/table"
import { crmCertifiedFilters } from "@/modules/report/quality/sample-crm/certified/filters"

import ImportDialog from "@/components/import/ImportDialog.vue"

const { request } = useApi()
const notify = useNotify()

type ApiList<T> = { count: number; results: T[] }

const rows = ref<CRMCertificateRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(crmCertifiedConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<CRMCertificateRow>>(
  () => `crm-certified:${JSON.stringify(query.value)}`,
  () => request(crmCertifiedConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(crmCertifiedConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key
  page.value = 1
  refresh()
}

// import dialog state
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const blob = await request<Blob>('/api/geology/crm-certified/template/', {
    method: 'GET',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'CRM_certificate_import_template.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>('/api/geology/crm-certified/export/', {
    method: 'GET',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'crm-certified-export.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

function onImportCompleted(job: any) {
  refresh()
}

const deleteOpen = ref(false)
const selectedDelete = ref<CRMCertificateRow | null>(null)

const remove = (row: CRMCertificateRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${crmCertifiedConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`CRM Certificate "${selectedDelete.value.oreas_name ?? '-'}" deleted`)
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
    await request("/api/geology/crm-certified/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} CRM certificate(s) deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = getCRMCertificateColumns({
  onEdit: () => {},
  onDelete: remove,
})

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
})

watch(error, (v) => {
  if (v) notify.error((v as any)?.message || "Failed to load data")
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
      :filtersSchema="crmCertifiedFilters"
      :showAdd="false"
      :showImport="false"
      :showExport="true"
      :showDownloadTemplate="true"
      :showSyncData="false"
      :showBulkDelete="false"
      :showRangeDelete="false"
      @update:search="(v) => { search = v; debouncedSearch() }"
      @applyFilters="onApply"
      @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }"
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort"
      @bulk-delete="askBulkDelete"
      @import="handleImport"
      @export="handleExport"
      @download-template="handleDownloadTemplate"
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import CRM Certificate"
      moduleKey="geology.SampleCrmCertified"
      importUrl="/api/geology/crm-certified/import/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || 'Failed to load data' }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete CRM Certificate"
      :description="`Are you sure you want to delete '${selectedDelete?.oreas_name ?? '-'}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete CRM Certificate"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} CRM certificate(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>