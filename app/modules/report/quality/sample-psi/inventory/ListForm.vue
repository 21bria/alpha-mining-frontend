<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useInfiniteScroll } from "@vueuse/core"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"
import { useCurrentRole } from "@/composables/useCurrentRole"
import { useAuthStore } from "@/stores/auth"
import InventoryToolbar from "@/modules/report/quality/sample-psi/components/InventoryToolbar.vue"

const notify = useNotify()

const { isSystem } = useCurrentRole()
const authStore = useAuthStore()

// ambil iup dari user login
const userIupId = authStore.user?.iup_id ?? null

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type InventoryFilters = {
  iup_id: number | null
  material: string | null
  sampling_area: string | null
  domes: string[]
}

type InventoryRow = {
  iup_id: number
  iup_code: string
  stockpile: string
  pile_id: string
  id_pile: number
  nama_material: string

  inventory_total_ore: number
  psi_allocated_tonnage: number
  diff_tonnage: number
  diff_tonnage_pct: number | null

  inventory_ni: number | null
  psi_ni: number | null
  diff_ni_pct: number | null

  inventory_fe: number | null
  psi_fe: number | null
  diff_fe_pct: number | null

  inventory_mgo: number | null
  psi_mgo: number | null
  diff_mgo_pct: number | null

  inventory_sio2: number | null
  psi_sio2: number | null
  diff_sio2_pct: number | null

  inventory_sm: number | null
  psi_sm: number | null
  diff_sm_pct: number | null

  psi_status: "HAS_PSI" | "NO_PSI"
}

type InventorySummary = {
  inventory_total_ore: number
  psi_allocated_tonnage: number
  diff_tonnage: number
  total_dome: number
  total_has_psi: number
  total_no_psi: number

  inventory_avg_ni: number
  inventory_avg_fe: number
  inventory_avg_mgo: number
  inventory_avg_sio2: number
  inventory_avg_sm: number

  psi_avg_ni: number
  psi_avg_fe: number
  psi_avg_mgo: number
  psi_avg_sio2: number
  psi_avg_sm: number
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

const containerRef = ref<HTMLElement | null>(null)

const rows = ref<InventoryRow[]>([])
const summary = ref<InventorySummary | null>(null)

const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const loading = ref(false)
const initialized = ref(false)

//  FILTER (AUTO BY ROLE)
const filters = ref<InventoryFilters>({
  iup_id: isSystem.value ? null : userIupId,
  material: null,
  sampling_area: null,
  domes: [],
})

const headers = [
  { key: "no", title: "No", align: "left", cls: "w-[70px]" },
  { key: "psi_status", title: "Status", align: "left", cls: "min-w-[100px]" },
  { key: "pile_id", title: "Dome", align: "left", cls: "min-w-[110px]" },
  { key: "nama_material", title: "Material", align: "left", cls: "min-w-[90px]" },
  { key: "inventory_total_ore", title: "Inv Ore", align: "right", cls: "min-w-[120px]" },
  { key: "psi_allocated_tonnage", title: "PSI Ton", align: "right", cls: "min-w-[120px]" },
  { key: "diff_tonnage", title: "Diff Ton", align: "right", cls: "min-w-[120px]" },
  { key: "diff_tonnage_pct", title: "Diff Ton %", align: "right", cls: "min-w-[110px]" },

  { key: "inventory_ni", title: "Inv Ni", align: "right", cls: "min-w-[90px]" },
  { key: "psi_ni", title: "PSI Ni", align: "right", cls: "min-w-[90px]" },
  { key: "diff_ni_pct", title: "Ni %", align: "right", cls: "min-w-[90px]" },

  { key: "inventory_fe", title: "Inv Fe", align: "right", cls: "min-w-[90px]" },
  { key: "psi_fe", title: "PSI Fe", align: "right", cls: "min-w-[90px]" },
  { key: "diff_fe_pct", title: "Fe %", align: "right", cls: "min-w-[90px]" },

  { key: "inventory_mgo", title: "Inv MgO", align: "right", cls: "min-w-[90px]" },
  { key: "psi_mgo", title: "PSI MgO", align: "right", cls: "min-w-[90px]" },
  { key: "diff_mgo_pct", title: "MgO %", align: "right", cls: "min-w-[90px]" },

  { key: "inventory_sio2", title: "Inv SiO2", align: "right", cls: "min-w-[90px]" },
  { key: "psi_sio2", title: "PSI SiO2", align: "right", cls: "min-w-[90px]" },
  { key: "diff_sio2_pct", title: "SiO2 %", align: "right", cls: "min-w-[90px]" },

  { key: "inventory_sm", title: "Inv SM", align: "right", cls: "min-w-[90px]" },
  { key: "psi_sm", title: "PSI SM", align: "right", cls: "min-w-[90px]" },
  { key: "diff_sm_pct", title: "SM %", align: "right", cls: "min-w-[90px]" },

  
]

function fmt(v: number | null | undefined) {
  if (v == null) return "-"
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })
}

