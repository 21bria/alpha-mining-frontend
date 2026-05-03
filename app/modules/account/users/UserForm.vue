<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import ConfirmDelete from "@/components/ui/confirm-delete.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import { getUsersColumns, type usersRow } from "@/modules/account/users/columns"
import { usersConfig } from "@/modules/account/users/table"
import { usersFilters } from "@/modules/account/users/filters"

import UsersForm from "@/modules/account/users/components/UsersDialog.vue"

const { request } = useApi()
const notify = useNotify()

import { useAuthStore } from "@/stores/auth"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

const auth = useAuthStore()

const currentUserRole = computed<UserRole>(() => {
  const raw =
    (auth.user as any)?.role ??
    (auth as any)?.me?.role ??
    (auth as any)?.profile?.role ??
    ""

  const r = String(raw).trim().toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(r)) return r as UserRole

  const isSuper = Boolean((auth.user as any)?.is_superuser ?? (auth as any)?.me?.is_superuser)
  const isStaff = Boolean((auth.user as any)?.is_staff ?? (auth as any)?.me?.is_staff)
  if (isSuper || isStaff) return "SYSTEM"

  return "SITE_USER"
})

type ApiList<T> = { count: number; results: T[] }


// table state
const rows = ref<usersRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)
const serverFilters = ref<Record<string, any>>({ ...(usersConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<usersRow>>(
  () => `users:${JSON.stringify(query.value)}`,
  () => request(usersConfig.endpoint, { method: "GET", query: query.value }),
  { server: false }
)

watchEffect(() => {
  const results = data.value?.results ?? []
  const count = data.value?.count ?? 0
  rows.value = results
  total.value = count
  totalPages.value = Math.max(1, Math.ceil(count / pageSize.value))
})

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
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
  serverFilters.value = { ...(usersConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key
  page.value = 1
  refresh()
}

// dialog state
const dialogOpen = ref(false)
const mode = ref<"create" | "edit">("create")
const selected = ref<usersRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

const deleteOpen = ref(false)
const selectedDelete = ref<usersRow | null>(null)

type UserPayload = {
  id?: number
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  is_active?: boolean
  role: string
  default_iup_id?: number | null
  allowed_iup_ids?: number[]
  groups?: string[]
  password?: string
}

// actions
const openCreate = () => {
  if ((auth as any).meLoaded === false) {
    notify.info("Loading user profile...")
    return
  }
  formErrors.value = null
  selected.value = null
  mode.value = "create"
  dialogOpen.value = true
}

const openEdit = (row: usersRow) => {
  formErrors.value = null
  selected.value = row
  mode.value = "edit"
  dialogOpen.value = true
}

const submit = async (payload: UserPayload) => {
  formLoading.value = true
  formErrors.value = null
  try {
    if (mode.value === "create") {
      await request(usersConfig.endpoint, { method: "POST", body: payload })
      notify.success(`User "${payload.username}" created`)
    } else {
      await request(`${usersConfig.endpoint}${payload.id}/`, { method: "PATCH", body: payload })
      notify.success(`User "${payload.username}" updated`)
    }
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
  } finally {
    formLoading.value = false
  }
}

// delete single
const remove = (row: usersRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}

const confirmDelete = async () => {
  if (!selectedDelete.value) return
  try {
    await request(`${usersConfig.endpoint}${selectedDelete.value.id}/`, { method: "DELETE" })
    notify.success(`User "${selectedDelete.value.username}" deleted`)
    deleteOpen.value = false
    selectedDelete.value = null
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to delete")
  }
}

// bulk delete (ganti endpoint sesuai backend-mu)
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
    await request("/api/account/users/bulk-delete/", {
      method: "POST",
      body: { ids: bulkDeleteIds.value },
    })

    notify.success(`${bulkDeleteIds.value.length} user(s) deleted`)
    bulkDeleteOpen.value = false
    bulkDeleteIds.value = []
    await refresh()
  } catch (e: any) {
    notify.error(e?.message || "Failed to bulk delete")
  } finally {
    bulkDeleting.value = false
  }
}

const columns = getUsersColumns({
  onEdit: openEdit,
  onDelete: remove,
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Users</h3>
        <p class="text-sm text-muted-foreground">Manage users & permissions.</p>
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
      :filtersSchema="usersFilters"
      :showImport="false"
      :showExport="false"
      :showDownloadTemplate="false"
      :showSyncData="false"
      @update:search="(v) => { search = v; debouncedSearch() }"
      @applyFilters="onApply"
      @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }"
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort"
      @add="openCreate"
      @bulk-delete="askBulkDelete"
    />

    <UsersForm
      v-model:open="dialogOpen"
      :mode="mode"
      :role="currentUserRole"
      :initial="selected"
      :loading="formLoading"
      :errors="formErrors || undefined"
      @submit="submit"
    />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

    <ConfirmDelete
      v-model:open="deleteOpen"
      title="Delete Users"
      :description="`Are you sure you want to delete '${selectedDelete?.username}'? This action cannot be undone.`"
      @confirm="confirmDelete"
    />

    <ConfirmDelete
      v-model:open="bulkDeleteOpen"
      title="Bulk Delete Users"
      :description="`Are you sure you want to delete ${bulkDeleteIds.length} user(s)? This action cannot be undone.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>