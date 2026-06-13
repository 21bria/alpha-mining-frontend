<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useAuthStore } from "@/stores/auth"

import SellingCodeFormDialog, { type SellingCodePayload,} from "@/modules/master/selling-code/components/CodeFormDialog.vue"
import {getSellingCodeColumns,type SellingCodeRow,} from "@/modules/master/selling-code/columns"
import { sellingCodeConfig } from "@/modules/master/selling-code/table"
import { sellingCodeFilters } from "@/modules/master/selling-code/filters"
import ExportDialog from "@/components/global/ExportDialog.vue"
import { buildExportSchema } from "@/modules/master/selling-code/export"
import { useCurrentRole } from "@/composables/useCurrentRole"

const  {currentRole}  = useCurrentRole()

const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = {
  count: number
  results: T[]
}

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

const role = computed<UserRole>(() => (auth.user?.role ?? "SITE_USER") as UserRole)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<SellingCodeRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)
const serverFilters = ref<Record<string, any>>({
  ...(sellingCodeConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<SellingCodeRow>>(
  () => `selling-code:${JSON.stringify(query.value)}`,
  () => request(sellingCodeConfig.endpoint, { method: "GET", query: query.value }),
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

function onApply({ search: s, filters }: { search?: string; filters?: Record<string, any> }) {
  search.value = s ?? ""
  serverFilters.value = { ...(filters ?? {}) }
  page.value = 1
  refresh()
}

function onReset() {
  search.value = ""
  serverFilters.value = { ...(sellingCodeConfig.defaultQuery ?? {}) }
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

// ===== dialog state =====
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<SellingCodeRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

function openCreate() {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

function openEdit(row: SellingCodeRow) {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

async function submit(payload: SellingCodePayload) {
  if (!canMutate.value) return

  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(sellingCodeConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success(`Selling Code "${payload.code}" created`)
    } else {
      await request(`${sellingCodeConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success(`Selling Code "${payload.code}" updated`)
    }

    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
  } finally {
    formLoading.value = false
  }
}

// ===== delete =====
const deleteOpen = ref(false)
const selectedDelete = ref<SellingCodeRow | null>(null)

function remove(row: SellingCodeRow) {
  if (!canMutate.value) return
  selectedDelete.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!selectedDelete.value) return

  try {
    await request(`${sellingCodeConfig.endpoint}${selectedDelete.value.id}/`, {
      method: "DELETE",
    })
    notify.success(`Selling Code "${selectedDelete.value.code}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to delete")
  }
}

// ===== bulk delete =====
const bulkDeleteOpen = ref(false)
const bulkDeleteIds = ref<number[]>([])
const bulkDeleting = ref(false)

function askBulkDelete(ids: number[]) {
  if (!canMutate.value) return
  if (!ids.length) {
    notify.info("No rows selected")
    return
  }
  bulkDeleteIds.value = ids
  bulkDeleteOpen.value = true
}

async function confirmBulkDelete() {
  if (!bulkDeleteIds.value.length) return

  bulkDeleting.value = true
  try {
    await request("/api/master/selling-code/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })
    notify.success(`${bulkDeleteIds.value.length} selling code deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

// ===== import/export/template =====
const importOpen = ref(false)

function handleImport() {
  if (!canMutate.value) return
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/master/selling-code/download-template/",
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
  a.download = "master_selling_code_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

// ===== columns =====
const columns = computed(() =>
  getSellingCodeColumns(
    { onEdit: openEdit, onDelete: remove },
    { role: role.value }
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
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
          <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
          Code Barging data
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage code barging records efficiently.
        </p>
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
      :filtersSchema="sellingCodeFilters"
      :showAdd="true"
      :showExport="true"
      :showDownloadTemplate="true"
      :show-BulkDelete="true"
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

    <SellingCodeFormDialog
      v-model:open="dialogOpen"
      :mode="mode"
      :role="role"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import Selling Code"
      moduleKey="master.selling_code"
      importUrl="/api/master/selling-code/import/"
      templateUrl="/api/master/selling-code/template/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="() => refresh()"
    />

    <ExportDialog
      v-model:open="exportOpen"
      title="Export Selling Code"
      :filtersSchema="buildExportSchema(currentRole)"
      endpoint="/api/master/selling-code/export/"
      method="GET"
      mode="async"
      jobStatusUrl="/api/analytics/export-jobs/{jobId}/"
    />


    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Selling Code"
      :description="`Are you sure you want to delete '${selectedDelete?.code}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Selling Code"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} selling code(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>