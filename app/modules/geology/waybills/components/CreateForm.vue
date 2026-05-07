<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"
import { useCurrentRole } from "@/composables/useCurrentRole"
import type { DateValue } from "@internationalized/date"
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today as calendarToday,
} from "@internationalized/date"

const df = new DateFormatter("en-GB", {
  dateStyle: "medium",
})

const deliveryDateModel = computed<DateValue>({
  get() {
    return form.value.tgl_deliver
      ? parseDate(form.value.tgl_deliver)
      : calendarToday(getLocalTimeZone())
  },
  set(value) {
    form.value.tgl_deliver = value.toString()
  },
})

const deliveryDate = ref<DateValue>(
  calendarToday(getLocalTimeZone())
)

function todayString() {
  return new Date().toISOString().slice(0, 10)
}


type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type MineIupOption = {
  value: number
  label: string
}

type WaybillTempRow = {
  sample_id: string
  id_type_sample: number | null
  type_sample: string
  id_method: number | null
  sample_method: string
  id_material: number | null
  material: string
  sampling_area: number | null
  sampling_area_label: string
  sampling_point: number | null
  sampling_point_label: string
  batch_code: string
  status_input: string
}

type WaybillPayload = {
  header: {
    iup: number | null
    tgl_deliver: string | null
    delivery_time: string | null
    waybill_number: string | null
    qty: number | null
    mral_order: string
    roa_order: string
    remarks: string | null
    delivery: string | null
  }
  details: WaybillTempRow[]
}

const { request } = useApi()
const notify = useNotify()
const { currentRole } = useCurrentRole()

const role = computed<UserRole>(() => {
  const raw = String(currentRole.value ?? "").toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(raw)) return raw as UserRole
  if (["SUPER_ADMIN", "SUPERADMIN", "ADMIN"].includes(raw)) return "SYSTEM"
  return "SITE_USER"
})

const canChooseIup = computed(() => role.value === "SYSTEM" || role.value === "MANAGEMENT")
const requiresIup = computed(() => role.value === "SYSTEM" || role.value === "MANAGEMENT")
const canMutate = computed(() => role.value !== "GLOBAL_VIEWER")


function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function toNumberOrNull(value: string) {
  if (!value || String(value).trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

watch(deliveryDate, (v) => {
  form.value.tgl_deliver = v.toString()
})

const form = ref({
  iup: null as number | null,
  tgl_deliver: todayString(),
  delivery_time: nowTime(),
  waybill_number: "",
  qty: "",
  mral_order: true,
  roa_order: false,
  remarks: "",
  delivery: "",
})

const sampleSingle = ref("")
const sampleFrom = ref("")
const sampleTo = ref("")

const rows = ref<WaybillTempRow[]>([])
const loading = ref(false)
const searching = ref(false)
const generatingNumber = ref(false)

/* IUP */
const mineIUPOptions = ref<MineIupOption[]>([])
const mineIUPLoading = ref(false)
const mineIUPSearch = ref("")

async function fetchMineIUP(q = "") {
  if (!canChooseIup.value) return

  mineIUPLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: {
        search: q,
        page: 1,
        page_size: 50,
      },
    })

    mineIUPOptions.value = res?.results ?? []
  } finally {
    mineIUPLoading.value = false
  }
}

const onMineIUPSearch = useDebounceFn(() => {
  fetchMineIUP(mineIUPSearch.value)
}, 300)

function normalizeSampleRow(item: any): WaybillTempRow {
  return {
    sample_id: String(item.sample_id ?? item.sample_number ?? ""),
    id_type_sample: item.id_type_sample ?? null,
    type_sample: String(item.type_sample ?? item.type_sample_label ?? item.type ?? ""),
    id_method: item.id_method ?? null,
    sample_method: String(item.sample_method ?? item.method_label ?? ""),
    id_material: item.id_material ?? null,
    material: String(item.material ?? item.material_label ?? ""),
    sampling_area: item.sampling_area ?? null,
    sampling_area_label: String(item.sampling_area_label ?? item.sampling_area_name ?? ""),
    sampling_point: item.sampling_point ?? null,
    sampling_point_label: String(item.sampling_point_label ?? item.sampling_point_name ?? ""),
    batch_code: String(item.batch_code ?? ""),
    status_input: String(item.status_input ?? item.remark ?? item.remarks ?? ""),
  }
}

function appendRows(items: any[]) {
  let inserted = 0
  let duplicate = 0

  for (const item of items) {
    const row = normalizeSampleRow(item)
    if (!row.sample_id) continue

    const exists = rows.value.some(x => x.sample_id === row.sample_id)

    if (exists) {
      duplicate++
      continue
    }

    rows.value.push(row)
    inserted++
  }

  form.value.qty = String(rows.value.length)

  if (inserted) notify.success(`${inserted} sample added`)
  if (duplicate) notify.info(`${duplicate} duplicate sample skipped`)
}