//  FETCH (AMAN)
async function fetchInventory(reset = false) {
  //  SYSTEM belum pilih IUP → stop
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

    if (filters.value.material) {
      params.append("material", filters.value.material)
    }

    if (filters.value.sampling_area) {
      params.append("areaFilter", filters.value.sampling_area)
    }

    filters.value.domes.forEach((d) => {
      params.append("pointFilter", d)
    })

    const res = await request<InventoryResponse>(
      `/api/analytics/raw/inventory/reconciliation/psi/?${params.toString()}`
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

// APPLY
function applyFilters(v: InventoryFilters) {
  filters.value = { ...v }
  fetchInventory(true)
}

//  RESET
function resetFilters() {
  filters.value = {
    iup_id: isSystem.value ? null : userIupId,
    material: null,
    sampling_area: null,
    domes: [],
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
    row.psi_status,
    row.stockpile || "-",
    row.pile_id || "-",
    row.nama_material || "-",
    fmt(row.inventory_total_ore),
    fmt(row.psi_allocated_tonnage),
    fmt(row.diff_tonnage),
    fmt(row.diff_tonnage_pct),
    fmt(row.inventory_ni),
    fmt(row.psi_ni),
    fmt(row.diff_ni_pct),
    fmt(row.inventory_fe),
    fmt(row.psi_fe),
    fmt(row.diff_fe_pct),
    fmt(row.inventory_mgo),
    fmt(row.psi_mgo),
    fmt(row.diff_mgo_pct),
    fmt(row.inventory_sio2),
    fmt(row.psi_sio2),
    fmt(row.diff_sio2_pct),
    fmt(row.inventory_sm),
    fmt(row.psi_sm),
    fmt(row.diff_sm_pct),
])

 const totalRow = summary.value
  ? [[
      "TOTAL",
      `Dome:${summary.value.total_dome}`,
      `PSI:${summary.value.total_has_psi}`,
      "-",
      "-",

      fmt(summary.value.inventory_total_ore),
      fmt(summary.value.psi_allocated_tonnage),
      fmt(summary.value.diff_tonnage),
      "-",

      fmt(summary.value.inventory_avg_ni),
      fmt(summary.value.psi_avg_ni),
      "-",

      fmt(summary.value.inventory_avg_fe),
      fmt(summary.value.psi_avg_fe),
      "-",

      fmt(summary.value.inventory_avg_mgo),
      fmt(summary.value.psi_avg_mgo),
      "-",

      fmt(summary.value.inventory_avg_sio2),
      fmt(summary.value.psi_avg_sio2),
      "-",

      fmt(summary.value.inventory_avg_sm),
      fmt(summary.value.psi_avg_sm),
      "-",
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

    <div ref="containerRef" class="h-[70vh] overflow-auto scroll-thin rounded-lg border bg-background">
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
           <td class="border-b px-2 py-2">
              <span
                :class="[
                  'rounded px-2 py-0.5 text-xs font-medium',
                  row.psi_status === 'HAS_PSI'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                ]"
              >
                {{ row.psi_status }}
              </span>
            </td>

            <!-- <td class="border-b px-2 py-2">{{ row.stockpile || "-" }}</td> -->
            <td class="border-b px-2 py-2">{{ row.pile_id || "-" }}</td>
            <td class="border-b px-2 py-2">{{ row.nama_material || "-" }}</td>

            <td class="border-b px-2 py-2 text-right">{{ fmt(row.inventory_total_ore) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.psi_allocated_tonnage) }}</td>
            <td class="border-b px-2 py-2 text-right font-medium">{{ fmt(row.diff_tonnage) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.diff_tonnage_pct) }}%</td>

            <td class="border-b px-2 py-2 text-right">{{ fmt(row.inventory_ni) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.psi_ni) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.diff_ni_pct) }}%</td>

            <td class="border-b px-2 py-2 text-right">{{ fmt(row.inventory_fe) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.psi_fe) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.diff_fe_pct) }}%</td>

            <td class="border-b px-2 py-2 text-right">{{ fmt(row.inventory_mgo) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.psi_mgo) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.diff_mgo_pct) }}%</td>

            <td class="border-b px-2 py-2 text-right">{{ fmt(row.inventory_sio2) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.psi_sio2) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.diff_sio2_pct) }}%</td>

            <td class="border-b px-2 py-2 text-right">{{ fmt(row.inventory_sm) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.psi_sm) }}</td>
            <td class="border-b px-2 py-2 text-right">{{ fmt(row.diff_sm_pct) }}%</td>
  
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

            <td class="border-t px-2 py-3" colspan="4">
              Dome: {{ fmt(summary.total_dome) }}
              |
              HAS PSI: {{ fmt(summary.total_has_psi) }}
              |
              NO PSI: {{ fmt(summary.total_no_psi) }}
            </td>

            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.inventory_total_ore) }}
            </td>

            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.psi_allocated_tonnage) }}
            </td>

            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.diff_tonnage) }}
            </td>

            <td class="border-t px-2 py-3 text-right">-</td>

            <!-- NI -->
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.inventory_avg_ni) }}
            </td>
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.psi_avg_ni) }}
            </td>
            <td class="border-t px-2 py-3 text-right">-</td>

            <!-- FE -->
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.inventory_avg_fe) }}
            </td>
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.psi_avg_fe) }}
            </td>
            <td class="border-t px-2 py-3 text-right">-</td>

            <!-- MGO -->
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.inventory_avg_mgo) }}
            </td>
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.psi_avg_mgo) }}
            </td>
            <td class="border-t px-2 py-3 text-right">-</td>

            <!-- SIO2 -->
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.inventory_avg_sio2) }}
            </td>
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.psi_avg_sio2) }}
            </td>
            <td class="border-t px-2 py-3 text-right">-</td>

            <!-- SM -->
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.inventory_avg_sm) }}
            </td>
            <td class="border-t px-2 py-3 text-right">
              {{ fmt(summary.psi_avg_sm) }}
            </td>
            <td class="border-t px-2 py-3 text-right">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>


</style>
