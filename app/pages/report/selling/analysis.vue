<script setup lang="ts">
import FilterControls from '@/components/filters/FilterCoa.vue'
import { useApi } from '@/composables/useApi'
import OfficialDetailChart from "@/modules/report/seling/OfficialDetailChart.vue"
type FilterType = 'monthly' | 'yearly' | 'range'
// Ambil query params dari URL
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

const route = useRoute()
const filterType = String(route.query.filter_type || '')

function handleApply(payload: {
  type: string
  year?: number
  month?: number
  materialFilter?: string
}) {
  fetchCompare({
    ...payload,
    type: payload.type as FilterType 
  })
}

const isLoading = ref(false)
const compareData = ref<any>({})
const detailsData = ref<any[]>([])

async function fetchCompare(payload: {
  type: FilterType
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
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(num)
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
</script>


<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-start gap-2">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
          Analysis Internal vs Official COA
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-muted-foreground">
          Here&apos;s a chart of your coa for this data!
        </p>
      </div>

    </div>
    <div class="flex items-center space-x-2">
      <FilterControls @apply="handleApply" />
    </div>
    <!-- Tabel Data -->
    <div class="grid grid-cols-12 gap-4">
      <div class="xl:col-span-10 col-span-12">
        <Card class="w-full overflow-hidden overflow-x-auto mt-6">
          <CardHeader>
            <CardTitle>Internal vs Official (Ni%)</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <OfficialDetailChart metric="ni" :filterType="filterType" />
          </CardContent>
          <CardContent class="pl-2 overflow-hidden overflow-x-auto">
            <OfficialDetailChart metric="ni" :compare="compareData" :details="detailsData" />
          </CardContent>
        </Card>
      </div>
      <div class="xl:col-span-10 col-span-12">
        <Card class="w-full overflow-hidden overflow-x-auto mt-6">
          <CardHeader>
            <CardTitle>Internal vs Official (Fe%)</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <OfficialDetailChart metric="fe" :filterType="filterType" />
          </CardContent>
          <CardContent class="pl-2 overflow-hidden overflow-x-auto">
            <OfficialDetailChart metric="fe" :compare="compareData" :details="detailsData" />
          </CardContent>
        </Card>
      </div>
      <div class="xl:col-span-10 col-span-12">
        <Card class="w-full overflow-hidden overflow-x-auto mt-6">
          <CardHeader>
            <CardTitle>Internal vs Official (MgO%)</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <OfficialDetailChart metric="mgo" :filterType="filterType" />
          </CardContent>
          <CardContent class="pl-2 overflow-hidden overflow-x-auto">
            <OfficialDetailChart metric="mgo" :compare="compareData" :details="detailsData" />
          </CardContent>
        </Card>
      </div>
      <div class="xl:col-span-10 col-span-12">
        <Card class="w-full overflow-hidden overflow-x-auto mt-6">
          <CardHeader>
            <CardTitle>Internal vs Official (Sio2%)</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <OfficialDetailChart metric="sio2" :filterType="filterType" />
          </CardContent>
          <CardContent class="pl-2 overflow-hidden overflow-x-auto">
            <OfficialDetailChart metric="sio2" :compare="compareData" :details="detailsData" />
          </CardContent>
        </Card>
      </div>
      <!-- <div class="xl:col-span-9 col-span-12">
        <Card class="w-full overflow-x-auto mt-6">
          <CardHeader>
            <CardTitle>Internal vs Official (SM%)</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <OfficialDetailChart metric="sm" :filterType="filterType" />
          </CardContent>
          <CardContent class="pl-2">
            <OfficialDetailChart metric="sm" :compare="compareData" :details="detailsData" />
          </CardContent>
        </Card>
      </div> -->
    </div>
  </div>
</template>

<style scoped></style>
