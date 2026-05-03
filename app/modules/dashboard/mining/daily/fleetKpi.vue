<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import BarChart from '@/components/ui/apex-chart/BaseBarChart.vue'
import FilterControls from '@/components/filters/FilterMining.vue'
import { useApi } from '@/composables/useApi'

const { request } = useApi()

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
const dateStart = ref('')
const dateEnd = ref('')
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
  if (!dateStart.value || !dateEnd.value) return

  isLoading.value = true
  try {
    const data = await getApi('/api/analytics/raw/mining/kpi-unit/summary/', {
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

function handleApply(payload: { startDate: string; endDate: string; vendor: string }) {
  dateStart.value = payload.startDate
  dateEnd.value = payload.endDate
  vendor.value = payload.vendor

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
  if (dateStart.value && dateEnd.value) {
    fetchKPI()
  }
})

onMounted(() => {
  loadCategories()
})
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
              <!-- CHART DI ATAS -->
              <Card class="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle class="text-base">Chart KPI</CardTitle>
                </CardHeader>
                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
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
                </CardContent>
              </Card>

              <!-- ACTIVITY DI BAWAH -->
              <Card class="w-full overflow-x-auto">
                <CardHeader>
                  <CardTitle class="text-base">Data Fleet Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">
                    Loading...
                  </div>

                  <div v-else>
                    <ScrollArea class="h-143 w-full">
                      <Table class="text-sm table-auto">
                        <TableCaption>Latest fleet activity list</TableCaption>

                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead>No</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead class="text-left">Type</TableHead>
                          <TableHead class="text-right">Fuel</TableHead>
                          <TableHead class="text-right">Working</TableHead>
                          <TableHead class="text-right">Standby</TableHead>
                          <TableHead class="text-right">Maintenance</TableHead>
                          <TableHead class="text-right">PA</TableHead>
                          <TableHead class="text-right">MA</TableHead>
                          <TableHead class="text-right">UA</TableHead>
                          <TableHead class="text-right">EU</TableHead>
                        </TableRow>

                        <TableBody>
                          <TableRow v-for="(row, i) in tableData" :key="i"
                            class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                            <TableCell class="px-1 py-1">{{ i + 1 }}</TableCell>
                            <TableCell class="px-1 py-1">{{ row.unit }}</TableCell>
                            <TableCell class="px-1 py-1">{{ row.category }}</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.fuel }}</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.op }}</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.st }}</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.mt }}</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.pa?.toFixed(0) }}%</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.ma?.toFixed(0) }}%</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.ua?.toFixed(0) }}%</TableCell>
                            <TableCell class="px-1 py-0.9 text-right">{{ row.eu?.toFixed(0) }}%</TableCell>
                          </TableRow>

                          <TableRow v-if="!tableData.length">
                            <TableCell colspan="11" class="text-center text-gray-400">
                              No data available
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </CardContent>


         
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped></style>
