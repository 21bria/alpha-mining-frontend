<script setup lang="ts">
import { ref, watch, computed } from "vue"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { parseDate } from "@internationalized/date"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import SelectLookup from "@/components/form/LookupSelect.vue"
import { useApi } from "@/composables/useApi"
import { Calendar } from "@/components/ui/calendar"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type CodeAdjustmentPayload = {
  id?: number
  code_lot: number | null
  date_arrival: string | null
  date_departure: string | null
  jetty_departure: string | null
  ritase_ori: number | null
  tonnage_ori: number | null
  tonnage_adjust: number | null
  description?: string | null
}

type CodeAdjustmentFormState = {
  id?: number
  code_lot: number | null
  code_lot_code: string
  date_arrival: string
  date_departure: string
  jetty_departure: string
  ritase_ori: string
  tonnage_ori: string
  tonnage_adjust: string
  description: string
}

type DirectTotal = {
  ritase: number
  tonnage: number
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: Record<string, any> | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: CodeAdjustmentPayload): void
}>()

const { request } = useApi()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Code Adjustment" : "Edit Code Adjustment"
)

const dateArrivalValue = ref<any>(null)
const dateDepartureValue = ref<any>(null)
const totalsLoading = ref(false)

const local = ref<CodeAdjustmentFormState>({
  id: undefined,
  code_lot: null,
  code_lot_code: "",
  date_arrival: "",
  date_departure: "",
  jetty_departure: "",
  ritase_ori: "",
  tonnage_ori: "",
  tonnage_adjust: "",
  description: "",
})

const directTotals = ref({
  direct_barging: { ritase: 0, tonnage: 0 } as DirectTotal,
  direct_mining: { ritase: 0, tonnage: 0 } as DirectTotal,
  direct_geology: { ritase: 0, tonnage: 0 } as DirectTotal,
  direct_total: { ritase: 0, tonnage: 0 } as DirectTotal,
})

function onDateArrivalChange(v: any) {
  if (v) {
    dateArrivalValue.value = v
    local.value.date_arrival = v.toString()
  } else {
    dateArrivalValue.value = null
    local.value.date_arrival = ""
  }
}

function onDateDepartureChange(v: any) {
  if (v) {
    dateDepartureValue.value = v
    local.value.date_departure = v.toString()
  } else {
    dateDepartureValue.value = null
    local.value.date_departure = ""
  }
}

function normalizeId(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v?.value ?? v?.id ?? v)
  return Number.isFinite(n) ? n : null
}

function toStringValue(v: any): string {
  return v == null ? "" : String(v)
}

