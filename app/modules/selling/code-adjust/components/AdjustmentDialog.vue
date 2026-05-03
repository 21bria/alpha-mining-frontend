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
import SelectLookup from "@/components/AsyncLookupSelect.vue"
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

function onDateArrivalChange(v: any) {
  if (v) {
    dateArrivalValue.value = v
    local.value.date_arrival = v.toString() // format YYYY-MM-DD
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

const totalsLoading = ref(false)

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

function resetTotals() {
  local.value.tonnage_ori = ""
  local.value.ritase_ori = ""
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

async function fetchCodeTotalsById() {
  if (!local.value.code_lot) {
    resetTotals()
    return
  }

  totalsLoading.value = true
  try {
    const res = await request("/api/selling/barging/tonnage-by-code/", {
      method: "GET",
      query: {
        code_lot_id: local.value.code_lot,
      },
    })

    console.log("TOTAL RESPONSE:", res)

    local.value.tonnage_ori = String(res?.total_tonnage ?? 0)
    local.value.ritase_ori = String(res?.total_ritase ?? 0)

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
  const payload: CodeAdjustmentPayload = {
    id: local.value.id,
    code_lot: local.value.code_lot,
    date_arrival: local.value.date_arrival || null,
    date_departure: local.value.date_departure || null,
    jetty_departure: local.value.jetty_departure.trim() || null,
    ritase_ori: toNumberOrNull(local.value.ritase_ori),
    tonnage_ori: toNumberOrNull(local.value.tonnage_ori),
    tonnage_adjust: toNumberOrNull(local.value.tonnage_adjust),
    description: local.value.description.trim() || null,
  }

  emit("submit", payload)
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

    if (local.value.date_arrival) {
      dateArrivalValue.value = parseDate(local.value.date_arrival)
    }

    if (local.value.date_departure) {
      dateDepartureValue.value = parseDate(local.value.date_departure)
    }
    
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
    console.log("CODE LOT ID CHANGED:", newId)

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
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Code Lot</label>
          <SelectLookup
            :key="`code-adjustment-${props.mode}-${local.id ?? 'new'}`"
            v-model="local.code_lot"
            label="Code Lot"
            endpoint="/api/master/lookups/selling-code/"
            variant="field"
            label-key="code"
            value-key="id"
            :selectedLabel="local.code_lot_code || null"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('code_lot')" class="text-sm text-destructive">
            {{ fieldError('code_lot') }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Date Arrival</label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-9 w-full justify-start text-left font-normal"
                  :class="!local.date_arrival && 'text-muted-foreground'"
                  :disabled="!canMutate" >
                  <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                  <span>{{ local.date_arrival || "Pick a date" }}</span>
                </Button>
              </PopoverTrigger>

              <PopoverContent class="w-auto p-0">
                <Calendar
                  v-model="dateArrivalValue"
                  initial-focus
                  @update:model-value="onDateArrivalChange"
                />
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
              <Button
                variant="outline"
                class="h-9 w-full justify-start text-left font-normal"
                :class="!local.date_departure && 'text-muted-foreground'"
                :disabled="!canMutate"
              >
                <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                <span>{{ local.date_departure || "Pick a date" }}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent class="w-auto p-0">
              <Calendar
                v-model="dateDepartureValue"
                initial-focus
                @update:model-value="onDateDepartureChange"
              />
            </PopoverContent>
          </Popover>

          <p v-if="fieldError('date_departure')" class="text-sm text-destructive">
            {{ fieldError('date_departure') }}
          </p>
        </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Jetty Departure</label>
          <Input
            v-model="local.jetty_departure"
            type="text"
            :disabled="!canMutate"
            placeholder="Input jetty departure"
          />
          <p v-if="fieldError('jetty_departure')" class="text-sm text-destructive">
            {{ fieldError('jetty_departure') }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Ritase Original</label>
            <Input
              v-model="local.ritase_ori"
              type="number"
              step="1"
              disabled
              placeholder="Auto calculated from barging"
            />
            <p class="text-xs text-muted-foreground">
              {{ totalsLoading ? "Calculating ritase..." : "Calculated from existing barging data" }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Tonnage Original</label>
            <Input
              v-model="local.tonnage_ori"
              type="number"
              step="any"
              disabled
              placeholder="Auto calculated from barging"
            />
            <p class="text-xs text-muted-foreground">
              {{ totalsLoading ? "Calculating tonnage..." : "Calculated from existing barging data" }}
            </p>
          </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Tonnage Adjust</label>
          <Input
            v-model="local.tonnage_adjust"
            type="number"
            step="any"
            :disabled="!canMutate"
            placeholder="Input adjustment tonnage"
          />
          <p v-if="fieldError('tonnage_adjust')" class="text-sm text-destructive">
            {{ fieldError('tonnage_adjust') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea
            v-model="local.description"
            placeholder="Description"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
        </div>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError('non_field_errors') }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError('detail') }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button
          v-if="canMutate"
          :disabled="loading || !local.code_lot || !local.tonnage_adjust"
          @click="submit"
        >
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>