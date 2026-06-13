<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import type { DateRange } from "reka-ui"
import type { Ref } from "vue"
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date"
import { Calendar as CalendarIcon } from "lucide-vue-next"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApi } from "@/composables/useApi"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"

const { request } = useApi()

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type LookupOption = {
  value: string | number
  label: string
}

type PlanMiningRow = {
  material: string | number | null
  material_label?: string | null
  tonnage: string
}

export type PlanProductionPayload = {
  id?: string
  iup?: number | null
  date_start: string | null
  date_end: string | null
  category: string | null
  source_code?: string | null
  vendor_code: string | null
  details: Array<{
    material_code: string
    material_name: string
    tonnage: number
  }>
  user?: number | null
}

type PlanProductionFormState = {
  id?: string
  iup: number | null
  date_start: string
  date_end: string
  category: string
  vendor_code: string | null
  source_code: string | null
  rows: PlanMiningRow[]
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: any | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: PlanProductionPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() => (props.mode === "create" ? "Add Plan Production" : "Edit Plan Production"))

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
})

const today = new Date()
const defaultStartDate = new CalendarDate(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate(),
)

const defaultEndDate = new CalendarDate(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate(),
)

const period = ref({
  start: defaultStartDate,
  end: defaultEndDate,
}) as Ref<DateRange>

const periodError = ref<string | null>(null)

const local = ref<PlanProductionFormState>({
  iup: null,
  date_start: "",
  date_end: "",
  category: "Mining",
  vendor_code: null,
  source_code: null,
  rows: [
    {
      material: null,
      material_label: null,
      tonnage: "",
    },
  ],
})

function close() {
  emit("update:open", false)
}

function toNumber(v: string | number | null | undefined) {
  if (v == null) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

function normalizeIupId(v: any): number | null {
  if (v == null) return null

  if (typeof v === "number") return v

  if (typeof v === "string" && v !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  if (typeof v === "object") {
    const n = Number(v.value ?? v.id ?? null)
    return Number.isFinite(n) ? n : null
  }

  return null
}

function parseCalendarDate(value?: string | null) {
  if (!value) return null

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) return null

  return new CalendarDate(year, month, day)
}

/* IUP LOOKUP */
const iupOptions = ref<LookupOption[]>([])
const iupLoading = ref(false)
const iupSearch = ref("")
const iupPage = ref(1)
const iupHasMore = ref(true)

async function fetchIUP(q = "", page = 1) {
  if (iupLoading.value) return
  iupLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: {
        search: q,
        page,
        page_size: 10,
      },
    })

    const items = (res?.results ?? []) as LookupOption[]
    const count = Number(res?.count ?? items.length)

    iupOptions.value = page === 1 ? items : [...iupOptions.value, ...items]
    iupPage.value = page
    iupHasMore.value = iupOptions.value.length < count
  } finally {
    iupLoading.value = false
  }
}

const onIupSearch = useDebounceFn((q: string) => {
  iupPage.value = 1
  iupHasMore.value = true
  fetchIUP(q, 1)
}, 300)

const selectedIupLabel = computed(() => {
  if (local.value.iup == null) return null

  return iupOptions.value.find(
    (x) => Number(x.value) === Number(local.value.iup),
  )?.label ?? null
})

/* VENDOR LOOKUP */
const vendorOptions = ref<LookupOption[]>([])
const vendorLoading = ref(false)
const vendorSearch = ref("")
const vendorPage = ref(1)
const vendorHasMore = ref(true)

async function fetchVendors(q = "", page = 1) {
  if (vendorLoading.value) return
  vendorLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/vendors/", {
      method: "GET",
      query: {
        search: q,
        q,
        page,
        page_size: 10,
      },
    })

    const rawItems = res?.results ?? []

    const items = rawItems.map((item: any) => ({
      value: item.value ?? item.code ?? item.id,
      label: item.label ?? item.name ?? item.vendor_name ?? String(item.value ?? item.code ?? item.id),
    }))

    const count = Number(res?.count ?? items.length)

    vendorOptions.value = page === 1 ? items : [...vendorOptions.value, ...items]
    vendorPage.value = page
    vendorHasMore.value = vendorOptions.value.length < count
  } finally {
    vendorLoading.value = false
  }
}

