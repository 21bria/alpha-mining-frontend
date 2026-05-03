<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import BarChart from '@/components/ui/apex-chart/BaseBarChart.vue'
import FilterControls from '@/components/filters/FilterKpi.vue'
import { useApi } from '@/composables/useApi'
import { useNotify } from "@/composables/useNotify"

const notify = useNotify()

const { request } = useApi()
const route = useRoute()

const filterType = computed(() => String(route.query.filter_type || 'monthly'))
const iupId = computed(() => route.query.iup_id ? Number(route.query.iup_id) : null)
const year = computed(() => route.query.year ? Number(route.query.year) : null)
const month = computed(() => route.query.month ? Number(route.query.month) : null)
const week = computed(() => route.query.week ? String(route.query.week) : null)
const filterDate = computed(() => route.query.filter_date ? String(route.query.filter_date) : null)
const dateStart = computed(() => route.query.date_start ? String(route.query.date_start) : null)
const dateEnd = computed(() => route.query.date_end ? String(route.query.date_end) : null)

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery({
      ...extraQuery
    })
  })
}

const isLoading = ref(false)
const categories = ref<any[]>([])
const selectedCategories = ref<string[]>([])
const tableData = ref<any[]>([])
const vendor = ref('')

// LOAD CATEGORY
async function loadCategories() {
  try {
    const data = await getApi('/api/master/lookups/categories-units/')
    categories.value = data.list || []
  } catch (err) {
    console.error('Failed load categories:', err)
    categories.value = []
  }
}

function toggleCategory(category: string, checked: boolean) {
  if (checked) {
    if (!selectedCategories.value.includes(category)) {
      selectedCategories.value.push(category)
    }
  } else {
    selectedCategories.value = selectedCategories.value.filter(c => c !== category)
  }
  console.log('selectedCategories now:', selectedCategories.value)
}

function onCheckboxChange(e: Event, category: string) {
  const target = e.target as HTMLInputElement | null
  if (!target) return
  toggleCategory(category, target.checked)
}

// GROUP KPI BY CATEGORY
const groupedByCategory = computed(() => {
  const map = new Map<string, any[]>()

  tableData.value.forEach((row) => {
    if (!map.has(row.category)) map.set(row.category, [])
    map.get(row.category)!.push(row)
  })

  const result: Record<string, any[]> = {}
  map.forEach((v, k) => {
    result[k] = v
  })

  return result
})

// FETCH KPI DATA
async function fetchKPI() {
  if (!vendor.value) return
  if (!selectedCategories.value.length) return

  isLoading.value = true
  try {
    const data = await getApi('/api/analytics/raw/mining/kpi-unit/summary/', {
      filter_type: filterType.value,
      iup_id: iupId.value,
      year: year.value,
      month: month.value,
      week: week.value,
      filter_date: filterDate.value,
      date_start: dateStart.value,
      date_end: dateEnd.value,
      vendor: vendor.value,
      categories: JSON.stringify(selectedCategories.value),
    })

    tableData.value = data.success ? data.data : []
  } catch (err) {
    console.error('Gagal load KPI:', err)
    tableData.value = []
  } finally {
    isLoading.value = false
  }
}

function handleApply(payload: { vendor: string | number | null }) {
  vendor.value = payload.vendor ? String(payload.vendor) : ''

  nextTick(() => {
    console.log('selectedCategories before fetch:', selectedCategories.value)
    fetchKPI()
  })
}

function buildChart(rows: any[]) {
  return {
    categories: rows.map(r => r.unit),
    series: [
      {
        name: 'MA (%)',
        data: rows.map(r => r.ma)
      },
      {
        name: 'UA (%)',
        data: rows.map(r => r.ua)
      }
    ]
  }
}

// AUTO FETCH JIKA KATEGORI BERUBAH
watch(selectedCategories, () => {
  if (vendor.value && selectedCategories.value.length) {
    fetchKPI()
  }
})

onMounted(() => {
  loadCategories()
})

function buildClipboardText() {
  if (!tableData.value.length) return ""

  const headers = [
    "No", "Units", "Type", "Fuel", "Working", "Standby",
    "Maintenance", "PA", "MA", "UA", "EU"
  ]

  const rows = tableData.value.map((row: any, i: number) => [
    i + 1,
    row.unit,
    row.category,
    row.fuel,
    row.op,
    row.st,
    row.mt,
    `${row.pa ?? 0}%`,
    `${row.ma ?? 0}%`,
    `${row.ua ?? 0}%`,
    `${row.eu ?? 0}%`
  ])

  // Excel-friendly (TAB separated)
  return [headers, ...rows].map(r => r.join("\t")).join("\n")
}

