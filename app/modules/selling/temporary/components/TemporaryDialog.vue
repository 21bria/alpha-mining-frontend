<script setup lang="ts">
import { computed, reactive, watch, nextTick, ref } from "vue"
import { parseDate } from "@internationalized/date"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SelectLookup from "@/components/AsyncLookupSelect.vue"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Mode = "create" | "edit"

type TemporaryPayload = {
  id?: string

  iup?: number | null
  iup_id?: number | null
  iup_code?: string | null
  iup_name?: string | null

  code_lot: string | number | null
  code_lot_label?: string | null

  barge_code: string | number | null
  barge_name?: string | null

  date_hauling: string | null
  time_hauling: string | null
  shift: string | null

  id_material: number | null
  material_name?: string | null

  id_stockpile: number | null
  id_pile: number | null
  dome_name?: string | null
  dome_code?: string | null
  pile_id?: string | null

  unit_code: string | null
  tonnage: number | null
  type_selling: string | null

  code_inc: string | number | null
  code_sub: string | null
  code_sub_auto: string | null

  id_user: number | null
  sale_adjust: string | null
  no_urut: number | null
  status: number | null
  description: string | null

  user?: number | null
  username?: string | null
}

const props = withDefaults(
  defineProps<{
    open: boolean
    mode?: Mode
    role?: string
    initial?: Partial<TemporaryPayload> | null
    loading?: boolean
    errors?: Record<string, any>
  }>(),
  {
    mode: "create",
    role: "SITE_USER",
    initial: null,
    loading: false,
    errors: undefined,
  }
)

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "submit", payload: TemporaryPayload): void
}>()

const shiftOptions = [
  { value: "Day", label: "Pagi" },
  { value: "Night", label: "Malam" },
]

const subLotOptions = [
  { value: "SL_01", label: "SL_01" },
  { value: "SL_02", label: "SL_02" },
  { value: "SL_03", label: "SL_03" },
  { value: "SL_04", label: "SL_04" },
  { value: "SL_05", label: "SL_05" },
  { value: "SL_06", label: "SL_06" },
  { value: "SL_07", label: "SL_07" },
]

const form = reactive({
  id: undefined as string | undefined,

  iup: null as number | null,
  code_lot: null as string | number | null,
  barge_code: null as string | number | null,

  date_hauling: "",
  time_hauling: "",
  shift: "",

  id_material: null as number | null,
  id_stockpile: null as number | null,
  id_pile: null as number | null,

  unit_code: "",
  tonnage: null as number | null,
  type_selling: "SAS",

  code_inc: null as string | number | null,
  code_sub: "",
  code_sub_auto: "",

  id_user: null as number | null,
  sale_adjust: "",
  no_urut: null as number | null,
  status: 0,
  description: "",

  user: null as number | null,
})

const dateValue = ref<any>(undefined)
const timePopoverOpen = ref(false)

const showIup = computed(() => props.role !== "SITE_USER")

const title = computed(() =>
  props.mode === "edit" ? "Edit Temporary Barging" : "Add Temporary Barging"
)

const domeDepends = computed(() => (form.iup ? { iup_id: form.iup } : {}))
const codeLotDepends = computed(() => (form.iup ? { iup_id: form.iup } : {}))

function getCurrentTime() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  const ss = String(now.getSeconds()).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

function normalizeDate(value?: string | null) {
  if (!value) return ""
  return String(value).slice(0, 10)
}

function normalizeTime(value?: string | null) {
  if (!value) return ""
  return String(value).slice(0, 8)
}

function displayTime(value?: string | null) {
  if (!value) return ""
  return String(value).slice(0, 5)
}

