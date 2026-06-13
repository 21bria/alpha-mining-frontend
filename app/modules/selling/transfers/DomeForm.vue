<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useAuthStore } from "@/stores/auth"

import DomeMergeFormDialog, {
  type DomeTransferPayload,
} from "@/modules/selling/transfers/components/DomeDialog.vue"

import {
  getDomeTransferColumns,
  type DomeTransferRow,
} from "@/modules/selling/transfers/columns"

import { domeTransferConfig } from "@/modules/selling/transfers/table"
import { domeTransferFilters } from "@/modules/selling/transfers/filters"

const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = { count: number; results: T[] }

const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<DomeTransferRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)
const serverFilters = ref<Record<string, any>>({
  ...(domeTransferConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<DomeTransferRow>>(
  () => `dome-transfer:${JSON.stringify(query.value)}`,
  () => request(domeTransferConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(domeTransferConfig.defaultQuery ?? {}), ...(filters ?? {}) }
  page.value = 1
  refresh()
}

function onReset() {
  search.value = ""
  serverFilters.value = { ...(domeTransferConfig.defaultQuery ?? {}) }
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
const selected = ref<DomeTransferRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const openCreate = () => {
  if (!canMutate.value) return
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

const openView = (row: DomeTransferRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

const submit = async (payload: DomeTransferPayload) => {
  if (!canMutate.value) return

  formLoading.value = true
  formErrors.value = null

  try {
    await request(domeTransferConfig.endpoint, {
      method: "POST",
      body: payload,
    })

    notify.success("Transfer Selling created")
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
  } finally {
    formLoading.value = false
  }
}

// ===== undo =====
const undoOpen = ref(false)
const selectedUndo = ref<DomeTransferRow | null>(null)
const undoLoading = ref(false)

function askUndo(row: DomeTransferRow) {
  if (!canMutate.value) return
  if (row.is_undone || row.status === "UNDONE") {
    notify.info("This compositing has already been undone")
    return
  }

  selectedUndo.value = row
  undoOpen.value = true
}

async function confirmUndo() {
  if (!selectedUndo.value) return

  undoLoading.value = true
  try {
    await request(`${domeTransferConfig.endpoint}${selectedUndo.value.id}/undo/`, {
      method: "POST",
      body: {
        undo_notes: `Undo compositing ${selectedUndo.value.ref_id ?? selectedUndo.value.id}`,
      },
    })

    notify.success(
      `Transfer Selling "${selectedUndo.value.ref_id ?? selectedUndo.value.id}" undone`
    )
    undoOpen.value = false
    selectedUndo.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to undo compositing")
  } finally {
    undoLoading.value = false
  }
}

// ===== delete =====
const deleteOpen = ref(false)
const selectedDelete = ref<DomeTransferRow | null>(null)

function remove(row: DomeTransferRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteRows(ids: (string | number)[]) {
  return request("/api/selling/dome-transfer/bulk-delete/", {
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
    await deleteRows([selectedDelete.value.id])
    notify.success(
      `Transfer Selling "${selectedDelete.value.ref_id ?? selectedDelete.value.id}" deleted`
    )
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to delete")
  }
}

// ===== bulk delete =====
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
    await deleteRows(bulkDeleteIds.value)
    notify.success(`${bulkDeleteIds.value.length} Transfer Selling row(s) deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = computed(() =>
  getDomeTransferColumns(
    {
      onView: openView,
      onUndo: askUndo,
      onDelete: remove,
    },
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
      :filtersSchema="domeTransferFilters"
      :showImport="false"
      :showExport="false"
      :showDownloadTemplate="false"
      :showSyncData="false"
      :showBulkDelete="false"
      :showRangeDelete="false"
      @update:search="(v) => { search = v; debouncedSearch() }"
      @applyFilters="onApply"
      @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }"
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort"
      @add="openCreate"
      @bulk-delete="askBulkDelete"
    />

    <DomeMergeFormDialog
      v-model:open="dialogOpen"
      :mode="mode"
      :role="role"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="undoOpen"
      title="Undo Transfer Selling"
      :description="`Are you sure you want to undo '${selectedUndo?.ref_id ?? selectedUndo?.id}'? This will move selling back to the original dome.`"
      @confirm="confirmUndo"
    />

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Transfer Selling"
      :description="`Are you sure you want to delete '${selectedDelete?.ref_id ?? selectedDelete?.id}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Transfer Selling"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} row(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>