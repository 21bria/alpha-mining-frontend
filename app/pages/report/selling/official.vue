<script setup lang="ts">
import FilterControls from '@/components/filters/FilterCoa.vue'
import { useApi } from '@/composables/useApi'
import { useNotify } from "@/composables/useNotify"

const notify = useNotify()
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

type FilterType = 'monthly' | 'yearly' | 'range'

function handleApply(payload: {
  type: string
  year?: number
  month?: number
  materialFilter?: string
}) {
  fetchCompare({
    ...payload,
    type: payload.type as FilterType   // casting
  })
}

const isLoading = ref(false)
const compareData = ref<any>({})
const detailsData = ref<any[]>([])   // array lebih pas, bukan object
async function fetchCompare(payload: {
  type: string
  year?: number
  month?: number
  materialFilter?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    isLoading.value = true

    const data = await getApi('/api/analytics/raw/barging/coa/all/', {
      filter_type: payload.type,
      year: payload.year,
      month: payload.month,
      materialFilter: payload.materialFilter,
      ...(payload.iup_id && {
        iup_id: Array.isArray(payload.iup_id)
          ? payload.iup_id.join(',')
          : payload.iup_id
      })
    })

    compareData.value = data.compare ?? {}
    detailsData.value = data.details ?? []
  } catch (err) {
    console.error('Gagal fetch compare:', err)
  } finally {
    isLoading.value = false
  }
}

// Format angka 2 desimal
const format2 = (num: number | null | undefined) =>
  typeof num === 'number'
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(num)
    : '-'

//  Jalankan sekali saat komponen pertama kali mount
onMounted(() => {
  const today = new Date()
  fetchCompare({
    type: 'monthly',
    year: today.getFullYear(),
    month: today.getMonth() + 1
  })
})

// Sumproduct 
const compareSummary = computed(() => {
  const data = compareData.value
  const codes = data?.x_data ?? []

  if (!codes.length) return null

  const sum = (arr?: any[]) =>
    (arr ?? []).reduce((a, b) => a + Number(b || 0), 0)

  const weightedAvg = (gradeArr?: any[], tonArr?: any[]) => {
    const totalTon = sum(tonArr)
    if (!totalTon) return 0

    const totalProduct = (gradeArr ?? []).reduce((acc, grade, i) => {
      return acc + Number(grade || 0) * Number(tonArr?.[i] || 0)
    }, 0)

    return totalProduct / totalTon
  }

  const totalSplitTon = sum(data.tonnage_split)
  const totalOfficialTon = sum(data.tonnage_official)

  return {
    totalSplitTon,
    totalOfficialTon,

    niSplit: weightedAvg(data.y_split_ni, data.tonnage_split),
    niOfficial: weightedAvg(data.y_official_ni, data.tonnage_official),

    feSplit: weightedAvg(data.y_split_fe, data.tonnage_split),
    feOfficial: weightedAvg(data.y_official_fe, data.tonnage_official),

    mgoSplit: weightedAvg(data.y_split_mgo, data.tonnage_split),
    mgoOfficial: weightedAvg(data.y_official_mgo, data.tonnage_official),

    sio2Split: weightedAvg(data.y_split_sio2, data.tonnage_split),
    sio2Official: weightedAvg(data.y_official_sio2, data.tonnage_official),
  }
})

function val(v: any) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return ''
  return String(v)
}

// Copy to Clipboard
function buildClipboardText() {
  const data = compareData.value
  const codes = data?.x_data ?? []
  if (!codes.length) return ''

  const sum = (arr?: any[]) =>
    (arr ?? []).reduce((a, b) => a + Number(b || 0), 0)

  const weightedAvg = (gradeArr?: any[], tonArr?: any[]) => {
    const totalTon = sum(tonArr)
    if (!totalTon) return 0

    const totalProduct = (gradeArr ?? []).reduce((acc, grade, i) => {
      return acc + Number(grade || 0) * Number(tonArr?.[i] || 0)
    }, 0)

    return totalProduct / totalTon
  }

  // HEADER
  const headers = [
    'No',
    'Code',
    'Ni',
    'Ni(COA)',
    'Ni(Diff)',
    'Fe',
    'Fe(COA)',
    'Fe(Diff)',
    'MgO',
    'MgO(COA)',
    'MgO(Diff)',
    'SiO2',
    'SiO2(COA)',
    'SiO2(Diff)',
    'Tonnage',
    'COA (Ton)',
    'Ton(Diff)',
  ]

  // ROW DATA
  const rows = codes.map((code: string, i: number) => [
    i + 1,
    code,

    val(data?.y_split_ni?.[i]),
    val(data?.y_official_ni?.[i]),
    `${format2(data?.ni_diff?.[i])}%`,

    val(data?.y_split_fe?.[i]),
    val(data?.y_official_fe?.[i]),
    `${format2(data?.fe_diff?.[i])}%`,

    val(data?.y_split_mgo?.[i]),
    val(data?.y_official_mgo?.[i]),
    `${format2(data?.mgo_diff?.[i])}%`,

    val(data?.y_split_sio2?.[i]),
    val(data?.y_official_sio2?.[i]),
    `${format2(data?.sio2_diff?.[i])}%`,

    val(data?.tonnage_split?.[i]),
    val(data?.tonnage_official?.[i]),
    `${format2(data?.tonnage_diff?.[i])}%`,
  ])

  // SUMMARY (SUM PRODUCT)
  const summaryRow = [
    'TOTAL / AVG',
    '-',

    format2(weightedAvg(data.y_split_ni, data.tonnage_split)),
    format2(weightedAvg(data.y_official_ni, data.tonnage_official)),
    '-',

    format2(weightedAvg(data.y_split_fe, data.tonnage_split)),
    format2(weightedAvg(data.y_official_fe, data.tonnage_official)),
    '-',

    format2(weightedAvg(data.y_split_mgo, data.tonnage_split)),
    format2(weightedAvg(data.y_official_mgo, data.tonnage_official)),
    '-',

    format2(weightedAvg(data.y_split_sio2, data.tonnage_split)),
    format2(weightedAvg(data.y_official_sio2, data.tonnage_official)),
    '-',

    format2(sum(data.tonnage_split)),
    format2(sum(data.tonnage_official)),
    '-',
  ]

  // FINAL TEXT
  return [
    headers,
    ...rows,
    [], // spacer (biar ada jarak di Excel)
    summaryRow
  ]
    .map(r => r.join('\t'))
    .join('\n')
}
async function handleCopy() {
  try {
    const text = buildClipboardText()
    if (!text) return

    await navigator.clipboard.writeText(text)
    notify.success('Copied! Paste directly into Excel 👍')
  } catch (err) {
    console.error('Copy failed', err)
    notify.error('Failed to copy table')
  }
}
</script>


