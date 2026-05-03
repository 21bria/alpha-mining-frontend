<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useAuthStore } from "@/stores/auth"

import SampleTypeFormDialog, {
  type SampleTypePayload,
} from "@/modules/master/sample/type/components/SampleTypeDialog.vue"
import SampleTypeMethodsDialog from "@/modules/master/sample/type/components/SampleTypeMethodsDialog.vue"

import {
  getSampleTypeColumns,
  type SampleTypeRow,
} from "@/modules/master/sample/type/columns"

import { sampleTypeConfig } from "@/modules/master/sample/type/table"
import { sampleTypeFilters } from "@/modules/master/sample/type/filters"

const { request } = useApi()
const notify = useNotify()
const auth = useAuthStore()

type ApiList<T> = {
  count: number
  results: T[]
}

const role = computed(() => (auth.user?.role ?? "SITE_USER") as any)
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")

const rows = ref<SampleTypeRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)
const serverFilters = ref<Record<string, any>>({
  ...(sampleTypeConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<SampleTypeRow>>(
  () => `sample-type:${JSON.stringify(query.value)}`,
  () => request(sampleTypeConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(sampleTypeConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key

  page.value = 1
  refresh()
}

// =========================
// dialog state
// =========================
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<SampleTypeRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

function openCreate() {
  if (!canMutate.value) return

  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

function openEdit(row: SampleTypeRow) {
  if (!canMutate.value) return

  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

async function submit(payload: SampleTypePayload) {
  if (!canMutate.value) return

  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(sampleTypeConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success(`Sample type "${payload.type_sample}" created`)
    } else {
      await request(`${sampleTypeConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success(`Sample type "${payload.type_sample}" updated`)
    }

    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
  } finally {
    formLoading.value = false
  }
}

// =========================
// delete single
// =========================
const deleteOpen = ref(false)
const selectedDelete = ref<SampleTypeRow | null>(null)

function remove(row: SampleTypeRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteRows(ids: (string | number)[]) {
  return request("/api/masters/sample-types/bulk-delete/", {
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
    notify.success(`Sample type "${selectedDelete.value.type_sample}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to delete")
  }
}

// =========================
// bulk delete
// =========================
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
    notify.success(`${bulkDeleteIds.value.length} sample type row(s) deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}
// Detail
const methodDialogOpen = ref(false)
const selectedTypeForMethods = ref<SampleTypeRow | null>(null)

function openMethods(row: SampleTypeRow) {
  selectedTypeForMethods.value = row
  methodDialogOpen.value = true
}

const columns = computed(() =>
  getSampleTypeColumns(
    {
      onEdit: openEdit,
      onDelete: remove,
      onOpenMethods: openMethods,
    },
    role.value
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
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Sample Type</h3>
        <p class="text-sm text-muted-foreground">Manage sample type.</p>
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
      :filtersSchema="sampleTypeFilters"
      :showImport="false"
      :showExport="false"
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
    />

    <SampleTypeFormDialog
      v-model:open="dialogOpen"
      :mode="mode"
      :role="role"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <SampleTypeMethodsDialog
      v-model:open="methodDialogOpen"
      :sample-type="selectedTypeForMethods"
      :role="role"
      @changed="refresh"
    />
    
    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Sample Type"
      :description="`Are you sure you want to delete '${selectedDelete?.type_sample ?? selectedDelete?.id}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Sample Type"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} row(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>