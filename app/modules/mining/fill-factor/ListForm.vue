<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import ImportDialog from "@/components/import/ImportDialog.vue"

import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { useCurrentRole } from "@/composables/useCurrentRole"

import FactorsForm from "@/modules/mining/fill-factor/components/FactorsFormDialog.vue"
import {
  getFillFactorColumns,
  type FillFactorRow,
} from "@/modules/mining/fill-factor/columns"
import { fillFactorConfig } from "@/modules/mining/fill-factor/table"
import { fillFactorFilters } from "@/modules/mining/fill-factor/filters"

const { currentRole } = useCurrentRole()
const { request } = useApi()
const notify = useNotify()

type ApiList<T> = {
  count: number
  results: T[]
}

type FillFactorRowPayload = {
  type_unit: string
  material: string
  density_bcm?: number | null
  density_lcm?: number | null
  bucket_capacity?: number | null
  validation?: string | null
  description?: string | null
}

type FillFactorPayload = {
  id?: number | string
  iup?: number | null
  details: FillFactorRowPayload[]
}

type FillFactorInitial = {
  id?: number | string
  iup?: number | null
  details?: FillFactorRowPayload[]
}

type FillFactorDetail = {
  id?: number | string
  code?: string | null
  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null
  type_unit?: string | null
  material?: string | null
  density_bcm?: number | null
  density_lcm?: number | null
  bucket_capacity?: number | null
  validation?: string | null
  description?: string | null
  user_id?: number | null
  username?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: any
}

/* table state */
const rows = ref<FillFactorRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(fillFactorConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<FillFactorRow>>(
  () => `fill-factor:${JSON.stringify(query.value)}`,
  () =>
    request(fillFactorConfig.endpoint, {
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
  serverFilters.value = { ...(fillFactorConfig.defaultQuery ?? {}) }
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
  ordering.value = !key || !dir ? null : `${dir === "desc" ? "-" : ""}${key}`
  page.value = 1
  refresh()
}

/* dialog state */
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<FillFactorInitial | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

/* delete state */
const deleteOpen = ref(false)
const selectedDelete = ref<FillFactorRow | null>(null)

/* create */
function openCreate() {
  formErrors.value = null
  selected.value = {
    iup: null,
    details: [
      {
        type_unit: "",
        material: "",
        density_bcm: null,
        density_lcm: null,
        bucket_capacity: null,
        validation: "",
        description: "",
      },
    ],
  }
  mode.value = "create"
  dialogOpen.value = true
}

/* edit */
async function openEdit(row: FillFactorRow) {
  formErrors.value = null
  formLoading.value = true

  try {
    const detail = await request<FillFactorDetail>(
      `${fillFactorConfig.endpoint}${row.id}/`,
      { method: "GET" }
    )

    selected.value = {
      id: detail.id,
      iup: detail.iup ?? row.iup_id ?? null,
      details: [
        {
          type_unit: detail.type_unit ?? "",
          material: detail.material ?? "",
          density_bcm: detail.density_bcm ?? null,
          density_lcm: detail.density_lcm ?? null,
          bucket_capacity: detail.bucket_capacity ?? null,
          validation: detail.validation ?? "",
          description: detail.description ?? "",
        },
      ],
    }

    mode.value = "edit"
    dialogOpen.value = true
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to load detail")
  } finally {
    formLoading.value = false
  }
}

/* submit */
async function submit(payload: FillFactorPayload) {
  formLoading.value = true
  formErrors.value = null

  try {
    if (mode.value === "create") {
      const details = Array.isArray(payload.details) ? payload.details : []

      for (const item of details) {
        await request(fillFactorConfig.endpoint, {
          method: "POST",
          body: {
            iup: payload.iup,
            type_unit: item.type_unit,
            material: item.material,
            density_bcm: item.density_bcm,
            density_lcm: item.density_lcm,
            bucket_capacity: item.bucket_capacity,
            validation: item.validation,
            description: item.description,
          },
        })
      }

      notify.success("Fill Factor created")
    } else {
      const firstDetail = payload.details?.[0]

      if (!payload.id || !firstDetail) {
        throw new Error("Invalid edit payload")
      }

      await request(`${fillFactorConfig.endpoint}${payload.id}/`, {
        method: "PATCH",
        body: {
          iup: payload.iup,
          type_unit: firstDetail.type_unit,
          material: firstDetail.material,
          density_bcm: firstDetail.density_bcm,
          density_lcm: firstDetail.density_lcm,
          bucket_capacity: firstDetail.bucket_capacity,
          validation: firstDetail.validation,
          description: firstDetail.description,
        },
      })

      notify.success("Fill Factor updated")
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

/* import/export */
const importOpen = ref(false)

function handleImport() {
  importOpen.value = true
}

async function handleDownloadTemplate() {
  const { request } = useApi()

  const data = await request<ArrayBuffer>(
    "/api/mining/fill-factor/download-template/",
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
  a.download = "mining_fill_factors_import_template.xlsx"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>("/api/mining/fill-factor/export/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "fill_factor_export.xlsx"
  a.click()
  window.URL.revokeObjectURL(url)
}

function onImportCompleted(_: any) {
  refresh()
}

/* delete */
function remove(row: FillFactorRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

async function deleteFactors(ids: Array<string | number>) {
  return request("/api/mining/fill-factor/bulk-delete/", {
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
    await deleteFactors([selectedDelete.value.id])

    notify.success(
      `Fill Factor "${selectedDelete.value.type_unit || "-"} ${selectedDelete.value.material || "-"}" deleted`
    )

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
    await deleteFactors(bulkDeleteIds.value)
    notify.success(`${bulkDeleteIds.value.length} fill factor deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.data?.detail || e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

/* columns */
const columns = computed(() =>
  getFillFactorColumns(
    {
      onEdit: openEdit,
      onDelete: remove,
    },
    {
      role: currentRole.value,
    }
  )
)

/* load error */
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
  <div class="space-y-4">
    <DataTableMaster
      :columns="columns"
      :data="rows"
      :total="total"
      :totalPages="totalPages"
      :page="page"
      :pageSize="pageSize"
      :search="search"
      :loading="pending"
      :filtersSchema="fillFactorFilters"
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

    <FactorsForm
      v-model:open="dialogOpen"
      :mode="mode"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <ImportDialog
      v-model:open="importOpen"
      title="Import Fill Factors"
      moduleKey="mining.fill_factor"
      importUrl="/api/mining/fill-factor/import/"
      :jobDetailUrl="(id: number) => `/api/tasks/import-jobs/${id}/`"
      :jobRowsUrl="(id: number) => `/api/tasks/import-jobs/${id}/rows/`"
      @completed="onImportCompleted"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Fill Factor"
      :description="`Are you sure you want to delete '${selectedDelete?.type_unit || '-'} ${selectedDelete?.material || '-'}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Fill Factor"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} factor(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>