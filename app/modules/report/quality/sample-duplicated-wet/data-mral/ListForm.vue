<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useAsyncData } from "#app"

import DataTableMaster from "@/components/data-table/DataTableMaster.vue"
import { useNotify } from "@/composables/useNotify"
import { useApi } from "@/composables/useApi"

import { getSampleDupMralColumns, type SampleDupMralRow } from "@/modules/report/quality/sample-duplicated/data-mral/columns"
import { duplicatedSampleConfig } from "@/modules/report/quality/sample-duplicated/data-mral/table"
import { duplicatedSampleFilters } from "@/modules/report/quality/sample-duplicated/data-mral/filters"


const { request } = useApi()
const notify = useNotify()

type ApiList<T> = { count: number; results: T[] }

const rows = ref<SampleDupMralRow[]>([])
const total = ref(0)
const totalPages = ref(1)

const page = ref(1)
const pageSize = ref(10)
const search = ref("")
const ordering = ref<string | null>(null)

const serverFilters = ref<Record<string, any>>({ ...(duplicatedSampleConfig.defaultQuery ?? {}) })

const query = computed(() => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || "",
  ordering: ordering.value || undefined,
  ...serverFilters.value,
}))

const { data, pending, error, refresh } = await useAsyncData<ApiList<SampleDupMralRow>>(
  () => `crm-sample-duplicated-mral:${JSON.stringify(query.value)}`,
  () => request(duplicatedSampleConfig.endpoint, { method: "GET", query: query.value }),
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
  serverFilters.value = { ...(duplicatedSampleConfig.defaultQuery ?? {}) }
  page.value = 1
  refresh()
}

function onSort({ key, dir }: { key: string | null; dir: "asc" | "desc" | null }) {
  if (!key || !dir) ordering.value = null
  else ordering.value = (dir === "desc" ? "-" : "") + key
  page.value = 1
  refresh()
}

async function handleExport() {
  const blob = await request<Blob>('/api/analytics/sample-duplicated-mral/export/', {
    method: 'GET',
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-duplicated-mral-export.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}


const deleteOpen = ref(false)
const selectedDelete = ref<SampleDupMralRow | null>(null)

const remove = (row: SampleDupMralRow) => {
  selectedDelete.value = row
  deleteOpen.value = true
}


const columns = getSampleDupMralColumns({
  onEdit: () => {},
  onDelete: remove,
})

watchEffect(() => {
  if (error.value) notify.error((error.value as any)?.message || "Failed to load data")
})

watch(error, (v) => {
  if (v) notify.error((v as any)?.message || "Failed to load data")
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
      :filtersSchema="duplicatedSampleFilters"
      :showAdd="false"
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
      @export="handleExport"
    />


    <div v-if="error" class="text-sm text-destructive">
      {{ (error as any)?.message || 'Failed to load data' }}
    </div>

  
  </div>
</template>