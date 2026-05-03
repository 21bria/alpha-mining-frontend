<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { parseDate } from "@internationalized/date"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useApi } from "@/composables/useApi"
import { useCurrentRole } from "@/composables/useCurrentRole"

type MineIupOption = {
  value: number
  label: string
}

type WeatherRowPayload = {
  category: string
  start_time: string
  end_time: string
  duration?: number | null
  description?: string
}

type WeatherSubmitPayload = {
  iup: number | null
  date: string
  shift: string
  details: WeatherRowPayload[]
}

type WeatherInitial = {
  iup?: number | null
  date?: string | null
  shift?: string | null
  details?: WeatherRowPayload[]
}

type WeatherRowForm = {
  category: string
  start_time: string
  end_time: string
  duration: string
  description: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  initial?: WeatherInitial | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: WeatherSubmitPayload): void
}>()

const { currentRole } = useCurrentRole()
const { request } = useApi()

const canChooseIup = computed(() =>
  ["SUPERADMIN", "MANAGEMENT", "SYSTEM"].includes(String(currentRole.value || "").toUpperCase())
)

const canMutate = computed(() => true)

const title = computed(() =>
  props.mode === "create" ? "Add Weather" : "Edit Weather"
)


const local = ref<{
  iup: number | null
  date: string
  shift: string
  details: WeatherRowForm[]
}>({
  iup: null,
  date: "",
  shift: "",
  details: [],
})

function blankRow(): WeatherRowForm {
  return {
    category: "",
    start_time: "",
    end_time: "",
    duration: "",
    description: "",
  }
}

function addRow() {
  local.value.details.push(blankRow())
}

function removeRow(index: number) {
  if (local.value.details.length <= 1) return
  local.value.details.splice(index, 1)
}

const dateValue = ref<any>(undefined)

function close() {
  emit("update:open", false)
}

function onDateChange(v: any) {
  if (v) {
    dateValue.value = v
    local.value.date = v.toString()
  } else {
    dateValue.value = undefined
    local.value.date = ""
  }
}

function toDurationHours(start: string, end: string): string {
  if (!start || !end) return ""

  const startParts = start.split(":")
  const endParts = end.split(":")

  const sh = Number(startParts[0] ?? 0)
  const sm = Number(startParts[1] ?? 0)
  const eh = Number(endParts[0] ?? 0)
  const em = Number(endParts[1] ?? 0)

  if (
    Number.isNaN(sh) || Number.isNaN(sm) ||
    Number.isNaN(eh) || Number.isNaN(em)
  ) {
    return ""
  }

  let startMinutes = sh * 60 + sm
  let endMinutes = eh * 60 + em

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  const diffMinutes = endMinutes - startMinutes
  const hours = diffMinutes / 60

  return hours.toFixed(2)
}

function recalcRow(index: number) {
  const row = local.value.details[index]
  if (!row) return

  row.duration = toDurationHours(row.start_time, row.end_time)
}

watch(
  () => props.open,
  (v) => {
    if (!v) return

    local.value = {
      iup: props.initial?.iup ?? null,
      date: props.initial?.date ?? "",
      shift: props.initial?.shift ?? "",
      details:
        props.initial?.details?.length
          ? props.initial.details.map((x) => ({
              category: x.category ?? "",
              start_time: x.start_time ?? "",
              end_time: x.end_time ?? "",
              duration: x.duration == null ? "" : String(x.duration),
              description: x.description ?? "",
            }))
          : [blankRow()],
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      fetchMineIUP("", 1)
    }
  },
  { immediate: true }
)
/* IUP lookup */
const mineIUPOptions = ref<MineIupOption[]>([])
const mineIUPLoading = ref(false)
const mineIUPSearch = ref("")
const mineIUPPage = ref(1)
const mineIUPHasMore = ref(true)
const mineIUPContentRef = ref<HTMLElement | null>(null)

async function fetchMineIUP(q = "", page = 1) {
  if (mineIUPLoading.value) return
  mineIUPLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: { q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as MineIupOption[]
    const count = Number(res?.count ?? 0)

    if (page === 1) mineIUPOptions.value = items
    else mineIUPOptions.value = [...mineIUPOptions.value, ...items]

    mineIUPPage.value = page
    mineIUPHasMore.value = mineIUPOptions.value.length < count
  } finally {
    mineIUPLoading.value = false
  }
}