async function addRangeSample() {
  const from = sampleFrom.value.trim()
  const to = sampleTo.value.trim()

  if (!from || !to) {
    notify.info("Input sample from and sample to")
    return
  }

  searching.value = true

  try {
    const res: any = await request(
      "/api/geology/waybills-crud/add-range/",
      {
        method: "POST",
        body: {
          from,
          to,
          ...(form.value.iup ? { iup: form.value.iup } : {}),
        },
      }
    )

    const duplicateWaybill =
      res?.duplicate_waybill_samples ?? []

    const duplicateTemp =
      res?.duplicate_temp_samples ?? []

    if (duplicateWaybill.length) {
      const preview = duplicateWaybill.slice(0, 3).join(", ")

      const more =
        duplicateWaybill.length > 3
          ? ` and ${duplicateWaybill.length - 3} more`
          : ""

      notify.info(
        `Already exists in Waybill: ${preview}${more}`
      )
    }

    if (duplicateTemp.length) {
      const preview = duplicateTemp.slice(0, 3).join(", ")

      const more =
        duplicateTemp.length > 3
          ? ` and ${duplicateTemp.length - 3} more`
          : ""

      notify.info(
        `Already exists in temporary table: ${preview}${more}`
      )
    }

    if (res?.inserted) {
      notify.success(
        `${res.inserted} sample added to temporary table`
      )

      await loadTemporaryTable()

      return
    }

    if (
      !duplicateWaybill.length &&
      !duplicateTemp.length
    ) {
      notify.error("No new sample found")
    }

  } catch (e: any) {
    notify.error(
      e?.data?.detail ||
      e?.message ||
      "Failed to add sample range"
    )
  } finally {
    searching.value = false
  }
}

async function loadTemporaryTable() {
  const res: any = await request("/api/geology/waybills-crud/temporary/", {
    method: "GET",
  })

  rows.value = Array.isArray(res) ? res : []
  form.value.qty = String(rows.value.length)
}

onMounted(() => {
  loadTemporaryTable()
})

async function removeRow(row: any) {
  try {
    await request(
      "/api/geology/waybills-crud/cancel-temp/",
      {
        method: "POST",
        body: {
          sample_id: row.sample_id,
        },
      }
    )

    notify.success("Sample removed")

    await loadTemporaryTable()

  } catch (e: any) {
    notify.error(
      e?.data?.detail ||
      e?.message ||
      "Failed to remove sample"
    )
  }
}
function clearRows() {
  rows.value = []
  form.value.qty = ""
}

// Clear temporary table, use with caution
async function clearTemporaryTable() {
  try {
    const res: any = await request(
      "/api/geology/waybills-crud/clear-temp/",
      {
        method: "POST",
      }
    )

    notify.success(
      `${res?.deleted || 0} sample cleared`
    )

    await loadTemporaryTable()

  } catch (e: any) {
    notify.error(
      e?.data?.detail ||
      e?.message ||
      "Failed to clear temporary table"
    )
  }
}

// Generate waybill number based on delivery date and order type
async function generateWaybillNumber() {
  if (!form.value.tgl_deliver) return

  const res: any = await request(
    "/api/geology/waybills-crud/number/",
    {
      method: "GET",
      query: {
        date_delivery: form.value.tgl_deliver,
      },
    }
  )

  form.value.waybill_number =
    String(res?.new_number ?? "")
}

watch(
  () => form.value.tgl_deliver,
  () => {
    if (!form.value.waybill_number) generateWaybillNumber()
  }
)

watch(
  () => form.value.iup,
  () => {
    clearRows()
  }
)

watch(
  () => [form.value.mral_order, form.value.roa_order],
  () => {
    if (!form.value.waybill_number) generateWaybillNumber()
  },
  { deep: true }
)

watch(
  () => canChooseIup.value,
  async (v) => {
    if (v) await fetchMineIUP()
  },
  { immediate: true }
)

const canSubmit = computed(() => {
  return (
    canMutate.value &&
    (!requiresIup.value || form.value.iup) &&
    form.value.tgl_deliver &&
    form.value.delivery_time &&
    form.value.waybill_number.trim() &&
    rows.value.length > 0
  )
})

