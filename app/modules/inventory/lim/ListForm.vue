<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useInfiniteScroll } from "@vueuse/core"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"
import { useCurrentRole } from "@/composables/useCurrentRole"
import { useAuthStore } from "@/stores/auth"
import InventoryToolbar from "@/modules/inventory/components/InventoryMaterialToolbar.vue"

const { isSystem } = useCurrentRole()
const authStore = useAuthStore()

// ambil iup dari user login
const userIupId = authStore.user?.iup_id ?? null

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type InventoryFilters = {
  iup_id: number | null
  sampling_area: string | null
  domes: string[]
  cut_date: string | null
}

type InventoryRow = {
  iup_id: number
  iup_code: string
  stockpile: string
  pile_id: string
  nama_material: string
  total_ore: number
  released?: number | null
  total_selling: number
  balance: number
  ni: number | null
  fe: number | null
  al2o3: number | null
  co: number | null
  mgo: number | null
  sio2: number | null
  cao: number | null
  cr2o3: number | null
  mc?: number | null
  sm: number | null
}

type InventorySummary = {
  total_ore: number
  total_released: number
  total_selling: number
  total_balance: number
  avg_ni: number
  avg_co: number
  avg_al2o3: number
  avg_cao: number
  avg_cr2o3: number
  avg_fe: number
  avg_mgo: number
  avg_sio2: number
  avg_mc: number
  avg_sm: number
}

type InventoryResponse = {
  data: InventoryRow[]
  summary: InventorySummary
  pagination: {
    more: boolean
    total_pages: number
    current_page: number
    total_data: number
  }
}

const { request } = useApi()
const notify = useNotify()

const containerRef = ref<HTMLElement | null>(null)

const rows = ref<InventoryRow[]>([])
const summary = ref<InventorySummary | null>(null)

const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const loading = ref(false)
const initialized = ref(false)

// FILTER (AUTO BY ROLE)
const filters = ref<InventoryFilters>({
  iup_id: isSystem.value ? null : userIupId,
  sampling_area: null,
  domes: [],
  cut_date: todayISO(),
})

const headers = [
  { key: "no", title: "No", align: "left", cls: "w-[70px]" },
  { key: "pile_id", title: "Dome", align: "left", cls: "min-w-[110px]" },
  { key: "nama_material", title: "Material", align: "left", cls: "min-w-[70px]" },
  { key: "total_ore", title: "Total Ore", align: "right", cls: "min-w-[110px]" },
  // { key: "released", title: "Released", align: "right", cls: "min-w-[120px]" },
  { key: "total_selling", title: "Selling", align: "right", cls: "min-w-[120px]" },
  { key: "balance", title: "Balance", align: "right", cls: "min-w-[120px]" },
  { key: "ni", title: "Ni", align: "right", cls: "min-w-[90px]" },
  { key: "fe", title: "Fe", align: "right", cls: "min-w-[90px]" },
  { key: "al2o3", title: "Al2O3", align: "right", cls: "min-w-[90px]" },
  { key: "co", title: "Co", align: "right", cls: "min-w-[90px]" },
  { key: "mgo", title: "MgO", align: "right", cls: "min-w-[90px]" },
  { key: "sio2", title: "SiO2", align: "right", cls: "min-w-[90px]" },
  { key: "cao", title: "CaO", align: "right", cls: "min-w-[90px]" },
  { key: "cr2o3", title: "Cr2O3", align: "right", cls: "min-w-[90px]" },
  { key: "mc", title: "MC", align: "right", cls: "min-w-[90px]" },
  { key: "sm", title: "SM", align: "right", cls: "min-w-[90px]" },
]

function fmt(v: number | null | undefined) {
  if (v == null) return "-"
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })
}

// FETCH (AMAN)
async function fetchInventory(reset = false) {
  // SYSTEM belum pilih IUP → stop
  if (!filters.value.iup_id) {
    rows.value = []
    summary.value = null
    hasMore.value = false
    initialized.value = true
    return
  }

  if (loading.value) return
  if (!hasMore.value && !reset) return

  loading.value = true

  try {
    if (reset) {
      page.value = 1
      hasMore.value = true
      rows.value = []
    }

    const params = new URLSearchParams()

    params.append("iup_id", String(filters.value.iup_id))
    params.append("page", String(page.value))
    params.append("page_size", String(pageSize.value))


    if (filters.value.cut_date) {
      params.append("cut_date", filters.value.cut_date)
    }
    if (filters.value.sampling_area) {
      params.append("areaFilter", filters.value.sampling_area)
    }

    filters.value.domes.forEach((d) => {
      params.append("pointFilter", d)
    })

    const res = await request<InventoryResponse>(
      `/api/geology/raw/inventory/lim/?${params.toString()}`
    )

    const data = res?.data ?? []

    rows.value = reset ? data : [...rows.value, ...data]
    summary.value = res?.summary ?? null
    hasMore.value = !!res?.pagination?.more

    if (data.length && hasMore.value) {
      page.value++
    }
  } catch (e: any) {
    notify.error(e?.message || "Failed load inventory")
  } finally {
    loading.value = false
    initialized.value = true
  }
}

