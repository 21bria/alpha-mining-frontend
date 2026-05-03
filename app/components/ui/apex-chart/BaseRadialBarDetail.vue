<template>
  <ClientOnly>
    <!-- Radial Cards -->
    <div class="space-y-1">
      <div v-for="item in data" :key="item.key"
        class="rounded-xl border px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
        @click="openShiftDetail(item)">
        <!-- ===== ROW ATAS (RADIAL + TEXT) ===== -->
        <div class="flex items-center">
          <!-- Radial -->
          <div class="relative w-16 h-16">
            <ApexChart :series="[item.percent]" :options="getChartOptions(item.color)" type="radialBar" width="64"
              height="64" />
          </div>

          <!-- Label & Value -->
          <div class="ml-4">
            <p class="text-sm text-gray-700 dark:text-white">
              {{ item.label }}
            </p>
            <p class="text-xl font-semibold text-gray-700 dark:text-white">
              {{ item.value || 0 }}
            </p>
          </div>
        </div>

        <!-- ===== GARIS PEMBATAS ===== -->
        <div class="my-2 border-t border-gray-700"></div>
        <!-- ===== WEATHER (SEJAJAR / BERSEBELAHAN) ===== -->
        <div class="text-sm text-black dark:text-white space-y-1">
          <p class="text-sm font-semibold tracking-wide text-gray-600 dark:text-white">WEATHER</p>
          <div class="grid grid-cols-2 gap-4">
            <!-- Rainy -->
            <div class="flex justify-between">
              <span>Rainy</span>
              <span>{{ formatDurationCompact(item.weather?.rain ?? 0) }}</span>
            </div>
            <!-- Slippery -->
            <div class="flex justify-between">
              <span>Slippery</span>
              <span>{{ formatDurationCompact(item.weather?.slippery ?? 0) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </ClientOnly>

  <!-- Shift Detail Modal -->
  <Dialog v-model:open="showModal">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ selectedShiftLabel }} Shift Detail</DialogTitle>
        <DialogDescription>List of materials for this shift</DialogDescription>
      </DialogHeader>
      <!-- <pre>{{ shiftDetail }}</pre> -->
      <div class="overflow-x-auto mt-4">
        <table class="w-full table-auto border-collapse border">
          <TableRow class="text-sm font-medium">
            <TableHead class="border text-left px-2">Material</TableHead>
            <TableHead class="border text-right px-2">Ritase</TableHead>
            <TableHead class="border text-right px-2">Tonnage</TableHead>
          </TableRow>
          <TableBody>
            <TableRow v-for="(mat, index) in shiftDetail" :key="mat.material + index"
              class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
              <TableCell class="border text-left px-2 py-0.6">{{ mat.material }}</TableCell>
              <TableCell class="border text-right px-2 py-0.6">{{ mat.ritase }}</TableCell>
              <TableCell class="border text-right px-2 py-0.6">{{ mat.tonnage }}</TableCell>
            </TableRow>
          </TableBody>
        </table>
      </div>

      <DialogFooter class="mt-4">
        <Button variant="secondary" @click="showModal = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <!-- New Column Dialog -->

</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref } from 'vue'
import { DialogTitle, DialogDescription } from 'reka-ui'
import { formatDuration, formatDurationVerbose, formatDurationCompact } from '@/utils/time'

const props = defineProps<{
  data: {
    label: string
    value: number | string
    percent: number
    color: string
    key: string
    weather?: {
      rain?: number
      slippery?: number
    }
  }[]
  statsMaterials?: { detail?: Record<string, any[]> }
}>()

const emit = defineEmits<{
  (e: 'select-shift', payload: { key: string; label: string }): void
}>()

// Shift modal
const showModal = ref(false)
const shiftDetail = ref<any[]>([])
const selectedShiftLabel = ref('')



function getTextColor(color: string) {
  if (color.includes('facc15')) return 'text-yellow-500'
  if (color.includes('0ea5e9')) return 'text-sky-500'
  if (color.includes('fb923c')) return 'text-orange-500'
  return 'text-gray-800 dark:text-gray-100'
}

function getChartOptions(color: string): ApexOptions {
  return {
    chart: { sparkline: { enabled: true }, animations: { enabled: false }, background: 'transparent' },
    stroke: { lineCap: 'round' },
    colors: [color],
    plotOptions: {
      radialBar: {
        hollow: { margin: 0, size: '70%', background: 'transparent' },
        track: { background: '#e5e7eb', strokeWidth: '100%', margin: 0 },
        dataLabels: { name: { show: false }, value: { offsetY: 5, fontSize: '13px', fontWeight: 700, show: true } }
      }
    },
    labels: ['']
  } as ApexOptions
}

function openShiftDetail(item: { key: string; label: string }) {
  selectedShiftLabel.value = item.label
  shiftDetail.value = props.statsMaterials?.detail?.[item.key] ?? []   // <<< Hanya ada di child
  showModal.value = true   // <<< Hanya di child
  emit('select-shift', { key: item.key, label: item.label })
}


</script>
