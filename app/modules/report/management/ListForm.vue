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
  getReportManagementColumns,
  type ReportManagementRow,
} from "@/modules/report/management/columns"

import { reportManagementConfig } from "@/modules/report/management/table"
import { reportManagementFilters } from "@/modules/report/management/filters"

const router = useRouter()
const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = { count: number; results: T[] }

const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<ReportManagementRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(reportManagementConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } =
  await useAsyncData<ApiList<ReportManagementRow>>(
    () => `report-management:${JSON.stringify(query.value)}`,
    () =>
      request(reportManagementConfig.endpoint, {
        method: "GET",
        query: query.value,
      }),
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
  serverFilters.value = { ...(reportManagementConfig.defaultQuery ?? {}) }
  ordering.value = null
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
  ordering.value = key && dir ? `${dir === "desc" ? "-" : ""}${key}` : null
  page.value = 1
  refresh()
}

function openCreate() {
  if (!canMutate.value) return
  router.push("/report/management/create")
}

function openEdit(row: ReportManagementRow) {
  if (!canMutate.value) return
  router.push(`/report/management/${row.id}/edit`)
}

const deleteOpen = ref(false)
const selectedDelete = ref<ReportManagementRow | null>(null)

function remove(row: ReportManagementRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteReports(ids: (string | number)[]) {
  return request("/api/analytics/report-management/bulk-delete/", {
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
    await deleteReports([selectedDelete.value.id])
    notify.success(`Report "${selectedDelete.value.title}" deleted`)
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
    await deleteReports(bulkDeleteIds.value)
    notify.success(`${bulkDeleteIds.value.length} report(s) deleted`)
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
  const blob = await request<Blob>(
    "/api/analytics/report-management/template/",
    {
      method: "GET",
    }
  )

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "report_management_template.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>(
    "/api/analytics/report-management/export/",
    {
      method: "GET",
    }
  )

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "report_management_export.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

const columns = computed(() =>
  getReportManagementColumns(
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
      :filtersSchema="reportManagementFilters"
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
      title="Import Report Management"
      moduleKey="report.ReportManagement"
      importUrl="/api/analytics/report-management/import/"
      templateUrl="/api/analytics/report-management/template/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="() => refresh()"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Report"
      :description="`Are you sure you want to delete '${selectedDelete?.title}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Reports"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} report(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>