const onVendorSearch = useDebounceFn((q: string) => {
  vendorPage.value = 1
  vendorHasMore.value = true
  fetchVendors(q, 1)
}, 300)

const selectedVendorLabel = computed(() => {
  if (!local.value.vendor_code) return null

  return vendorOptions.value.find(
    (x) => String(x.value) === String(local.value.vendor_code),
  )?.label ?? null
})

/* MATERIAL LOOKUP */
const materialOptions = ref<LookupOption[]>([])
const materialLoading = ref(false)
const materialSearch = ref("")
const materialPage = ref(1)
const materialHasMore = ref(true)

async function fetchMaterials(q = "", page = 1) {
  if (materialLoading.value) return
  materialLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/material/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 20,
        value_key: "id",
        label_key: "name",
      },
    })

    const rawItems = res?.results ?? []

    const items = rawItems.map((item: any) => ({
      value: item.value ?? item.id,
      label: item.label ?? item.name ?? item.material ?? String(item.value ?? item.id),
    }))

    const count = Number(res?.count ?? items.length)

    materialOptions.value =
      page === 1
        ? items
        : [...materialOptions.value, ...items]

    materialPage.value = page
    materialHasMore.value = materialOptions.value.length < count
  } finally {
    materialLoading.value = false
  }
}

const onMaterialSearch = useDebounceFn((q: string) => {
  materialPage.value = 1
  materialHasMore.value = true
  fetchMaterials(q, 1)
}, 300)

const selectedMaterialOptions = computed(() => {
  return local.value.rows
    .filter((row) => row.material != null)
    .map((row) => ({
      value: row.material as string | number,
      label: row.material_label || String(row.material),
    }))
})

const visibleMaterialOptions = computed(() => {
  const map = new Map<string, LookupOption>()

  for (const item of selectedMaterialOptions.value) {
    map.set(String(item.value), item)
  }

  for (const item of materialOptions.value) {
    map.set(String(item.value), item)
  }

  return Array.from(map.values())
})

function updateRowMaterial(index: number, value: string) {
  const row = local.value.rows[index]
  if (!row) return

  const selected = visibleMaterialOptions.value.find(
    (x) => String(x.value) === String(value),
  )

  row.material = value
  row.material_label = selected?.label ?? value
}

function addRow() {
  local.value.rows.push({
    material: null,
    material_label: null,
    tonnage: "",
  })
}

function removeRow(index: number) {
  if (local.value.rows.length <= 1) return
  local.value.rows.splice(index, 1)
}

const materialTotals = computed(() => {
  const result: Record<string, number> = {}

  for (const row of local.value.rows) {
    const label = row.material_label
    if (!label) continue

    result[label] = (result[label] || 0) + toNumber(row.tonnage)
  }

  return result
})

const grandTotal = computed(() => {
  return Object.values(materialTotals.value).reduce((sum, value) => sum + value, 0)
})

const hasValidRows = computed(() => {
  return local.value.rows.some((row) => row.material && toNumber(row.tonnage) > 0)
})

const canSubmit = computed(() => {
  if (!canMutate.value) return false
  if (props.loading) return false
  if (requiresIup.value && !local.value.iup) return false
  if (!period.value.start || !period.value.end) return false
  if (!local.value.category) return false
  if (!hasValidRows.value) return false

  return true
})

function getPeriodDays() {
  if (!period.value.start || !period.value.end) return 0

  const start = period.value.start.toDate(getLocalTimeZone())
  const end = period.value.end.toDate(getLocalTimeZone())

  return (
    Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1
  )
}

