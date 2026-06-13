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

import BlockFormDialog, { type BlockPayload } from "@/modules/master/block/components/BlockFormDialog.vue"
import { getBlockColumns, type BlockRow } from "@/modules/master/block/columns"
import { mineBlockConfig } from "@/modules/master/block/table"
import { mineBlockFilters } from "~/modules/master/block/filters"


const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = { count: number; results: T[] }

const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<BlockRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)
const serverFilters = ref<Record<string, any>>({ ...(mineBlockConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<BlockRow>>(
  () => `block:${JSON.stringify(query.value)}`,
  () => request(mineBlockConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(mineBlockConfig.defaultQuery ?? {}) }
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
const selected = ref<BlockRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const openCreate = () => {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

const openEdit = (row: BlockRow) => {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

const submit = async (payload: BlockPayload) => {
  if (!canMutate.value) return

  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(mineBlockConfig.endpoint, { method: "POST", body: payload })
      notify.success(`Block "${payload.name}" created`)
    } else {
      await request(`${mineBlockConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`Block "${payload.name}" updated`)
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
const selectedDelete = ref<BlockRow | null>(null)

const remove = (row: BlockRow) => {
  if (!canMutate.value) return
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${mineBlockConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`Block "${selectedDelete.value.name}" deleted`)
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
    await request("/api/master/blocks/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })
    notify.success(`${bulkDeleteIds.value.length} block deleted`)
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
  const blob = await request<Blob>("/api/master/blocks/template/", { method: "GET" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "Block_import_template.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>("/api/master/blocks/export/", { method: "GET" })
  // implement download blob kalau endpoint memang return file
}

// ===== columns =====
const columns = computed(() =>
  getBlockColumns(
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
          Mine Block data
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage mine block records efficiently.
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
      :filtersSchema="mineBlockFilters"
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
    <BlockFormDialog
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
      title="Import Block"
      moduleKey="master.Block"
      importUrl="/api/master/blocks/import/"
      templateUrl="/api/master/blocks/template/"
      :jobDetailUrl="(id:number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id:number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="() => refresh()"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Block"
      :description="`Are you sure you want to delete '${selectedDelete?.name}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Block"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} block(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>