function toNumberOrNull(v: any): number | null {
  if (v === "" || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

function extractCodeLotCode(source: any): string {
  return (
    source?.code_lot_code ??
    source?.code ??
    source?.code_lot_label ??
    source?.label ??
    source?.text ??
    ""
  )
}

function resetTotals() {
  local.value.tonnage_ori = ""
  local.value.ritase_ori = ""

  directTotals.value = {
    direct_barging: { ritase: 0, tonnage: 0 },
    direct_mining: { ritase: 0, tonnage: 0 },
    direct_geology: { ritase: 0, tonnage: 0 },
    direct_total: { ritase: 0, tonnage: 0 },
  }
}

function fmtNumber(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "0"
}

async function fetchCodeTotalsById() {
  if (!local.value.code_lot) {
    resetTotals()
    return
  }

  totalsLoading.value = true

  try {
    const res = await request("/api/selling/code-adjust/totals-by-code-lot/", {
      method: "GET",
      query: {
        code_lot_id: local.value.code_lot,
      },
    })

    local.value.tonnage_ori = String(res?.total_barging?.tonnage ?? 0)
    local.value.ritase_ori = String(res?.total_barging?.ritase ?? 0)

    directTotals.value = {
      direct_barging: {
        ritase: Number(res?.direct_barging?.ritase ?? 0),
        tonnage: Number(res?.direct_barging?.tonnage ?? 0),
      },
      direct_mining: {
        ritase: Number(res?.direct_mining?.ritase ?? 0),
        tonnage: Number(res?.direct_mining?.tonnage ?? 0),
      },
      direct_geology: {
        ritase: Number(res?.direct_geology?.ritase ?? 0),
        tonnage: Number(res?.direct_geology?.tonnage ?? 0),
      },
      direct_total: {
        ritase: Number(res?.direct_total?.ritase ?? 0),
        tonnage: Number(res?.direct_total?.tonnage ?? 0),
      },
    }

    if (res?.code_lot) {
      local.value.code_lot_code = String(res.code_lot)
    }
  } catch (e) {
    console.error("Failed to fetch totals", e)
    resetTotals()
  } finally {
    totalsLoading.value = false
  }
}

function submit() {
  emit("submit", {
    id: local.value.id,
    code_lot: local.value.code_lot,
    date_arrival: local.value.date_arrival || null,
    date_departure: local.value.date_departure || null,
    jetty_departure: local.value.jetty_departure.trim() || null,
    ritase_ori: toNumberOrNull(local.value.ritase_ori),
    tonnage_ori: toNumberOrNull(local.value.tonnage_ori),
    tonnage_adjust: toNumberOrNull(local.value.tonnage_adjust),
    description: local.value.description.trim() || null,
  })
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    local.value = {
      id: props.initial?.id,
      code_lot: normalizeId(props.initial?.code_lot ?? props.initial?.code_lot_id),
      code_lot_code: extractCodeLotCode(props.initial),
      date_arrival: toStringValue(props.initial?.date_arrival),
      date_departure: toStringValue(props.initial?.date_departure),
      jetty_departure: toStringValue(props.initial?.jetty_departure),
      ritase_ori: toStringValue(props.initial?.ritase_ori),
      tonnage_ori: toStringValue(props.initial?.tonnage_ori),
      tonnage_adjust: toStringValue(props.initial?.tonnage_adjust),
      description: props.initial?.description ?? "",
    }

    dateArrivalValue.value = local.value.date_arrival
      ? parseDate(local.value.date_arrival)
      : null

    dateDepartureValue.value = local.value.date_departure
      ? parseDate(local.value.date_departure)
      : null

    if (local.value.code_lot) {
      await fetchCodeTotalsById()
    } else {
      resetTotals()
    }
  },
  { immediate: true }
)

watch(
  () => local.value.code_lot,
  async (newId, oldId) => {
    if (!props.open) return

    if (!newId) {
      local.value.code_lot_code = ""
      resetTotals()
      return
    }

    if (newId === oldId) return

    await fetchCodeTotalsById()
  }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="flex max-h-[90vh] max-w-xl flex-col p-0">
      <DialogHeader class="border-b px-6 py-4">
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Code Lot</label>
            <SelectLookup v-model="local.code_lot" label="Code Lot" endpoint="/api/master/lookups/selling-code/"
              variant="field" label-key="code" value-key="id" search-param="q"
              :selectedLabel="local.code_lot_code || null" :disabled="!canMutate" />
            <p v-if="fieldError('code_lot')" class="text-sm text-destructive">
              {{ fieldError('code_lot') }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-sm font-medium">Date Arrival</label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-9 w-full justify-start text-left font-normal"
                    :class="!local.date_arrival && 'text-muted-foreground'" :disabled="!canMutate">
                    <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                    <span>{{ local.date_arrival || "Pick a date" }}</span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="dateArrivalValue" initial-focus @update:model-value="onDateArrivalChange" />
                </PopoverContent>
              </Popover>

              <p v-if="fieldError('date_arrival')" class="text-sm text-destructive">
                {{ fieldError('date_arrival') }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-sm font-medium">Date Departure</label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-9 w-full justify-start text-left font-normal"
                    :class="!local.date_departure && 'text-muted-foreground'" :disabled="!canMutate">
                    <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                    <span>{{ local.date_departure || "Pick a date" }}</span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="dateDepartureValue" initial-focus @update:model-value="onDateDepartureChange" />
                </PopoverContent>
              </Popover>

              <p v-if="fieldError('date_departure')" class="text-sm text-destructive">
                {{ fieldError('date_departure') }}
              </p>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Jetty Departure</label>
            <Input v-model="local.jetty_departure" type="text" :disabled="!canMutate"
              placeholder="Input jetty departure" />
            <p v-if="fieldError('jetty_departure')" class="text-sm text-destructive">
              {{ fieldError('jetty_departure') }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-sm font-medium">Ritase Original</label>
              <Input v-model="local.ritase_ori" type="number" step="1" disabled
                placeholder="Auto calculated from barging" />
              <p class="text-xs text-muted-foreground">
                {{ totalsLoading ? "Calculating ritase..." : "Calculated from existing barging data" }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-sm font-medium">Tonnage Original</label>
              <Input v-model="local.tonnage_ori" type="number" step="any" disabled
                placeholder="Auto calculated from barging" />
              <p class="text-xs text-muted-foreground">
                {{ totalsLoading ? "Calculating tonnage..." : "Calculated from existing barging data" }}
              </p>
            </div>
          </div>

          <div class="rounded-lg border bg-muted/30 p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 class="text-sm font-semibold">Direct Summary</h4>
                <p class="text-xs text-muted-foreground">
                  Total direct from barging, mining, and geology
                </p>
              </div>

              <span v-if="totalsLoading" class="shrink-0 text-xs text-muted-foreground">
                Calculating...
              </span>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="rounded-md border bg-background p-3">
                <p class="text-xs text-muted-foreground">Barging Direct</p>
                <p class="mt-1 text-sm font-semibold">
                  {{ fmtNumber(directTotals.direct_barging.ritase) }} Ritase
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ fmtNumber(directTotals.direct_barging.tonnage) }} MT
                </p>
              </div>

              <div class="rounded-md border bg-background p-3">
                <p class="text-xs text-muted-foreground">Mining Direct</p>
                <p class="mt-1 text-sm font-semibold">
                  {{ fmtNumber(directTotals.direct_mining.ritase) }} Ritase
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ fmtNumber(directTotals.direct_mining.tonnage) }} MT
                </p>
              </div>

              <div class="rounded-md border bg-background p-3">
                <p class="text-xs text-muted-foreground">Geology Direct</p>
                <p class="mt-1 text-sm font-semibold">
                  {{ fmtNumber(directTotals.direct_geology.ritase) }} Ritase
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ fmtNumber(directTotals.direct_geology.tonnage) }} MT
                </p>
              </div>
            </div>

            <div class="mt-3 rounded-md border bg-background p-3">
              <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm font-semibold"> Direct Validation Summary</p>
                <p class="text-sm font-bold">
                  {{ fmtNumber(directTotals.direct_total.ritase) }} Ritase /
                  {{ fmtNumber(directTotals.direct_total.tonnage) }} MT
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Tonnage Adjust</label>
            <Input v-model="local.tonnage_adjust" type="number" step="any" :disabled="!canMutate"
              placeholder="Input adjustment tonnage" />
            <p v-if="fieldError('tonnage_adjust')" class="text-sm text-destructive">
              {{ fieldError('tonnage_adjust') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Description</label>
            <Textarea v-model="local.description" placeholder="Description" :disabled="!canMutate" />
            <p v-if="fieldError('description')" class="text-sm text-destructive">
              {{ fieldError('description') }}
            </p>
          </div>

        </div>
      </div>

      <div v-if="errors && Object.keys(errors).length"
        class="mx-6 mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
        <ul class="space-y-1 text-sm text-destructive">
          <template v-for="(messages, field) in errors" :key="field">
            <li v-for="msg in (Array.isArray(messages) ? messages : [messages])" :key="`${field}-${msg}`">
              {{ msg }}
            </li>
          </template>
        </ul>
      </div>

      <DialogFooter class="border-t px-6 py-4">
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate" :disabled="loading || !local.code_lot || !local.tonnage_adjust" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>