<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { parseDate } from "@internationalized/date"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

type LookupOption = {
  value: number
  label: string
}

export type RainfallSubmitPayload = {
  id?: string
  iup?: number | null
  date: string | null
  point_id?: number | null
  milimeter: string | number | null
  description?: string | null
}

type RainfallInitial = {
  id?: string
  iup?: number | null
  date?: string | null
  point?: number | null
  point_id?: number | null
  milimeter?: string | number | null
  description?: string | null
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  initial?: RainfallInitial | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: RainfallSubmitPayload): void
}>()

const { currentRole } = useCurrentRole()
const { request } = useApi()

const canChooseIup = computed(() =>
  ["SUPERADMIN", "MANAGEMENT", "SYSTEM"].includes(String(currentRole.value || "").toUpperCase())
)

const title = computed(() =>
  props.mode === "create" ? "Add Rainfall" : "Edit Rainfall"
)

const local = ref<{
  id?: string
  iup: number | null
  date: string
  point_id: number | null
  milimeter: string
  description: string
}>({
  id: undefined,
  iup: null,
  date: "",
  point_id: null,
  milimeter: "",
  description: "",
})
function close() {
  emit("update:open", false)
}

const dateValue = ref<any>(undefined)


function onDateChange(v: any) {
  if (v) {
    dateValue.value = v
    local.value.date = v.toString()
  } else {
    dateValue.value = undefined
    local.value.date = ""
  }
}

/* =========================
   IUP lookup
========================= */
const mineIUPOptions = ref<LookupOption[]>([])
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
      query: { search: q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as LookupOption[]
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

/* =========================
   Rainfall Point lookup
========================= */
const pointOptions = ref<LookupOption[]>([])
const pointLoading = ref(false)
const pointSearch = ref("")
const pointPage = ref(1)
const pointHasMore = ref(true)
const pointContentRef = ref<HTMLElement | null>(null)

async function fetchPoints(q = "", page = 1) {
  if (pointLoading.value) return
  pointLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/rainfall-points/", {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as LookupOption[]
    const count = Number(res?.count ?? 0)

    if (page === 1) pointOptions.value = items
    else pointOptions.value = [...pointOptions.value, ...items]

    pointPage.value = page
    pointHasMore.value = pointOptions.value.length < count
  } finally {
    pointLoading.value = false
  }
}

const onPointSearch = useDebounceFn((q: string) => {
  pointPage.value = 1
  pointHasMore.value = true
  fetchPoints(q, 1).then(() => {
    if (pointContentRef.value) pointContentRef.value.scrollTop = 0
  })
}, 300)

function onPointScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && pointHasMore.value && !pointLoading.value) {
    fetchPoints(pointSearch.value, pointPage.value + 1)
  }
}

/* =========================
   Initialize on open
========================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    local.value = {
      id: props.initial?.id,
      iup: props.initial?.iup ?? null,
      date: props.initial?.date ?? "",
      point_id: props.initial?.point_id ?? props.initial?.point ?? null,
      milimeter: props.initial?.milimeter == null ? "" : String(props.initial.milimeter),
      description: props.initial?.description ?? "",
    }

    dateValue.value = local.value.date ? parseDate(local.value.date) : undefined

    pointSearch.value = ""
    pointPage.value = 1
    pointHasMore.value = true
    await fetchPoints("", 1)

    if (
      local.value.point_id != null &&
      !pointOptions.value.some((x) => Number(x.value) === Number(local.value.point_id))
    ) {
      pointOptions.value = [
        {
          value: Number(local.value.point_id),
          label: `Point #${local.value.point_id}`,
        },
        ...pointOptions.value,
      ]
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      if (
        local.value.iup != null &&
        !mineIUPOptions.value.some((x) => Number(x.value) === Number(local.value.iup))
      ) {
        mineIUPOptions.value = [
          {
            value: Number(local.value.iup),
            label: `IUP #${local.value.iup}`,
          },
          ...mineIUPOptions.value,
        ]
      }
    }
  },
  { immediate: true }
)

function submit() {
  emit("submit", {
    id: local.value.id,
    iup: local.value.iup,
    date: local.value.date || null,
    point_id: local.value.point_id,
    milimeter: local.value.milimeter || null,
    description: local.value.description?.trim() || null,
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
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-if="canChooseIup" class="grid gap-2">
            <label class="text-sm font-medium">IUP</label>

            <Select :model-value="local.iup != null ? String(local.iup) : ''"
              @update:model-value="(v) => (local.iup = v ? Number(v) : null)" :disabled="mineIUPLoading">
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
            <label class="text-sm font-medium">Rainfall Point</label>

            <Select :model-value="local.point_id != null ? String(local.point_id) : ''"
              @update:model-value="(v) => (local.point_id = v ? Number(v) : null)" :disabled="pointLoading">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="pointLoading ? 'Loading...' : 'Select Point'" />
              </SelectTrigger>

              <SelectContent ref="pointContentRef" class="max-h-80 overflow-auto" @scroll="onPointScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/95 backdrop-blur p-2 border-b">
                    <Input v-model="pointSearch" placeholder="Search point..." class="h-8"
                      @input="onPointSearch(pointSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in pointOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('point_id') || fieldError('point')" class="text-sm text-destructive">
              {{ fieldError("point_id") || fieldError("point") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Milimeter</label>
            <Input v-model="local.milimeter" type="number" step="0.01" placeholder="0.00" />
            <p v-if="fieldError('milimeter')" class="text-sm text-destructive">
              {{ fieldError("milimeter") }}
            </p>
          </div>

          <div class="grid gap-2 sm:col-span-2">
            <label class="text-sm font-medium">Description</label>
            <Textarea v-model="local.description" placeholder="Optional..." />
            <p v-if="fieldError('description')" class="text-sm text-destructive">
              {{ fieldError("description") }}
            </p>
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
        <Button
          :disabled="loading || !local.date || !local.point_id || !local.milimeter || (canChooseIup && !local.iup)"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>