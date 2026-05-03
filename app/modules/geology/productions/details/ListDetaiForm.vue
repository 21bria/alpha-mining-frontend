<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"
import { getProductionsColumns, type ProductionsRow } from "@/modules/geology/productions/details/columns"
import { productionsConfig } from "@/modules/geology/productions/details/table"
import { productionsFilters } from "@/modules/geology/productions/details/filters"
import { useCurrentRole } from "@/composables/useCurrentRole"

const  {currentRole}  = useCurrentRole()

const { request } = useApi()
const notify = useNotify()


type ApiList<T> = {
  count: number
  results: T[]
}


const rows = ref<ProductionsRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({
  ...(productionsConfig.defaultQuery ?? {}),
})

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<ProductionsRow>>(
  () => `productions-detail:${JSON.stringify(query.value)}`,
  () => request(productionsConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(productionsConfig.defaultQuery ?? {}) }
  ordering.value = null
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

// dialog state
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

// delete state
const deleteOpen = ref(false)
const selectedDelete = ref<ProductionsRow | null>(null)

// create

// edit
async function openEdit(row: ProductionsRow) {
  formErrors.value = null
  formLoading.value = true
}

async function handleDownloadTemplate() {
  const blob = await request<Blob>("/api/geology/productions-detail/template/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "template.csv"
  a.click()
  window.URL.revokeObjectURL(url)
}

async function handleExport() {
  const blob = await request<Blob>("/api/geology/productions-detail/export/", {
    method: "GET",
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "export.csv"
  a.click()
  window.URL.revokeObjectURL(url)
}



// delete
function remove(row: ProductionsRow) {
  selectedDelete.value = row
  deleteOpen.value = true
}

// table columns
const columns = computed(() =>
  getProductionsColumns(
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

// summary
async function fetchSummary() {
  return await request('/api/geology/production-compare-summary/', {
    method: 'GET',
    query: query.value,
  })
}

const summary = ref({
  production_tonnage: 0,
  roa_tonnage: 0,
  mral_tonnage: 0,
})

async function loadSummary() {
  try {
    const res = await fetchSummary()

    summary.value = {
      production_tonnage: res.production_tonnage ?? 0,
      roa_tonnage: res.roa_tonnage ?? 0,
      mral_tonnage: res.mral_tonnage ?? 0,
    }
  } catch (e) {
    console.warn("Gagal load summary", e)
  }
}
const loadSummaryDebounced = useDebounceFn(loadSummary, 300)

watch(query, () => {
  loadSummaryDebounced()
}, { deep: true })

onMounted(() => {
  loadSummary()
})

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">List details ore</h3>
        <p class="text-sm text-muted-foreground">Manage details ore production geology.</p>
      </div>
      <!-- summary -->
      <div class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
        <div class="px-5 py-4 min-w-[140px]">
          <p class="text-sm text-muted-foreground">Totals Ore</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.production_tonnage) || 0 }}
          </p>
        </div>

        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
          <p class="text-sm text-muted-foreground">Totals (mral)</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.mral_tonnage) || 0 }}
          </p>
        </div>

        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
          <p class="text-sm text-muted-foreground">Totals (roa)</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ formatShortNumber(summary.roa_tonnage) || 0 }}
          </p>
        </div>
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
      :filtersSchema="productionsFilters" 
      :showAdd="false"
      :showImport="false"
      :showExport="true" 
      :showDownloadTemplate="false" 
      :showBulkDelete="false" 
      :showRangeDelete="false"
      :showSyncData="false"
      @update:search="(v) => { search = v; debouncedSearch() }" 
      @applyFilters="onApply" 
      @resetFilters="onReset"
      @changePage="(v) => { page = v; refresh() }"
      @changePageSize="(v) => { pageSize = v; page = 1; refresh() }"
      @changeSorting="onSort"
      @export="handleExport" 
      @download-template="handleDownloadTemplate" 
      />

    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || "Failed to load data" }}
    </div>

  </div>
</template>