<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Compare Internal vs Official COA
        </h1>
        <p class="text-muted-foreground">
          Here&apos;s a list of your coa for this data!
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <FilterControls @apply="handleApply" />
      </div>

    </div>
    <!-- Tabel Data -->
    <!-- HEADER -->
    <div class="flex items-center justify-between border-b pb-2 mb-2 mt-3">
      <div class="text-base font-semibold">
        Data Compare Internal vs Official
      </div>

      <button @click="handleCopy" :disabled="!(compareData?.x_data?.length)"
        class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
        title="Copy table">
        <Icon name="i-lucide-copy" class="w-4 h-4" />
      </button>
    </div>

    <!-- TABLE -->
    <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">
      Loading...
    </div>

    <div v-else>
      <div class="h-[65vh] overflow-auto rounded-lg border bg-background">
        <table class="min-w-[1300px] w-full border-separate border-spacing-0 text-sm whitespace-nowrap">
     

          <thead class="sticky top-0 z-20 bg-background shadow-sm">
            <tr class="text-sm">
              <th class="border-b px-2 py-2 text-left font-semibold">No</th>
              <th class="border-b px-2 py-2 text-left font-semibold">Code</th>

              <th class="border-b px-2 py-2 text-right font-semibold">Ni</th>
              <th class="border-b px-2 py-2 text-right font-semibold">Ni(COA)</th>
              <th class="border-b px-2 py-2 text-right font-semibold">Ni(Diff)</th>

              <th class="border-b px-2 py-2 text-right font-semibold">Fe</th>
              <th class="border-b px-2 py-2 text-right font-semibold">Fe(COA)</th>
              <th class="border-b px-2 py-2 text-right font-semibold">Fe(Diff)</th>

              <th class="border-b px-2 py-2 text-right font-semibold">MgO</th>
              <th class="border-b px-2 py-2 text-right font-semibold">MgO(COA)</th>
              <th class="border-b px-2 py-2 text-right font-semibold">MgO(Diff)</th>

              <th class="border-b px-2 py-2 text-right font-semibold">SiO2</th>
              <th class="border-b px-2 py-2 text-right font-semibold">SiO2(COA)</th>
              <th class="border-b px-2 py-2 text-right font-semibold">SiO2(Diff)</th>

              <th class="border-b px-2 py-2 text-right font-semibold">Tonnage</th>
              <th class="border-b px-2 py-2 text-right font-semibold">COA (Ton)</th>
              <th class="border-b px-2 py-2 text-right font-semibold">Ton(Diff)</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(code, i) in compareData?.x_data" :key="code"
              class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40">
              <td class="border-b px-2 py-2">{{ Number(i) + 1 }}</td>
              <td class="border-b px-2 py-2">{{ code }}</td>

              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_split_ni[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_official_ni[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ format2(compareData?.ni_diff[i]) }}%</td>

              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_split_fe[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_official_fe[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ format2(compareData?.fe_diff[i]) }}%</td>

              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_split_mgo[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_official_mgo[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ format2(compareData?.mgo_diff[i]) }}%</td>

              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_split_sio2[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ compareData?.y_official_sio2[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ format2(compareData?.sio2_diff[i]) }}%</td>

              <td class="border-b px-2 py-2 text-right">{{ compareData?.tonnage_split[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ compareData?.tonnage_official[i] }}</td>
              <td class="border-b px-2 py-2 text-right">{{ format2(compareData?.tonnage_diff[i]) }}%</td>
            </tr>
          </tbody>
          <tfoot v-if="compareSummary" class="sticky bottom-0 z-20 bg-muted/90 backdrop-blur">
            <tr class="font-semibold">
              <td class="border-t px-2 py-3" colspan="2">TOTAL / AVG</td>

              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.niSplit) }}</td>
              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.niOfficial) }}</td>
              <td class="border-t px-2 py-3 text-right">-</td>

              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.feSplit) }}</td>
              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.feOfficial) }}</td>
              <td class="border-t px-2 py-3 text-right">-</td>

              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.mgoSplit) }}</td>
              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.mgoOfficial) }}</td>
              <td class="border-t px-2 py-3 text-right">-</td>

              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.sio2Split) }}</td>
              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.sio2Official) }}</td>
              <td class="border-t px-2 py-3 text-right">-</td>

              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.totalSplitTon) }}</td>
              <td class="border-t px-2 py-3 text-right">{{ format2(compareSummary.totalOfficialTon) }}</td>
              <td class="border-t px-2 py-3 text-right">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