function validatePeriod() {
  periodError.value = null

  if (!period.value.start || !period.value.end) {
    periodError.value = "Period wajib diisi"
    return false
  }

  const days = getPeriodDays()

  if (days < 1) {
    periodError.value = "Tanggal akhir tidak boleh lebih kecil dari tanggal awal"
    return false
  }

  if (days > 31) {
    periodError.value = "Periode maksimal 1 bulan"
    return false
  }

  return true
}

function submit() {
  if (!validatePeriod()) return

  const details = local.value.rows
    .filter((row) => row.material && toNumber(row.tonnage) > 0)
    .map((row) => ({
      material_code: String(row.material),
      material_name: row.material_label || String(row.material),
      tonnage: toNumber(row.tonnage),
    }))

  const payload: PlanProductionPayload = {
    id: local.value.id,
    date_start: period.value.start ? period.value.start.toString() : null,
    date_end: period.value.end ? period.value.end.toString() : null,
    category: local.value.category || null,
    source_code: local.value.source_code || null,
    vendor_code: local.value.vendor_code ? String(local.value.vendor_code) : null,
    details,
  }

  if (canChooseIup.value) {
    payload.iup = local.value.iup
  }

  emit("submit", payload)
}

watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const iupId = normalizeIupId(props.initial?.iup ?? props.initial?.iup_id)

    const dateStart = props.initial?.date_start ?? props.initial?.date_plan ?? ""
    const dateEnd = props.initial?.date_end ?? props.initial?.date_plan ?? ""

    const periodStart = parseCalendarDate(dateStart)
    const periodEnd = parseCalendarDate(dateEnd)

    if (periodStart && periodEnd) {
      period.value = {
        start: periodStart,
        end: periodEnd,
      }
    } else {
      period.value = {
        start: defaultStartDate,
        end: defaultEndDate,
      }
    }

    const initialDetails = Array.isArray(props.initial?.details)
      ? props.initial.details
      : []

    const rowsFromDetails = initialDetails.map((item: any) => ({
      material: item.material_code ?? item.material ?? null,
      material_label: item.material_name ?? item.material_label ?? item.material_code ?? null,
      tonnage: item.tonnage == null ? "" : String(item.tonnage),
    }))

    local.value = {
      id: props.initial?.id,
      iup: iupId,
      date_start: dateStart,
      date_end: dateEnd,
      category: props.initial?.category ?? "Mining",
      source_code: props.initial?.source_code ?? props.initial?.sources ?? null,
      vendor_code: props.initial?.vendor_code ?? props.initial?.vendors ?? null,
      rows: rowsFromDetails.length
        ? rowsFromDetails
        : [
            {
              material: null,
              material_label: null,
              tonnage: "",
            },
          ],
    }

    await Promise.all([
      canChooseIup.value ? fetchIUP("", 1) : Promise.resolve(),
      fetchVendors("", 1),
      fetchMaterials("", 1),
    ])

    if (iupId != null && !iupOptions.value.some((x) => Number(x.value) === iupId)) {
      iupOptions.value = [
        {
          value: iupId,
          label: props.initial?.iup_code ?? props.initial?.iup_name ?? `IUP #${iupId}`,
        },
        ...iupOptions.value,
      ]
    }

    if (
      local.value.vendor_code &&
      !vendorOptions.value.some((x) => String(x.value) === String(local.value.vendor_code))
    ) {
      vendorOptions.value = [
        {
          value: local.value.vendor_code,
          label:
            props.initial?.vendor_name ??
            props.initial?.vendor_code ??
            props.initial?.vendors ??
            String(local.value.vendor_code),
        },
        ...vendorOptions.value,
      ]
    }
  },
  { immediate: true },
)