async function handleCopy() {
  try {
    const text = buildClipboardText()
    if (!text) return

    await navigator.clipboard.writeText(text)
    notify.success("Copied! Paste directly into Excel 👍")
  } catch (err) {
    console.error("Copy failed", err)
    notify.error("Failed to copy table")
  }
}
</script>


<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Fleet KPI
        </h2>
      </div>
      <div class="flex gap-2">
        <div class="flex items-center space-x-2">
          <FilterControls @apply="handleApply" />
        </div>
      </div>
    </div>
    <div class="grid grid-cols-12 gap-4">
      <div class="xl:col-span-2 col-span-12">
        <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
          <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex flex-col gap-2">
                <div v-if="categories.length" v-for="item in categories" :key="item.id" class="flex items-center gap-2">
                  <input type="checkbox" :id="`cat_${item.id}`" :value="item.category"
                    :checked="selectedCategories.includes(item.category)"
                    @change="e => onCheckboxChange(e, item.category)" class="h-4 w-4" />
                  <label :for="`cat_${item.id}`" class="text-sm font-medium cursor-pointer">
                    {{ item.category }}
                  </label>
                </div>
                <div v-else class="text-sm text-gray-400">
                  No category available
                </div>

              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <div class="xl:col-span-10 col-span-12">
        <div class="xl:col-span-12 col-span-12">

          <CardContent class="space-y-4">
            <!-- CHART -->
            <div class="w-full space-y-4">

              <div class="text-base font-semibold pb-2 mb-3 border-b border-gray-200 dark:border-gray-700">
                Chart KPI
              </div>
              <div class="overflow-x-auto">
                <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">
                  Loading...
                </div>
                <div v-else-if="!tableData.length" class="py-4 text-center text-gray-400">
                  No data
                </div>
                <div v-else class="space-y-6">
                  <div v-for="(rows, category) in groupedByCategory" :key="category" class="border rounded-lg p-4">
                    <div class="overflow-x-auto">
                      <div :style="{
                        minWidth: Math.max(buildChart(rows).categories.length * 70, 600) + 'px'
                      }">
                        <BarChart :series="buildChart(rows).series" :categories="buildChart(rows).categories"
                          :title="`${category} KPI`" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ACTIVITY TABLE -->
            <div class="w-full space-y-5">
              <div class="flex items-center justify-between border-b pb-2 mb-3">
                <div class="text-base font-semibold">
                  Data Fleet Activity
                </div>

                <button @click="handleCopy" :disabled="!tableData.length"
                  class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
                  title="Copy table">
                  <Icon name="i-lucide-copy" class="w-4 h-4" />
                </button>
              </div>
              <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">
                Loading...
              </div>
              <div v-else>
                <div class="h-[60vh] overflow-auto rounded-lg border bg-background">
                  <table class="min-w-[1100px] w-full border-separate border-spacing-0 text-sm">
                    <!-- <caption class="caption-bottom py-3 text-sm text-muted-foreground">
                      Latest fleet activity list
                    </caption> -->

                    <thead class="sticky top-0 z-20 bg-background shadow-sm">
                      <tr
                        class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                        <th class="border-b bg-background px-2 py-2 text-left font-semibold whitespace-nowrap">No</th>
                        <th class="border-b bg-background px-2 py-2 text-left font-semibold whitespace-nowrap">Units
                        </th>
                        <th class="border-b bg-background px-2 py-2 text-left font-semibold whitespace-nowrap">Type</th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">Fuel
                        </th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">Working
                        </th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">Standby
                        </th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">
                          Maintenance</th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">PA</th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">MA</th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">UA</th>
                        <th class="border-b bg-background px-2 py-2 text-right font-semibold whitespace-nowrap">EU</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="(row, i) in tableData" :key="i"
                        class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                        <td class="border-b px-2 py-2">{{ i + 1 }}</td>
                        <td class="border-b px-2 py-2">{{ row.unit }}</td>
                        <td class="border-b px-2 py-2">{{ row.category }}</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.fuel }}</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.op }}</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.st }}</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.mt }}</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.pa?.toFixed(0) }}%</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.ma?.toFixed(0) }}%</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.ua?.toFixed(0) }}%</td>
                        <td class="border-b px-2 py-2 text-right">{{ row.eu?.toFixed(0) }}%</td>
                      </tr>

                      <tr v-if="!tableData.length">
                        <td colspan="11" class="px-2 py-4 text-center text-gray-400">
                          No data available
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </CardContent>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped></style>