function ensureTimeSeconds(value?: string | null) {
  if (!value) return ""
  const v = String(value).trim()
  if (!v) return ""
  if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`
  return v.slice(0, 8)
}

function resetForm() {
  form.id = undefined

  form.iup = null
  form.code_lot = null
  form.barge_code = null

  form.date_hauling = ""
  form.time_hauling = getCurrentTime()
  form.shift = ""

  form.id_material = null
  form.id_stockpile = null
  form.id_pile = null

  form.unit_code = ""
  form.tonnage = null
  form.type_selling = "SAS"

  form.code_inc = null
  form.code_sub = ""
  form.code_sub_auto = ""

  form.id_user = null
  form.sale_adjust = ""
  form.no_urut = null
  form.status = 0
  form.description = ""
  form.user = null

  dateValue.value = undefined
  timePopoverOpen.value = false
}

async function fillForm(data?: Partial<TemporaryPayload> | null) {
  resetForm()
  if (!data) return

  form.id = data.id
  form.iup = data.iup ?? data.iup_id ?? null
  form.barge_code = data.barge_code ?? null

  form.date_hauling = normalizeDate(data.date_hauling)
  dateValue.value = form.date_hauling ? parseDate(form.date_hauling) : undefined

  form.time_hauling = data.time_hauling
    ? normalizeTime(data.time_hauling)
    : getCurrentTime()

  form.shift = data.shift ?? ""

  form.id_material = data.id_material ?? null
  form.id_stockpile = data.id_stockpile ?? null

  form.unit_code = data.unit_code ?? ""
  form.tonnage = data.tonnage ?? null
  form.type_selling = data.type_selling ?? "SAS"

  form.code_inc = data.code_inc ?? null
  form.code_sub = data.code_sub ?? ""
  form.code_sub_auto = data.code_sub_auto ?? ""

  form.id_user = data.id_user ?? null
  form.sale_adjust = data.sale_adjust ?? ""
  form.no_urut = data.no_urut ?? null
  form.status = data.status ?? 0
  form.description = data.description ?? ""
  form.user = data.user ?? null

  form.id_pile = null
  form.code_lot = null

  await nextTick()

  form.id_pile = data.id_pile ?? null
  form.code_lot = data.code_lot ?? null
}

function onDateChange(v: any) {
  if (v) {
    dateValue.value = v
    form.date_hauling = v.toString()
  } else {
    dateValue.value = undefined
    form.date_hauling = ""
  }
}

function onTimeChange(value: string | number) {
  form.time_hauling = ensureTimeSeconds(String(value))
}

watch(
  () => [props.open, props.initial] as const,
  async ([open]) => {
    if (open) {
      await fillForm(props.initial)
    } else {
      resetForm()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.open,
  (open) => {
    if (open && props.mode === "create") {
      form.time_hauling = getCurrentTime()
    }
  }
)

watch(
  () => form.iup,
  (newVal, oldVal) => {
    if (newVal !== oldVal && oldVal !== null && oldVal !== undefined) {
      form.id_pile = null
      form.code_lot = null
    }
  }
)

function closeDialog() {
  emit("update:open", false)
}

function submitForm() {
  emit("submit", {
    ...form,
    date_hauling: form.date_hauling || null,
    time_hauling: form.time_hauling ? ensureTimeSeconds(form.time_hauling) : null,
    shift: form.shift || null,
    unit_code: form.unit_code || null,
    code_sub: form.code_sub || null,
    code_sub_auto: form.code_sub_auto || null,
    sale_adjust: form.sale_adjust || null,
    description: form.description || null,
  })
}

function getError(key: string) {
  const val = props.errors?.[key]
  if (Array.isArray(val)) return val[0]
  return val || null
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0">
      <DialogHeader class="px-4 py-3 border-b shrink-0">
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <form class="flex-1 flex flex-col min-h-0" @submit.prevent="submitForm">
        <div class="flex-1 overflow-y-auto px-4 py-4 pb-6">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div v-if="showIup" class="space-y-2">
              <label class="text-sm font-medium">IUP</label>
              <SelectLookup
                v-model="form.iup"
                endpoint="/api/master/lookups/mine-iup/"
                label="IUP"
                variant="field"
                label-key="iup_code"
                value-key="id"
                :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
              />
              <p v-if="getError('iup')" class="text-sm text-red-500">
                {{ getError("iup") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Date</label>

              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-9 w-full justify-start text-left font-normal"
                    :class="!form.date_hauling && 'text-muted-foreground'"
                  >
                    <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                    <span>{{ form.date_hauling || "Pick a date" }}</span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent class="w-auto p-0">
                  <Calendar
                    v-model="dateValue"
                    initial-focus
                    @update:model-value="onDateChange"
                  />
                </PopoverContent>
              </Popover>

              <p v-if="getError('date_hauling')" class="text-sm text-red-500">
                {{ getError("date_hauling") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Shift</label>
              <Select v-model="form.shift">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="item in shiftOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="getError('shift')" class="text-sm text-red-500">
                {{ getError("shift") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Times</label>

              <Popover v-model:open="timePopoverOpen">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-9 w-full justify-start text-left font-normal"
                    :class="!form.time_hauling && 'text-muted-foreground'"
                  >
                    <Icon name="i-radix-icons-clock" class="mr-2 h-4 w-4 opacity-50" />
                    <span>{{ displayTime(form.time_hauling) || "Pick time" }}</span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent class="w-56 p-3">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Select time</label>
                    <Input
                      :model-value="displayTime(form.time_hauling)"
                      type="time"
                      step="1"
                      @update:model-value="onTimeChange"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <p class="text-sm text-muted-foreground">
                *Input time for selling
              </p>

              <p v-if="getError('time_hauling')" class="text-sm text-red-500">
                {{ getError("time_hauling") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Material</label>
              <SelectLookup
                v-model="form.id_material"
                endpoint="/api/master/lookups/material/"
                label="Material"
                variant="field"
                label-key="name"
                value-key="id"
                :depends="{ categories: 'ORE' }"
                :selectedLabel="props.initial?.material_name ?? null"
              />
              <p v-if="getError('id_material')" class="text-sm text-red-500">
                {{ getError("id_material") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Dome</label>
              <SelectLookup
                v-model="form.id_pile"
                endpoint="/api/master/lookups/mine-dome/"
                label="Dome"
                variant="field"
                label-key="pile_id"
                value-key="id"
                :depends="domeDepends"
                :selectedLabel="props.initial?.dome_name ?? props.initial?.dome_code ?? props.initial?.pile_id ?? null"
              />
              <p class="text-sm text-muted-foreground">
                *KWL / KWS untuk direct
              </p>
              <p v-if="getError('id_pile')" class="text-sm text-red-500">
                {{ getError("id_pile") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Truck</label>
              <Input
                id="unit_code"
                v-model="form.unit_code"
                type="text"
                placeholder="Input truck"
              />
              <p v-if="getError('unit_code')" class="text-sm text-red-500">
                {{ getError("unit_code") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Sub Lot</label>
              <Select v-model="form.code_sub">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select Sub Lot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="item in subLotOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="getError('code_sub')" class="text-sm text-red-500">
                {{ getError("code_sub") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Kode Lot</label>
              <SelectLookup
                v-model="form.code_lot"
                endpoint="/api/master/lookups/selling-code/"
                label="Kode Lot"
                variant="field"
                label-key="code"
                value-key="id"
                :depends="codeLotDepends"
                :selectedLabel="props.initial?.code_lot_label ?? props.initial?.code_lot ?? null"
              />
              <p v-if="getError('code_lot')" class="text-sm text-red-500">
                {{ getError("code_lot") }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Tongkang</label>
              <SelectLookup
                v-model="form.barge_code"
                endpoint="/api/master/lookups/barge/"
                label="Tongkang"
                variant="field"
                label-key="barge_code"
                value-key="id"
                :selectedLabel="props.initial?.barge_name ?? null"
              />
              <p v-if="getError('barge_code')" class="text-sm text-red-500">
                {{ getError("barge_code") }}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2 px-4 py-3 border-t shrink-0">
          <Button type="button" variant="outline" @click="closeDialog">
            Cancel
          </Button>
          <Button type="submit" :disabled="loading">
            {{ loading ? "Saving..." : "Save" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>