async function submit() {
  if (!canSubmit.value) return

  loading.value = true

  try {
    const res: any = await request(
      "/api/geology/waybills-crud/submit-temp/",
      {
        method: "POST",
        body: {
          iup: form.value.iup,
          tgl_deliver: form.value.tgl_deliver,
          delivery_time: form.value.delivery_time,
          waybill_number: form.value.waybill_number,
          mral_order: form.value.mral_order ? "YES" : "NO",
          roa_order: form.value.roa_order ? "YES" : "NO",
          remarks: form.value.remarks || null,
        },
      }
    )

    notify.success(`${res?.inserted || 0} samples saved to Waybill`)

    await loadTemporaryTable()
    await generateWaybillNumber()

    setTimeout(async () => {
      await request("/api/geology/waybills-crud/clear-saved-temp/", {
        method: "POST",
      })

      await loadTemporaryTable()
    }, 4000)

    form.value.remarks = ""
  } catch (e: any) {
    notify.error(
      e?.data?.detail ||
      e?.message ||
      "Failed save waybill"
    )
  } finally {
    loading.value = false
  }
}

const hourOptions = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
)

const minuteOptions = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
)

const timeHour = ref(form.value.delivery_time.split(":")[0] || "00")
const timeMinute = ref(form.value.delivery_time.split(":")[1] || "00")

