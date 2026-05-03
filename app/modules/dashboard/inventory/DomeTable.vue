<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-4 md:grid-cols-1">
      <Card class="w-full overflow-x-auto">
        <CardHeader>
          <div class="flex items-start justify-between w-full">
            <CardTitle>Dome Inventory</CardTitle>
            <NuxtLink to="/components/inventory/data-all"
              class="text-sm text-violet-600 hover:underline hover:text-violet-700 dark:hover:text-violet-500 transition-colors flex items-center">
              View →
              <i class="bi bi-box-arrow-up-right text-[0.6875rem] ml-1" />
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">Loading...</div>

          <div v-else class="min-h-100px w-full flex items-center justify-center gap-4 md:min-h-200px">
            <Table>
              <TableCaption>A list of your recent inventory.</TableCaption>
              <TableRow>
                <TableHead class="w-[100px]">Dome</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Totals</TableHead>
                <TableHead class="text-right">Ni</TableHead>
                <TableHead class="text-right">Fe</TableHead>
                <TableHead class="text-right">MgO</TableHead>
              </TableRow>
              <TableBody>
                <TableRow v-for="dome in domes" :key="dome.pile_id">
                  <TableCell class="font-medium">{{ dome.pile_id }}</TableCell>
                  <TableCell>{{ dome.nama_material }}</TableCell>
                  <TableCell>{{ dome.total_ore }}</TableCell>
                  <TableCell class="text-right">{{ dome.ni }}</TableCell>
                  <TableCell class="text-right">{{ dome.fe }}</TableCell>
                  <TableCell class="text-right">{{ dome.mgo }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { URL_GET_DATA } from '@/utils/api'

const props = defineProps<{ filterType: string }>()

const chartFilter = useChartFilterStore()
const isLoading = ref(false)

const statsDome = ref<{ data: DomeItem[] }>({ data: [] })

interface DomeItem {
  pile_id: string
  nama_material: string
  total_ore: number
  ni: number
  fe: number
  mgo: number
}

const domes = computed(() => statsDome.value?.data || [])

async function fetchDomeStats() {
  isLoading.value = true
  const params = new URLSearchParams()
  params.append('filter_type', props.filterType)

  switch (props.filterType) {
    case 'daily':
      if (chartFilter.date) params.append('filter_date', chartFilter.date)
      break
    case 'weekly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      if (chartFilter.month) params.append('month', chartFilter.month.value.toString())
      if (chartFilter.week) {
        const week = `${chartFilter.year}-${String(chartFilter.week).padStart(2, '0')}`
        params.append('week', week)
      }
      break
    case 'monthly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      if (chartFilter.month) params.append('month', chartFilter.month.value.toString())
      break
    case 'range':
      if (chartFilter.range.start) params.append('date_start', chartFilter.range.start)
      if (chartFilter.range.end) params.append('date_end', chartFilter.range.end)
      break
    case 'yearly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      break
  }

  try {
    const url = `${URL_GET_DATA}dashboard/api/dome-grade/?${params.toString()}`
    const response = await fetch(url)
    const data = await response.json()
    statsDome.value = data
  } catch (error) {
    console.error('❌ Gagal ambil data Dome:', error)
    statsDome.value = { data: [] }
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDomeStats)

watch(
  () => [
    props.filterType,
    chartFilter.date,
    chartFilter.month?.value,
    chartFilter.year,
    chartFilter.week,
    chartFilter.range.start,
    chartFilter.range.end
  ],
  fetchDomeStats
)
</script>