//  APPLY
function applyFilters(v: InventoryFilters) {
  filters.value = { ...v }
  fetchInventory(true)
}

//  RESET
function resetFilters() {
  filters.value = {
    iup_id: isSystem.value ? null : userIupId,
    sampling_area: null,
    domes: [],
    cut_date: todayISO(),
  }
  fetchInventory(true)
}

// SCROLL
useInfiniteScroll(
  containerRef,
  () => fetchInventory(false),
  {
    distance: 120,
    canLoadMore: () => hasMore.value && !loading.value,
  }
)

// INIT
onMounted(() => {
  if (!isSystem.value) {
    fetchInventory(true)
  }
})

function buildClipboardText() {
  if (!rows.value.length) return ""

  const headerTitles = headers.map(h => h.title)

  const bodyRows = rows.value.map((row, idx) => [
    idx + 1,
    row.pile_id || "-",
    row.nama_material || "-",
    fmt(row.total_ore),
    fmt(row.total_selling),
    fmt(row.balance),
    fmt(row.ni),
    fmt(row.fe),
    fmt(row.al2o3),
    fmt(row.co),
    fmt(row.mgo),
    fmt(row.sio2),
    fmt(row.cao),
    fmt(row.cr2o3),
    fmt(row.mc),
    fmt(row.sm),
  ])

  const totalRow = summary.value
    ? [[
        "TOTAL",
        "-",
        "-",
        fmt(summary.value.total_ore),
        fmt(summary.value.total_selling),
        fmt(summary.value.total_balance),
        fmt(summary.value.avg_ni),
        fmt(summary.value.avg_fe),
        fmt(summary.value.avg_al2o3),
        fmt(summary.value.avg_co),
        fmt(summary.value.avg_mgo),
        fmt(summary.value.avg_sio2),
        fmt(summary.value.avg_cao),
        fmt(summary.value.avg_cr2o3),
        fmt(summary.value.avg_mc),
        fmt(summary.value.avg_sm),
      ]]
    : []

  return [headerTitles, ...bodyRows, ...totalRow]
    .map(r => r.join("\t"))
    .join("\n")
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
    <InventoryToolbar
      :filters="filters"
      :loading="loading"
      :can-copy="rows.length > 0"
      @apply="applyFilters"
      @reset="resetFilters"
      @copy="handleCopy"
    />


    <div ref="containerRef" class="h-[70vh] overflow-auto rounded-lg border bg-background">
      <table class="min-w-[1100px] w-full border-separate border-spacing-0 text-sm">
        <thead class="sticky top-0 z-20 bg-background shadow-sm">
          <tr>
            <th v-for="head in headers" :key="head.key" :class="[
              'border-b bg-background px-2 py-2 font-semibold whitespace-nowrap',
              head.align === 'right' ? 'text-right' : 'text-left',
              head.cls,
            ]">
              {{ head.title }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, idx) in rows" :key="`${row.stockpile}-${row.pile_id}-${row.nama_material}-${idx}`"
           class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
            <td class="border-b px-2 py-2">{{ idx + 1 }}</td>
            <td class="border-b px-2 py-2">{{ row.pile_id || "-" }}</td>
            <td class="border-b px-2 py-2">{{ row.nama_material || "-" }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.total_ore) }}</td>
            <!-- <td class="border-b px-2 py-2 text-right">{{ fmt(row.released) }}</td> -->
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.total_selling) }}</td>
            <td class="border-b px-2 py-2 text-right font-medium">{{ fmt(row.balance) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.ni) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.fe) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.al2o3) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.co) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.mgo) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.sio2) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.cao) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.cr2o3) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.mc) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.sm) }}</td>
          </tr>

          <tr v-if="loading">
            <td colspan="17" class="px-2 py-4 text-center text-muted-foreground">
              Loading more...
            </td>
          </tr>

          <tr v-if="!loading && initialized && rows.length === 0">
            <td colspan="17" class="px-2 py-4 text-center text-muted-foreground">
              No data
            </td>
          </tr>
        </tbody>

        <tfoot v-if="summary" class="sticky bottom-0 z-20">
          <tr class="bg-muted/80 font-semibold backdrop-blur">
            <td class="border-t px-2 py-3">TOTAL</td>
            <td class="border-t px-2 py-3">-</td>
            <td class="border-t px-2 py-3">-</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.total_ore) }}</td>
            <!-- <td class="border-t px-2 py-3 text-right">{{ fmt(summary.total_released) }}</td> -->
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.total_selling) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.total_balance) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_ni) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_fe) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_al2o3) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_co) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_mgo) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_sio2) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_cao) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_cr2o3) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_mc) }}</td>
            <td class="border-t px-2 py-3 text-right">{{ fmt(summary.avg_sm) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>