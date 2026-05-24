<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData, useRouter } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useAuthStore } from "@/stores/auth"

import {
  getBodWeeklyReportColumns,
  type BodWeeklyReportRow,
} from "@/modules/report/bod/columns"
import { bodWeeklyConfig } from "@/modules/report/bod/table"
import { bodWeeklyFilters } from "@/modules/report/bod/filters"

const router = useRouter()
const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = { count: number; results: T[] }

const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<BodWeeklyReportRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(bodWeeklyConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<BodWeeklyReportRow>>(
  () => `bod-weekly-report:${JSON.stringify(query.value)}`,
  () => request(bodWeeklyConfig.endpoint, { method: "GET", query: query.value }),
  { server: false }
)

watchEffect(() => {
  rows.value = data.value?.results ?? []
  total.value = data.value?.count ?? 0
  totalPages.value = Math.max(1, Math.ceil(total.value / pageSize.value))
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
  serverFilters.value = { ...(bodWeeklyConfig.defaultQuery ?? {}) }
  ordering.value = null
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  ordering.value = key && dir ? `${dir === "desc" ? "-" : ""}${key}` : null
  page.value = 1
  refresh()
}

function openCreate() {
  if (!canMutate.value) return
  router.push("/report/bod/create")
}

function openEdit(row: BodWeeklyReportRow) {
  if (!canMutate.value) return
  router.push(`/report/bod/${row.id}/edit`)
}

const deleteOpen = ref(false)
const selectedDelete = ref<BodWeeklyReportRow | null>(null)

function remove(row: BodWeeklyReportRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteSamples(ids: (string | number)[]) {
  return request("/api/analytics/bod-weekly-report/bulk-delete/", {
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
    notify.success(`BOD report "${selectedDelete.value.title}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to delete")
  }
}

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
    notify.success(`${bulkDeleteIds.value.length} BOD report(s) deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const importOpen = ref(false)

function handleImport() {
  if (!canMutate.value) return
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const blob = await request<Blob>("/api/analytics/bod-weekly-report/template/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "bod_weekly_report_template.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>("/api/analytics/bod-weekly-report/export/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "bod_weekly_report_export.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

const columns = computed(() =>
  getBodWeeklyReportColumns(
    { onEdit: openEdit, onDelete: remove },
    { role: role.value }
  )
)

watchEffect(() => {
  if (error.value) {
    notify.error((error.value as any)?.message || "Failed to load data")
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
      :filtersSchema="bodWeeklyFilters"
      :showImport="false"
      :showExport="true"
      :showDownloadTemplate="false"
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

    <ImportDialog
      v-model:open="importOpen"
      title="Import BOD Weekly Report"
      moduleKey="report.BodWeeklyReport"
      importUrl="/api/analytics/bod-weekly-report/import/"
      templateUrl="/api/analytics/bod-weekly-report/template/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="() => refresh()"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete BOD Report"
      :description="`Are you sure you want to delete '${selectedDelete?.title}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete BOD Reports"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} BOD report(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>