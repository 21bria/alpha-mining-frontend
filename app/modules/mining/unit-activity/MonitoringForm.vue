<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FilterControls from '@/components/filters/FilterKpiCheck.vue'
import { useApi } from '@/composables/useApi'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const { request } = useApi()

type MonitoringRow = {
  date: string
  unit: string
  unit_code: string
  category: string
  total_hour: number
  missing_hour: number
  status: 'Complete' | 'Incomplete' | 'Over'
}

const loading = ref(false)
const rows = ref<MonitoringRow[]>([])

async function fetchData(params: {
  date_start?: string
  date_end?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    loading.value = true

    const json: any = await request(
      '/api/analytics/raw/mining/kpi-monitoring/',
      {
        method: 'GET',
        query: {
          date_start: params.date_start,
          date_end: params.date_end,
          ...(params.iup_id && {
            iup_id: Array.isArray(params.iup_id)
              ? params.iup_id.join(',')
              : params.iup_id
          })
        }
      }
    )

    rows.value = json.data ?? []
  } catch (err) {
    console.error('Fetch KPI Monitoring failed', err)
    rows.value = []
    notify.error('Failed to load KPI monitoring data')
  } finally {
    loading.value = false
  }
}

function handleApply(payload: {
  date_start: string
  date_end: string
  iup_id?: number | null
}) {
  fetchData({
    date_start: payload.date_start,
    date_end: payload.date_end,
    iup_id: payload.iup_id ?? null
  })
}

onMounted(() => {
  const today = new Date().toISOString().split('T')[0]

  fetchData({
    date_start: today,
    date_end: today
  })
})
function fmt(val: any) {
  if (val === null || val === undefined || val === '') return '-'
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

function buildClipboardText() {
  if (!rows.value.length) return ''

  const headers = [
    'No',
    'Date',
    'Unit',
    'Category',
    'Total Hour',
    'Missing',
    'Status'
  ]

  const bodyRows = rows.value.map((row, idx) => [
    idx + 1,
    row.date || '-',
    row.unit || '-',
    row.category || '-',
    fmt(row.total_hour),
    fmt(row.missing_hour),
    row.status || '-'
  ])

  return [headers, ...bodyRows]
    .map(r => r.join('\t'))
    .join('\n')
}

async function handleCopy() {
  try {
    const text = buildClipboardText()

    if (!text) {
      notify.error('No data to copy')
      return
    }

    await navigator.clipboard.writeText(text)
    notify.success('Copied! Paste directly into Excel 👍')
  } catch (err) {
    console.error('Copy failed', err)
    notify.error('Failed to copy table')
  }
}
</script>

<template>
  <div class="w-full flex justify-center">
    <div class="w-full max-w-7xl space-y-4">
      <div class="grid gap-2">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">
            Monitoring EWH
          </h2>
          <p class="text-muted-foreground">
            Manage data units activities
          </p>
        </div>
      </div>
    <div class="flex flex-wrap items-end justify-between gap-2">
  <div class="flex items-center space-x-2">
    <FilterControls @apply="handleApply" />
  </div>

  <button
    @click="handleCopy"
    :disabled="!rows.length"
    class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
    title="Copy table"
  >
    <Icon name="i-lucide-copy" class="w-4 h-4" />
  </button>
</div>

      <div class="rounded-md border overflow-auto max-h-[70vh] bg-background">
        <table class="w-full min-w-[720px] text-xs">
          <thead class="sticky top-0 z-10 bg-muted shadow-sm">
            <tr class="border-b">
              <th class="h-8 px-2 text-center font-semibold whitespace-nowrap w-[50px]">No</th>
              <th class="h-8 px-2 text-left font-semibold whitespace-nowrap">Date</th>
              <th class="h-8 px-2 text-left font-semibold whitespace-nowrap">Unit</th>
              <th class="h-8 px-2 text-left font-semibold whitespace-nowrap">Category</th>
              <th class="h-8 px-2 text-right font-semibold whitespace-nowrap">Total Hour</th>
              <th class="h-8 px-2 text-right font-semibold whitespace-nowrap">Missing</th>
              <th class="h-8 px-2 text-center font-semibold whitespace-nowrap">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="h-16 text-center text-muted-foreground">
                Loading...
              </td>
            </tr>

            <tr v-for="(item, index) in rows" :key="`${item.date}-${item.unit_code}`"
              class="border-b odd:bg-background even:bg-muted/30 hover:bg-muted/60 transition-colors">
              <td class="px-2 py-1.5 text-center whitespace-nowrap">
                {{ index + 1 }}
              </td>

              <td class="px-2 py-1.5 whitespace-nowrap">
                {{ item.date }}
              </td>

              <td class="px-2 py-1.5 whitespace-nowrap font-medium">
                {{ item.unit }}
              </td>

              <td class="px-2 py-1.5 whitespace-nowrap">
                {{ item.category }}
              </td>

              <td class="px-2 py-1.5 text-right whitespace-nowrap tabular-nums font-medium">
                {{ item.total_hour }}
              </td>

              <td class="px-2 py-1.5 text-right whitespace-nowrap tabular-nums font-medium" :class="{
                'text-yellow-600 dark:text-yellow-400': item.status === 'Incomplete',
                'text-red-600 dark:text-red-400': item.status === 'Over'
              }">
                {{ item.missing_hour }}
              </td>

              <td class="px-2 py-1.5 text-center whitespace-nowrap">
                <span class="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium" :class="{
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300': item.status === 'Incomplete',
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300': item.status === 'Over',
                  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300': item.status === 'Complete'
                }">
                  {{ item.status }}
                </span>
              </td>
            </tr>

            <tr v-if="!loading && rows.length === 0">
              <td colspan="7" class="h-16 text-center text-muted-foreground">
                All unit data complete
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>