const onMineIUPSearch = useDebounceFn((q: string) => {
  mineIUPPage.value = 1
  mineIUPHasMore.value = true
  fetchMineIUP(q, 1).then(() => {
    if (mineIUPContentRef.value) mineIUPContentRef.value.scrollTop = 0
  })
}, 300)

function onMineIUPScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && mineIUPHasMore.value && !mineIUPLoading.value) {
    fetchMineIUP(mineIUPSearch.value, mineIUPPage.value + 1)
  }
}

const categoryOptions = [
  { value: "Rainy", label: "Rainy" },
  { value: "Slippery", label: "Slippery" },
]

const shiftOptions = [
  { value: "Day", label: "Day" },
  { value: "Night", label: "Night" },
]

function submit() {
  emit("submit", {
    iup: local.value.iup,
    date: local.value.date,
    shift: local.value.shift,
    details: local.value.details
      .filter((x) => x.category || x.start_time || x.end_time || x.description)
      .map((x) => ({
        category: x.category,
        start_time: x.start_time,
        end_time: x.end_time,
        duration: x.duration ? Number(x.duration) : null,
        description: x.description?.trim() || "",
      })),
  })
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <!-- HEADER FORM -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div v-if="canChooseIup" class="grid gap-2">
            <label class="text-sm font-medium">IUP</label>
            <Select :model-value="local.iup != null ? String(local.iup) : ''"
              @update:model-value="(v) => (local.iup = v ? Number(v) : null)" :disabled="mineIUPLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
              </SelectTrigger>
              <SelectContent ref="mineIUPContentRef" class="max-h-80 overflow-auto" @scroll="onMineIUPScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/95 backdrop-blur p-2 border-b">
                    <Input v-model="mineIUPSearch" placeholder="Search IUP..." class="h-8"
                      @input="onMineIUPSearch(mineIUPSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in mineIUPOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('iup')" class="text-sm text-destructive">
              {{ fieldError("iup") }}
            </p>
          </div>

        
          <div class="grid gap-2">
            <label class="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="h-9 w-full justify-start text-left font-normal"
                  :class="!local.date && 'text-muted-foreground'">
                  <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                  <span>{{ local.date || "Pick a date" }}</span>
                </Button>
              </PopoverTrigger>

              <PopoverContent class="w-auto p-0">
                <Calendar v-model="dateValue" initial-focus @update:model-value="onDateChange" />
              </PopoverContent>
            </Popover>

            <p v-if="fieldError('date')" class="text-sm text-destructive">
              {{ fieldError("date") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Shift</label>
            <Select v-model="local.shift">
              <SelectTrigger class="h-9">
                <SelectValue placeholder="Select Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in shiftOptions" :key="s.value" :value="s.value">
                  {{ s.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="fieldError('shift')" class="text-sm text-destructive">
              {{ fieldError("shift") }}
            </p>
          </div>
        </div>

        <!-- DETAIL ROWS -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Weather Details</h3>
            <Button type="button" variant="outline" @click="addRow">
              Add Row
            </Button>
          </div>

          <div v-for="(row, index) in local.details" :key="index" class="rounded-xl border p-4 space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Category</label>
                <Select v-model="row.category">
                  <SelectTrigger class="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in categoryOptions" :key="c.value" :value="c.value">
                      {{ c.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Start Time</label>
                <Input v-model="row.start_time" type="time" @change="recalcRow(index)" />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">End Time</label>
                <Input v-model="row.end_time" type="time" @change="recalcRow(index)" />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Duration (Hours)</label>
                <Input v-model="row.duration" readonly />
              </div>

              <div class="grid gap-2 sm:col-span-3">
                <label class="text-sm font-medium">Description</label>
                <Input v-model="row.description" rows="1" placeholder="Description..." />
              </div>

              <div class="flex items-end sm:col-span-1">
                <Button type="button" variant="ghost" class="w-full" :disabled="local.details.length === 1"
                  @click="removeRow(index)">
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="loading || !local.date || !local.shift || local.details.length === 0" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>