watch([timeHour, timeMinute], ([h, m]) => {
  form.value.delivery_time = `${h}:${m}`
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">
          Waybill Create
        </h1>
        <p class="text-sm text-muted-foreground">
          Search sample, preview data, then save final waybill.
        </p>
      </div>

      <div class="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" :disabled="loading">
              <Icon name="i-lucide-trash-2" class="mr-2 h-4 w-4" />
              Clear data
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Clear Temporary Table
              </AlertDialogTitle>

              <AlertDialogDescription>
                This will remove all temporary samples
                from your current session.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction @click="clearTemporaryTable">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button :disabled="loading || !canSubmit" @click="submit">
          {{ loading ? "Saving..." : "Send data" }}
        </Button>
      </div>
    </div>

    <Card>
      <CardContent class="space-y-3 p-4">
        <div class="grid grid-cols-1 gap-x-10 gap-y-3 xl:grid-cols-[1.45fr_1fr]">
          <div class="space-y-2">
            <!-- RANGE -->
            <div>
              <label class="mb-2 block text-sm font-medium">Add Sample Range</label>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,210px)_minmax(0,210px)_150px]">
                <Input v-model="sampleFrom" placeholder="From, QA0000001" />
                <Input v-model="sampleTo" placeholder="To, QA0000100" />

                <Button class="w-full" :disabled="searching" @click="addRangeSample">
                  <Icon name="i-lucide-search" class="mr-2 h-4 w-4" />
                  Add Range
                </Button>
              </div>
            </div>

            <!-- DATE TIME -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[210px_160px]">
              <div>
                <label class="mb-2 block text-sm font-medium">Delivery Date</label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="w-full justify-between font-normal">
                      <span>
                        {{
                          form.tgl_deliver
                            ? df.format(parseDate(form.tgl_deliver).toDate(getLocalTimeZone()))
                            : "Pick date"
                        }}
                      </span>

                      <Icon name="i-lucide-calendar" class="h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent class="w-auto p-0">
                    <Calendar v-model="deliveryDateModel" initial-focus />
                  </PopoverContent>
                </Popover>
              </div>

              <div class="w-[210px]">
                <label class="mb-2 block text-sm font-medium">
                  Delivery Time
                </label>

                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="h-9 w-full justify-between px-4 text-left font-normal">
                      <span class="text-base">
                        {{ form.delivery_time || "Select time" }}
                      </span>

                      <Icon name="i-lucide-clock-3" class="h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent class="w-[210px] p-3">
                    <div class="grid grid-cols-2 gap-3">
                      <Select v-model="timeHour">
                        <SelectTrigger class="h-10">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>

                        <SelectContent class="max-h-64">
                          <SelectItem v-for="h in hourOptions" :key="h" :value="h">
                            {{ h }}
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select v-model="timeMinute">
                        <SelectTrigger class="h-10">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>

                        <SelectContent class="max-h-64">
                          <SelectItem v-for="m in minuteOptions" :key="m" :value="m">
                            {{ m }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <!-- QTY -->
            <div class="w-full max-w-[610px]">
              <label class="mb-2 block text-sm font-medium">Qty</label>
              <Input v-model="form.qty" disabled placeholder="Auto" />
            </div>

            <!-- REMARKS -->
            <div class="w-full max-w-[610px]">
              <label class="mb-2 block text-sm font-medium">Remarks</label>
              <Textarea v-model="form.remarks" placeholder="Remarks" class="min-h-16" />
            </div>
          </div>
          <div class="space-y-3">
            <div v-if="canChooseIup">
              <label class="mb-2 block text-sm font-medium">IUP</label>

              <Select :model-value="form.iup != null ? String(form.iup) : ''"
                @update:model-value="v => form.iup = v ? Number(v) : null">
                <SelectTrigger>
                  <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
                </SelectTrigger>

                <SelectContent class="max-h-80 overflow-auto">
                  <div class="sticky top-0 z-10 border-b bg-background p-2">
                    <Input v-model="mineIUPSearch" placeholder="Search IUP..." class="h-8" @input="onMineIUPSearch"
                      @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in mineIUPOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium">Waybill Number</label>

              <div class="grid grid-cols-[1fr_auto] gap-2">
                <Input v-model="form.waybill_number" placeholder="Waybill number" />

                <Button variant="outline" :disabled="generatingNumber" @click="generateWaybillNumber">
                  Generate
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="flex items-center gap-3 rounded-md border p-3">
                <input v-model="form.mral_order" type="checkbox" class="h-4 w-4" />
                <div>
                  <div class="text-sm font-medium">MRAL Order</div>
                  <div class="text-xs text-muted-foreground">
                    {{ form.mral_order ? "YES" : "NO" }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 rounded-md border p-3">
                <input v-model="form.roa_order" type="checkbox" class="h-4 w-4" />
                <div>
                  <div class="text-sm font-medium">ROA Order</div>
                  <div class="text-xs text-muted-foreground">
                    {{ form.roa_order ? "YES" : "NO" }}
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-md border bg-muted/30 p-3 text-sm">
              <div class="font-medium">Summary</div>
              <div class="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                <span>Total sample</span>
                <span class="text-right font-medium text-foreground">{{ rows.length }}</span>

                <!-- <span>Waybill</span> -->
                <!-- <span class="text-right font-medium text-foreground">
                  {{ form.waybill_number || "-" }}
                </span> -->

                <span>Status</span>
                <span class="text-right font-medium text-foreground">
                  {{ canSubmit ? "Ready" : "Incomplete" }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border">
          <div class="flex items-center justify-between border-b px-3 py-2">
            <div class="text-sm font-medium">Temporary Sample Table</div>
            <div class="text-xs text-muted-foreground">
              Showing {{ rows.length }} entries
            </div>
          </div>

          <div class="max-h-[50vh] overflow-auto rounded-lg border scroll-thin">
            <Table class="text-sm">
              <!-- HEADER -->
              <TableHeader class="sticky top-0 z-20 bg-background">
                <TableRow class="h-9 border-b">
                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    #
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Sample ID
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Material
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Batch
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Method
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Type
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Sampling Area
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    Sampling Point
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-[12px] font-semibold">
                    status_input
                  </TableHead>

                  <TableHead class="h-9 px-2 py-1 text-right text-[12px] font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <!-- BODY -->
              <TableBody>
                <TableRow v-if="rows.length === 0">
                  <TableCell colspan="10" class="h-16 text-center text-xs text-muted-foreground">
                    No data available in table
                  </TableCell>
                </TableRow>

                <TableRow v-for="(row, index) in rows" :key="row.sample_id" class="h-8 border-b hover:bg-muted/30">
                  <TableCell class="px-2 py-1 text-xs">
                    {{ index + 1 }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs font-medium whitespace-nowrap">
                    {{ row.sample_id }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs whitespace-nowrap">
                    {{ row.material || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs whitespace-nowrap">
                    {{ row.batch_code || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs whitespace-nowrap">
                    {{ row.sample_method || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs whitespace-nowrap">
                    {{ row.type_sample || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs whitespace-nowrap">
                    {{ row.sampling_area || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs whitespace-nowrap">
                    {{ row.sampling_point || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-xs">
                    {{ row.status_input || "-" }}
                  </TableCell>

                  <TableCell class="px-2 py-1 text-right">
                    <!-- <Button size="icon" variant="ghost" class="h-6 w-6" @click="removeRow(row)">
                      <Icon name="i-lucide-x" class="h-3.5 w-3.5 text-red-500" />
                    </Button> -->
                    <AlertDialog>
                      <AlertDialogTrigger as-child>
                        <Button size="icon" variant="ghost" class="h-6 w-6">
                          <Icon name="i-lucide-x" class="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Sample
                          </AlertDialogTitle>

                          <AlertDialogDescription>
                            Are you sure you want to remove
                            sample {{ row.sample_id }}
                            from temporary table?
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>

                          <AlertDialogAction @click="removeRow(row)">
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="outline" :disabled="loading">
                <Icon name="i-lucide-trash-2" class="mr-2 h-4 w-4" />
                Clear data
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Clear Temporary Table
                </AlertDialogTitle>

                <AlertDialogDescription>
                  This will remove all temporary samples
                  from your current session.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction @click="clearTemporaryTable">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button :disabled="loading || !canSubmit" @click="submit">
            {{ loading ? "Saving..." : "Send data" }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>


</template>