watch(
  period,
  () => {
    periodError.value = null
  },
  { deep: true },
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="max-h-[90vh] overflow-hidden sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid max-h-[72vh] gap-5 overflow-y-auto pr-2 py-2">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- IUP -->
          <div v-if="canChooseIup" class="grid gap-2">
            <label class="text-sm font-medium">IUP</label>

            <Select
              :model-value="local.iup != null ? String(local.iup) : ''"
              :disabled="iupLoading || !canMutate"
              @update:model-value="(v) => (local.iup = v ? Number(v) : null)"
            >
              <SelectTrigger class="h-10">
                <SelectValue :placeholder="iupLoading ? 'Loading...' : 'Select IUP'" />
              </SelectTrigger>

              <SelectContent class="max-h-80 overflow-auto">
                <SelectGroup>
                  <div class="sticky top-0 z-10 border-b bg-background/80 p-2 backdrop-blur">
                    <Input
                      v-model="iupSearch"
                      placeholder="Search IUP..."
                      class="h-8"
                      @input="onIupSearch(iupSearch)"
                      @keydown.stop
                      @click.stop
                    />
                  </div>

                  <div
                    v-if="local.iup != null && selectedIupLabel"
                    class="border-b bg-background/80 px-2 py-1 text-xs"
                  >
                    Selected:
                    <span class="font-medium">{{ selectedIupLabel }}</span>
                  </div>

                  <SelectItem
                    v-for="o in iupOptions"
                    :key="String(o.value)"
                    :value="String(o.value)"
                  >
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="iupLoading" class="p-2 text-sm text-muted-foreground">
                    Loading...
                  </div>

                  <div v-if="!iupLoading && !iupOptions.length" class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('iup')" class="text-sm text-destructive">
              {{ fieldError("iup") }}
            </p>
          </div>

          <!-- Period -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">Period Plan</label>

            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="
                    cn(
                      'h-10 justify-start text-left font-normal',
                      !period.start && 'text-muted-foreground',
                    )
                  "
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />

                  <template v-if="period.start">
                    <template v-if="period.end">
                      {{ df.format(period.start.toDate(getLocalTimeZone())) }}
                      -
                      {{ df.format(period.end.toDate(getLocalTimeZone())) }}
                    </template>
                    <template v-else>
                      {{ df.format(period.start.toDate(getLocalTimeZone())) }}
                    </template>
                  </template>

                  <template v-else>
                    Pick date range
                  </template>
                </Button>
              </PopoverTrigger>

              <PopoverContent class="w-auto p-0" align="start">
                <RangeCalendar
                  v-model="period"
                  weekday-format="short"
                  :number-of-months="2"
                  initial-focus
                  :placeholder="period.start"
                  @update:start-value="(startDate: any) => period.start = startDate"
                />
              </PopoverContent>
            </Popover>

            <p v-if="periodError" class="text-sm text-destructive">
              {{ periodError }}
            </p>
          </div>

          <!-- Category -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">Category</label>

            <Select v-model="local.category" :disabled="!canMutate">
              <SelectTrigger class="h-10">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Mining">Mining</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('category')" class="text-sm text-destructive">
              {{ fieldError("category") }}
            </p>
          </div>

          <!-- Vendor -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">Vendor</label>

            <Select
              :model-value="local.vendor_code ? String(local.vendor_code) : ''"
              :disabled="vendorLoading || !canMutate"
              @update:model-value="(v) => (local.vendor_code = v ? String(v) : null)"
            >
              <SelectTrigger class="h-10">
                <SelectValue :placeholder="vendorLoading ? 'Loading...' : 'Select vendor'" />
              </SelectTrigger>

              <SelectContent class="max-h-80 overflow-auto">
                <SelectGroup>
                  <div class="sticky top-0 z-10 border-b bg-background/80 p-2 backdrop-blur">
                    <Input
                      v-model="vendorSearch"
                      placeholder="Search vendor..."
                      class="h-8"
                      @input="onVendorSearch(vendorSearch)"
                      @keydown.stop
                      @click.stop
                    />
                  </div>

                  <div
                    v-if="local.vendor_code && selectedVendorLabel"
                    class="border-b bg-background/80 px-2 py-1 text-xs"
                  >
                    Selected:
                    <span class="font-medium">{{ selectedVendorLabel }}</span>
                  </div>

                  <SelectItem
                    v-for="o in vendorOptions"
                    :key="String(o.value)"
                    :value="String(o.value)"
                  >
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="vendorLoading" class="p-2 text-sm text-muted-foreground">
                    Loading...
                  </div>

                  <div v-if="!vendorLoading && !vendorOptions.length" class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('vendor_code') || fieldError('vendors')" class="text-sm text-destructive">
              {{ fieldError("vendor_code") || fieldError("vendors") }}
            </p>
          </div>
        </div>

        <!-- Detail Rows -->
        <div class="grid gap-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold">Material Plan</h3>
              <p class="text-xs text-muted-foreground">
                Add one or more material rows. Material totals will be calculated automatically.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="!canMutate"
              @click="addRow"
            >
              <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
              Add Row
            </Button>
          </div>

          <div class="overflow-hidden rounded-xl border">
            <div class="hidden grid-cols-12 gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground md:grid">
              <div class="col-span-6">Material</div>
              <div class="col-span-4">Tonnage</div>
              <div class="col-span-2 text-right">Action</div>
            </div>

            <div class="max-h-[320px] overflow-y-auto">
              <div class="divide-y">
                <div
                  v-for="(row, index) in local.rows"
                  :key="index"
                  class="grid grid-cols-1 gap-3 p-3 md:grid-cols-12 md:items-center"
                >
                  <div class="md:col-span-6">
                    <Select
                      :model-value="row.material != null ? String(row.material) : ''"
                      :disabled="materialLoading || !canMutate"
                      @update:model-value="(v) => updateRowMaterial(index, String(v))"
                    >
                      <SelectTrigger class="h-10">
                        <SelectValue :placeholder="materialLoading ? 'Loading...' : 'Select material'" />
                      </SelectTrigger>

                      <SelectContent class="max-h-80 overflow-auto">
                        <SelectGroup>
                          <div class="sticky top-0 z-10 border-b bg-background/80 p-2 backdrop-blur">
                            <Input
                              v-model="materialSearch"
                              placeholder="Search material..."
                              class="h-8"
                              @input="onMaterialSearch(materialSearch)"
                              @keydown.stop
                              @click.stop
                            />
                          </div>

                          <SelectItem
                            v-for="o in visibleMaterialOptions"
                            :key="String(o.value)"
                            :value="String(o.value)"
                          >
                            {{ o.label }}
                          </SelectItem>

                          <div v-if="materialLoading" class="p-2 text-sm text-muted-foreground">
                            Loading...
                          </div>

                          <div v-if="!materialLoading && !visibleMaterialOptions.length" class="p-2 text-sm text-muted-foreground">
                            No results
                          </div>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="md:col-span-4">
                    <Input
                      v-model="row.tonnage"
                      type="number"
                      inputmode="decimal"
                      placeholder="0"
                      class="h-10"
                      :disabled="!canMutate"
                    />
                  </div>

                  <div class="flex justify-end md:col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      :disabled="local.rows.length <= 1 || !canMutate"
                      @click="removeRow(index)"
                    >
                      <Icon name="i-lucide-trash-2" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div class="flex flex-wrap gap-3 text-sm">
            <div
              v-for="(value, material) in materialTotals"
              :key="material"
              class="rounded-lg bg-muted px-3 py-2"
            >
              {{ material }}:
              <span class="font-semibold">
                {{ value.toLocaleString() }}
              </span>
            </div>

            <div
              v-if="grandTotal > 0"
              class="rounded-lg bg-primary/10 px-3 py-2 text-primary"
            >
              Total:
              <span class="font-semibold">
                {{ grandTotal.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="fieldError('details')" class="text-sm text-destructive">
          {{ fieldError("details") }}
        </p>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>

        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          Cancel
        </Button>

        <Button :disabled="!canSubmit" @click="submit">
          {{ loading ? "Saving..." : "Save Plan" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>