<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import ImportDialog from "@/components/import/ImportDialog.vue"
import { useCurrentRole } from "@/composables/useCurrentRole"

import {
  getActivityLocationsRow,
  type ActivityLocationsRow,
} from "@/modules/master/activity/locations/columns"
import { activityLocationsConfig } from "@/modules/master/activity/locations/table"
import { activityLocationsFilters } from "@/modules/master/activity/locations/filters"
import ActivityLocationForm from "@/modules/master/activity/locations/components/ActivityLocationsFormDialog.vue"

const { request } = useApi()
const notify = useNotify()
const { currentRole } = useCurrentRole()

type ApiList<T> = {
  count: number
  results: T[]
}

type ActivityLocationPayload = {
  id?: number | string
  iup?: number | null
  name: string
  description?: string | null
}

const rows = ref<ActivityLocationsRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(activityLocationsConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<ActivityLocationsRow>>(
  () => `master-activity-locations:${JSON.stringify(query.value)}`,
  () =>
    request(activityLocationsConfig.endpoint, {
      method: "GET",
      query: query.value,
    }),
  { server: false }
)

watchEffect(() => {
  const results = data.value?.results ?? []
  const count = Number(data.value?.count ?? 0)

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
  ordering.value = null
  serverFilters.value = { ...(activityLocationsConfig.defaultQuery ?? {}) }
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
  ordering.value = !key || !dir ? null : `${dir === "desc" ? "-" : ""}${key}`
  page.value = 1
  refresh()
}

/* dialog state */
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<ActivityLocationsRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

/* delete state */
const deleteOpen = ref(false)
const selectedDelete = ref<ActivityLocationsRow | null>(null)

/* create */
function openCreate() {
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

/* edit */
async function openEdit(row: ActivityLocationsRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const detail = await request<ActivityLocationsRow>(
      `${activityLocationsConfig.endpoint}${row.id}/`,
      { method: "GET" }
    )

    selected.value = detail
    mode.value = "edit"
    dialogOpen.value = true
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to load detail")
  } finally {
    formLoading.value = false
  }
}

/* submit */
async function submit(payload: ActivityLocationPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      await request(activityLocationsConfig.endpoint, {
        method: "POST",
        body: payload,
      })
      notify.success(`Activity Location "${payload.name}" created`)
    } else {
      await request(`${activityLocationsConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: payload,
      })
      notify.success(`Activity Location "${payload.name}" updated`)
    }

    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? {
      detail: e?.message || "Failed to save",
    }
  } finally {
    formLoading.value = false
  }
}

/* import */
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

function onImportCompleted(_: any) {
  refresh()
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/master/activity-locations/download-template/",
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
  a.download = "master_activity_locations_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/* export */
async function handleExport() {
  const blob = await request<Blob>("/api/master/activity-locations/export/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "activity_location_export.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

/* delete */
function remove(row: ActivityLocationsRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!selectedDelete.value) return

  try {
    await request(`${activityLocationsConfig.endpoint}${selectedDelete.value.id}/`, {
      method: "DELETE",
    })

    notify.success(`Activity Location "${selectedDelete.value.name || "-"}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to delete")
  }
}

/* bulk delete */
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
    await request("/api/master/activity-locations/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} activity location deleted`)
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
  getActivityLocationsRow(
    {
      onEdit: openEdit,
      onDelete: remove,
    },
    {
      role: currentRole.value,
    }
  )
)

watchEffect(() => {
  if (error.value) {
    notify.error((error.value as any)?.message || "Failed to load data")
  }
})

watch(error, (v) => {
  if (v) {
    notify.error((v as any)?.message || "Failed to load data")
  }
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
  <div class="grid gap-2">
      <div>
        <h3 class="text-lg font-semibold tracking-tight">
         Activities Locations
        </h3>
        <p class="text-muted-foreground">
         Master activities locations
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
      :filtersSchema="activityLocationsFilters"
      :showAdd="true"
      :showImport="true"
      :showExport="true"
      :showDownloadTemplate="true"
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

    <ActivityLocationForm
      v-model:open="dialogOpen"
      :mode="mode"
      :role="currentRole"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import Activity Location"
      moduleKey="mining.activities_locations"
      importUrl="/api/master/activity-locations/import/"
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Activity Location"
      :description="`Are you sure you want to delete '${selectedDelete?.name || '-'}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Activity Location"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} record(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>