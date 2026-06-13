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

import DomeFormDialog, { type SourceMinesDomePayload } from "@/modules/master/dome/components/DomeFormDialog.vue"
import { getSourceMinesDomeColumns, type SourceMinesDomeRow } from "@/modules/master/dome/columns"
import { mineDomeConfig } from "@/modules/master/dome/table"
import { mineDomeFilters } from "~/modules/master/dome/filters"


const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = { count: number; results: T[] }

const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<SourceMinesDomeRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)
const serverFilters = ref<Record<string, any>>({ ...(mineDomeConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<SourceMinesDomeRow>>(
  () => `Mine Dome:${JSON.stringify(query.value)}`,
  () => request(mineDomeConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(mineDomeConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key
  page.value = 1
  refresh()
}

// ===== dialog state =====
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<SourceMinesDomeRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const openCreate = () => {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

const openEdit = (row: SourceMinesDomeRow) => {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

const submit = async (payload: SourceMinesDomePayload) => {
  if (!canMutate.value) return

  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(mineDomeConfig.endpoint, { method: "POST", body: payload })
      notify.success(`Loading Point "${payload.pile_id}" created`)
    } else {
      await request(`${mineDomeConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`Loading Point "${payload.pile_id}" updated`)
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
const selectedDelete = ref<SourceMinesDomeRow | null>(null)

const remove = (row: SourceMinesDomeRow) => {
  if (!canMutate.value) return
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${mineDomeConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`Loading Point "${selectedDelete.value.pile_id}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to delete")
  }
}

// ===== bulk delete (optional) =====
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
    await request("/api/master/loading-points/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })
    notify.success(`${bulkDeleteIds.value.length} Loading Point deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

// ===== import/export/template (optional) =====
const importOpen = ref(false)
function handleImport() {
  if (!canMutate.value) return
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const blob = await request<Blob>("/api/master/loading-points/template/", { method: "GET" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "Loading Point_import_template.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>("/api/master/loading-points/export/", { method: "GET" })
  // implement download blob kalau endpoint memang return file
}

// ===== columns =====
const columns = computed(() =>
  getSourceMinesDomeColumns(
    { onEdit: openEdit, onDelete: remove },
    { role: role.value }
  )
)

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
          <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
          Dome/Pile data
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage dome point records efficiently.
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
      :filtersSchema="mineDomeFilters"
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
    <DomeFormDialog
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
      title="Import Loading Point"
      moduleKey="master.loading-point"
      importUrl="/api/master/loading-points/import/"
      templateUrl="/api/master/loading-points/template/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="() => refresh()"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Loading Point"
      :description="`Are you sure you want to delete '${selectedDelete?.pile_id}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Loading Point"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} loading point(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>