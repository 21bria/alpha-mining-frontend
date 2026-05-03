<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
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

type LookupOption = {
  value: string
  label: string
}

type HmUnitDetailRow = {
  id?: string
  start_time: string | null
  end_time: string | null
  duration_min: number | null

  status?: number | null
  status_id?: number | null
  status_name?: string | null

  activity?: number | null
  activity_id?: number | null
  activity_name?: string | null

  location?: string | null
  location_id?: string | null
  location_name?: string | null

  category?: string | null
  description?: string | null
}

type HmUnitPayload = {
  id?: string
  iup?: number | null
  unit: string | null
  date: string | null
  shift: string | null
  hm_start: number | null
  hm_end: number | null
  status?: string | null
  details: any[]
}

type HmUnitDetailData = {
  id: string
  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null

  unit?: string | null
  unit_id?: string | null
  unit_code?: string | null
  unit_model?: string | null

  date?: string | null
  shift?: string | null

  hm_start?: number | null
  hm_end?: number | null
  hm_total?: number | null

  status?: string | null
  username?: string | null

  details?: HmUnitDetailRow[]
}

type HmUnitDetailFormState = {
  id?: string
  start_time: string | null
  end_time: string | null
  duration_min: number | null

  status_id: number | null
  status_name: string | null

  activity_id: number | null
  activity_name: string | null

  location_id: string | null
  location_name: string | null

  category: string | null
  description: string | null
}

type HmUnitFormState = {
  id?: string

  iup: number | null
  iup_code: string | null
  iup_name: string | null

  unit: string | null
  unit_id: string | null
  unit_code: string | null
  unit_model: string | null

  date: string | null
  shift: string | null
  hm_start: number | null
  hm_end: number | null
  status: string | null

  details: HmUnitDetailFormState[]
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  initial?: HmUnitDetailData | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: HmUnitPayload): void
}>()

const title = computed(() =>
  props.mode === "create" ? "Add HM Unit" : "Edit HM Unit"
)

const shiftOptions: LookupOption[] = [
  { value: "Day", label: "DAY" },
  { value: "Night", label: "NIGHT" },
]

function normalizeShift(v: any): string | null {
  if (v == null || v === "") return null

  const s = String(v).trim().toLowerCase()

  if (s === "day") return "Day"
  if (s === "night") return "Night"

  return String(v).trim()
}

const local = ref<HmUnitFormState>({
  id: undefined,

  iup: null,
  iup_code: null,
  iup_name: null,

  unit: null,
  unit_id: null,
  unit_code: null,
  unit_model: null,

  date: null,
  shift: null,
  hm_start: null,
  hm_end: null,
  status: "DRAFT",

  details: [],
})

/* =========================================================
   Helpers
========================================================= */
function normalizeNumber(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeString(v: any): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

function toTimeInputValue(v: string | null | undefined): string | null {
  if (!v) return null
  const s = String(v).trim()

  if (/^\d{2}:\d{2}$/.test(s)) return s
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5)
  if (/^\d{2}\.\d{2}$/.test(s)) return s.replace(".", ":")
  if (/^\d{2}\.\d{2}\.\d{2}$/.test(s)) return s.replace(/\./g, ":").slice(0, 5)

  return s
}

function parseTimeToMinutes(v: string | null | undefined): number | null {
  if (!v) return null
  const normalized = toTimeInputValue(v)
  if (!normalized) return null

  const parts = normalized.split(":")
  if (parts.length < 2) return null

  const h = Number(parts[0])
  const m = Number(parts[1])

  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null

  return h * 60 + m
}

function calculateDuration(start: string | null, end: string | null): number | null {
  const startMin = parseTimeToMinutes(start)
  const endMin = parseTimeToMinutes(end)

  if (startMin == null || endMin == null) return null

  let diff = endMin - startMin
  if (diff < 0) diff += 24 * 60

  return diff
}

function upsertOption(list: LookupOption[], option?: LookupOption | null) {
  if (!option?.value) return list
  const exists = list.some((x) => String(x.value) === String(option.value))
  return exists ? list : [option, ...list]
}

function dedupeOptions(list: LookupOption[]) {
  return list.filter((v, i, arr) => arr.findIndex((x) => x.value === v.value) === i)
}

function mapLookupResults(res: any): LookupOption[] {
  return (res?.results ?? []).map((item: any) => ({
    value: String(item.value ?? item.id ?? ""),
    label: String(item.label ?? item.name ?? item.code ?? item.value ?? ""),
  }))
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

function detailFieldError(index: number, key: string) {
  const details = props.errors?.details
  if (!details) return null
  const e = details?.[index]?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

/* =========================================================
   IUP lookup
========================================================= */
const iupOptions = ref<LookupOption[]>([])
const iupLoading = ref(false)
const iupSearch = ref("")
const iupPage = ref(1)
const iupHasMore = ref(true)

async function fetchIups(q = "", page = 1) {
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

    let items = mapLookupResults(res)

    if (local.value.iup != null && local.value.iup_code) {
      items = upsertOption(items, {
        value: String(local.value.iup),
        label: local.value.iup_name
          ? `${local.value.iup_code} - ${local.value.iup_name}`
          : local.value.iup_code,
      })
    }

    if (page === 1) {
      iupOptions.value = items
    } else {
      iupOptions.value = dedupeOptions([...iupOptions.value, ...items])
    }

    const count = Number(res?.count ?? 0)
    iupPage.value = page
    iupHasMore.value = iupOptions.value.length < count
  } finally {
    iupLoading.value = false
  }
}

const onIupSearch = useDebounceFn((q: string) => {
  iupPage.value = 1
  iupHasMore.value = true
  fetchIups(q, 1)
}, 300)

function onIupScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (nearBottom && iupHasMore.value && !iupLoading.value) {
    fetchIups(iupSearch.value, iupPage.value + 1)
  }
}

/* =========================================================
   Unit lookup
========================================================= */
const unitOptions = ref<LookupOption[]>([])
const unitLoading = ref(false)
const unitSearch = ref("")
const unitPage = ref(1)
const unitHasMore = ref(true)

function mapUnitLookupResults(res: any): LookupOption[] {
  return (res?.results ?? []).map((item: any) => {
    const value = String(item.value ?? item.id ?? "")
    const unitCode = String(item.unit_code ?? item.code ?? "").trim()
    const unitModel = String(item.unit_model ?? item.model ?? "").trim()

    let label = String(item.label ?? "").trim()

    if (!label) {
      label = [unitCode, unitModel].filter(Boolean).join(" - ")
    }

    if (!label) {
      label = String(item.name ?? item.value ?? item.id ?? "")
    }

    return {
      value,
      label,
    }
  })
}

async function fetchUnits(q = "", page = 1) {
  if (unitLoading.value) return
  unitLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/mine-units/", {
      method: "GET",
      query: {
        search: q,
        page,
        page_size: 10,
        iup: local.value.iup ?? undefined,
      },
    })

    let items = mapUnitLookupResults(res)

    if (local.value.unit_id && local.value.unit_code) {
      items = upsertOption(items, {
        value: String(local.value.unit_id),
        label: local.value.unit_model
          ? `${local.value.unit_code} - ${local.value.unit_model}`
          : (local.value.unit_code ?? local.value.unit_id),
      })
    }

    if (page === 1) {
      unitOptions.value = items
    } else {
      unitOptions.value = dedupeOptions([...unitOptions.value, ...items])
    }

    const count = Number(res?.count ?? 0)
    unitPage.value = page
    unitHasMore.value = unitOptions.value.length < count
  } finally {
    unitLoading.value = false
  }
}

const onUnitSearch = useDebounceFn((q: string) => {
  unitPage.value = 1
  unitHasMore.value = true
  fetchUnits(q, 1)
}, 300)

function onUnitScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (nearBottom && unitHasMore.value && !unitLoading.value) {
    fetchUnits(unitSearch.value, unitPage.value + 1)
  }
}

function onUnitChange(value: string) {
  const selected = unitOptions.value.find((x) => x.value === value)

  local.value.unit = value || null
  local.value.unit_id = value || null

  if (selected) {
    const parts = selected.label.split(" - ")
    local.value.unit_code = parts[0] || null
    local.value.unit_model = parts.slice(1).join(" - ") || null
  } else {
    local.value.unit_code = null
    local.value.unit_model = null
  }
}

/* =========================================================
   Status lookup
========================================================= */
const statusOptions = ref<LookupOption[]>([])
const statusLoading = ref(false)
const statusSearch = ref("")
const statusPage = ref(1)
const statusHasMore = ref(true)

async function fetchStatuses(q = "", page = 1) {
  if (statusLoading.value) return
  statusLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/activity-categories/", {
      method: "GET",
      query: {
        search: q,
        page,
        page_size: 10,
      },
    })

    let items = mapLookupResults(res)

    for (const d of local.value.details) {
      if (d.status_id != null && d.status_name) {
        items = upsertOption(items, {
          value: String(d.status_id),
          label: d.status_name,
        })
      }
    }

    if (page === 1) {
      statusOptions.value = items
    } else {
      statusOptions.value = dedupeOptions([...statusOptions.value, ...items])
    }

    const count = Number(res?.count ?? 0)
    statusPage.value = page
    statusHasMore.value = statusOptions.value.length < count
  } finally {
    statusLoading.value = false
  }
}

const onStatusSearch = useDebounceFn((q: string) => {
  statusPage.value = 1
  statusHasMore.value = true
  fetchStatuses(q, 1)
}, 300)

function onStatusScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (nearBottom && statusHasMore.value && !statusLoading.value) {
    fetchStatuses(statusSearch.value, statusPage.value + 1)
  }
}

/* =========================================================
   Location lookup
========================================================= */
const locationOptions = ref<LookupOption[]>([])
const locationLoading = ref(false)
const locationSearch = ref("")
const locationPage = ref(1)
const locationHasMore = ref(true)

async function fetchLocations(q = "", page = 1) {
  if (locationLoading.value) return
  locationLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/activity-locations/", {
      method: "GET",
      query: {
        search: q,
        page,
        page_size: 10,
      },
    })

    let items = mapLookupResults(res)

    for (const d of local.value.details) {
      if (d.location_id && d.location_name) {
        items = upsertOption(items, {
          value: d.location_id,
          label: d.location_name,
        })
      }
    }

    if (page === 1) {
      locationOptions.value = items
    } else {
      locationOptions.value = dedupeOptions([...locationOptions.value, ...items])
    }

    const count = Number(res?.count ?? 0)
    locationPage.value = page
    locationHasMore.value = locationOptions.value.length < count
  } finally {
    locationLoading.value = false
  }
}

const onLocationSearch = useDebounceFn((q: string) => {
  locationPage.value = 1
  locationHasMore.value = true
  fetchLocations(q, 1)
}, 300)

function onLocationScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (nearBottom && locationHasMore.value && !locationLoading.value) {
    fetchLocations(locationSearch.value, locationPage.value + 1)
  }
}

/* =========================================================
   Activity lookup per row
========================================================= */
const activityOptionsMap = ref<Record<number, LookupOption[]>>({})
const activityLoadingMap = ref<Record<number, boolean>>({})
const activitySearchMap = ref<Record<number, string>>({})
const activityPageMap = ref<Record<number, number>>({})
const activityHasMoreMap = ref<Record<number, boolean>>({})

async function fetchActivitiesForIndex(index: number, q = "", page = 1, statusId?: number | null) {
  const sid = statusId ?? local.value.details[index]?.status_id
  if (!sid) {
    activityOptionsMap.value[index] = []
    activityPageMap.value[index] = 1
    activityHasMoreMap.value[index] = false
    return
  }

  if (activityLoadingMap.value[index]) return
  activityLoadingMap.value[index] = true

  try {
    const res: any = await request("/api/master/lookups/activities/", {
      method: "GET",
      query: {
        search: q,
        page,
        page_size: 10,
        status: sid,
      },
    })

    let items = mapLookupResults(res)
    const current = local.value.details[index]

    if (current?.activity_id != null && current?.activity_name) {
      items = upsertOption(items, {
        value: String(current.activity_id),
        label: current.activity_name,
      })
    }

    if (page === 1) {
      activityOptionsMap.value[index] = items
    } else {
      activityOptionsMap.value[index] = dedupeOptions([
        ...(activityOptionsMap.value[index] ?? []),
        ...items,
      ])
    }

    const count = Number(res?.count ?? 0)
    activityPageMap.value[index] = page
    activityHasMoreMap.value[index] =
      (activityOptionsMap.value[index] ?? []).length < count
  } finally {
    activityLoadingMap.value[index] = false
  }
}

const activitySearchDebouncers: Record<number, (q: string) => void> = {}

function getActivitySearchDebouncer(index: number) {
  if (!activitySearchDebouncers[index]) {
    activitySearchDebouncers[index] = useDebounceFn((q: string) => {
      activityPageMap.value[index] = 1
      activityHasMoreMap.value[index] = true
      fetchActivitiesForIndex(index, q, 1)
    }, 300)
  }
  return activitySearchDebouncers[index]
}

function onActivitySearch(index: number, q: string) {
  activitySearchMap.value[index] = q
  getActivitySearchDebouncer(index)(q)
}

function onActivityScroll(index: number, e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (
    nearBottom &&
    activityHasMoreMap.value[index] &&
    !activityLoadingMap.value[index]
  ) {
    fetchActivitiesForIndex(
      index,
      activitySearchMap.value[index] ?? "",
      (activityPageMap.value[index] ?? 1) + 1
    )
  }
}

/* =========================================================
   Form mapping
========================================================= */
function mapDetail(row: HmUnitDetailRow): HmUnitDetailFormState {
  const start = toTimeInputValue(row.start_time)
  const end = toTimeInputValue(row.end_time)
  const duration =
    normalizeNumber(row.duration_min) ?? calculateDuration(start, end)

  return {
    id: row.id,
    start_time: start,
    end_time: end,
    duration_min: duration,

    status_id: normalizeNumber(row.status_id ?? row.status),
    status_name: row.status_name ?? null,

    activity_id: normalizeNumber(row.activity_id ?? row.activity),
    activity_name: row.activity_name ?? null,

    location_id: normalizeString(row.location_id ?? row.location),
    location_name: row.location_name ?? null,

    category: row.category ?? null,
    description: row.description ?? null,
  }
}

function resetForm() {
  local.value = {
    id: undefined,

    iup: null,
    iup_code: null,
    iup_name: null,

    unit: null,
    unit_id: null,
    unit_code: null,
    unit_model: null,

    date: null,
    shift: null,
    hm_start: null,
    hm_end: null,
    status: "DRAFT",

    details: [],
  }

  iupOptions.value = []
  iupSearch.value = ""
  iupPage.value = 1
  iupHasMore.value = true

  unitOptions.value = []
  unitSearch.value = ""
  unitPage.value = 1
  unitHasMore.value = true

  statusOptions.value = []
  statusSearch.value = ""
  statusPage.value = 1
  statusHasMore.value = true

  locationOptions.value = []
  locationSearch.value = ""
  locationPage.value = 1
  locationHasMore.value = true

  activityOptionsMap.value = {}
  activityLoadingMap.value = {}
  activitySearchMap.value = {}
  activityPageMap.value = {}
  activityHasMoreMap.value = {}
}

function addDetail() {
  local.value.details.push({
    start_time: null,
    end_time: null,
    duration_min: null,

    status_id: null,
    status_name: null,

    activity_id: null,
    activity_name: null,

    location_id: null,
    location_name: null,

    category: null,
    description: null,
  })
}

function removeDetail(index: number) {
  local.value.details.splice(index, 1)

  const nextOptions: Record<number, LookupOption[]> = {}
  const nextLoading: Record<number, boolean> = {}
  const nextSearch: Record<number, string> = {}
  const nextPage: Record<number, number> = {}
  const nextHasMore: Record<number, boolean> = {}

  local.value.details.forEach((_, i) => {
    nextOptions[i] = activityOptionsMap.value[i] ?? []
    nextLoading[i] = activityLoadingMap.value[i] ?? false
    nextSearch[i] = activitySearchMap.value[i] ?? ""
    nextPage[i] = activityPageMap.value[i] ?? 1
    nextHasMore[i] = activityHasMoreMap.value[i] ?? true
  })

  activityOptionsMap.value = nextOptions
  activityLoadingMap.value = nextLoading
  activitySearchMap.value = nextSearch
  activityPageMap.value = nextPage
  activityHasMoreMap.value = nextHasMore
}

/* =========================================================
   Change handlers
========================================================= */
function onIupChange(value: string) {
  const id = value ? Number(value) : null
  const selected = iupOptions.value.find((x) => x.value === value)

  local.value.iup = Number.isFinite(id as number) ? id : null

  if (selected) {
    const parts = selected.label.split(" - ")
    local.value.iup_code = parts[0] || null
    local.value.iup_name = parts.slice(1).join(" - ") || null
  } else {
    local.value.iup_code = null
    local.value.iup_name = null
  }

  local.value.unit = null
  local.value.unit_id = null
  local.value.unit_code = null
  local.value.unit_model = null

  unitOptions.value = []
  unitSearch.value = ""
  unitPage.value = 1
  unitHasMore.value = true

  if (local.value.iup) {
    fetchUnits("", 1)
  }
}

function onStatusChange(index: number, value: string) {
  const id = value ? Number(value) : null
  const selected = statusOptions.value.find((x) => x.value === value)

  local.value.details[index].status_id = Number.isFinite(id as number) ? id : null
  local.value.details[index].status_name = selected?.label ?? null

  local.value.details[index].activity_id = null
  local.value.details[index].activity_name = null

  activityOptionsMap.value[index] = []
  activitySearchMap.value[index] = ""
  activityPageMap.value[index] = 1
  activityHasMoreMap.value[index] = true

  fetchActivitiesForIndex(index, "", 1, local.value.details[index].status_id)
}

function onActivityChange(index: number, value: string) {
  const id = value ? Number(value) : null
  const selected = (activityOptionsMap.value[index] ?? []).find((x) => x.value === value)

  local.value.details[index].activity_id = Number.isFinite(id as number) ? id : null
  local.value.details[index].activity_name = selected?.label ?? null
}

function onLocationChange(index: number, value: string) {
  const selected = locationOptions.value.find((x) => x.value === value)
  local.value.details[index].location_id = value || null
  local.value.details[index].location_name = selected?.label ?? null
}

/* =========================================================
   Watchers
========================================================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) {
      resetForm()
      return
    }

    if (props.mode === "edit" && props.initial) {
      local.value = {
        id: props.initial.id,

        iup: normalizeNumber(props.initial.iup),
        iup_code: props.initial.iup_code ?? null,
        iup_name: props.initial.iup_name ?? null,

        unit: props.initial.unit_id ?? props.initial.unit ?? null,
        unit_id: props.initial.unit_id ?? props.initial.unit ?? null,
        unit_code: props.initial.unit_code ?? null,
        unit_model: props.initial.unit_model ?? null,

        date: props.initial.date ?? null,
        shift: normalizeShift(props.initial.shift),
        hm_start: normalizeNumber(props.initial.hm_start),
        hm_end: normalizeNumber(props.initial.hm_end),
        status: props.initial.status ?? "DRAFT",

        details: Array.isArray(props.initial.details)
          ? props.initial.details.map(mapDetail)
          : [],
      }
    } else {
      resetForm()
    }

    await Promise.all([
      fetchIups("", 1),
      fetchStatuses("", 1),
      fetchLocations("", 1),
    ])

    if (local.value.iup) {
      await fetchUnits("", 1)
    }

    for (let i = 0; i < local.value.details.length; i++) {
      const d = local.value.details[i]
      activitySearchMap.value[i] = ""
      activityPageMap.value[i] = 1
      activityHasMoreMap.value[i] = true

      if (d.status_id) {
        await fetchActivitiesForIndex(i, "", 1, d.status_id)
      }
    }
  },
  { immediate: true }
)

watch(
  () =>
    local.value.details.map((d) => ({
      start_time: d.start_time,
      end_time: d.end_time,
    })),
  (rows) => {
    rows.forEach((_, index) => {
      const d = local.value.details[index]
      d.duration_min = calculateDuration(d.start_time, d.end_time)
    })
  },
  { deep: true }
)

/* =========================================================
   Submit
========================================================= */
function submit() {
  const payload: HmUnitPayload = {
    id: local.value.id,
    iup: local.value.iup,
    unit: normalizeString(local.value.unit_id ?? local.value.unit ?? local.value.unit_code),
    date: local.value.date,
    shift: local.value.shift,
    hm_start: local.value.hm_start,
    hm_end: local.value.hm_end,
    status: local.value.status,
    details: local.value.details.map((d) => ({
      id: d.id,
      start_time: d.start_time,
      end_time: d.end_time,
      duration_min: d.duration_min,
      status: d.status_id,
      activity: d.activity_id,
      location: d.location_id,
      category: d.category,
      description: d.description,
    })),
  }

  emit("submit", payload)
}

function close() {
  emit("update:open", false)
}

const canSubmit = computed(() => !props.loading)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-hidden">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-6 py-2 pr-2 max-h-[78vh] overflow-y-auto">
        <!-- Parent -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- IUP -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">IUP</label>
            <Select :model-value="local.iup != null ? String(local.iup) : ''"
              @update:model-value="(v) => onIupChange(String(v || ''))" :disabled="iupLoading">
              <SelectTrigger class="h-10">
                <SelectValue :placeholder="iupLoading ? 'Loading IUP...' : 'Select IUP'" />
              </SelectTrigger>

              <SelectContent>
                <div class="max-h-80 overflow-auto" @scroll="onIupScroll">
                  <SelectGroup>
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input v-model="iupSearch" placeholder="Search IUP..." class="h-8" @input="onIupSearch(iupSearch)"
                        @keydown.stop @click.stop />
                    </div>

                    <SelectItem v-for="o in iupOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>

                    <div v-if="iupLoading" class="p-2 text-sm text-muted-foreground">
                      Loading...
                    </div>

                    <div v-if="!iupLoading && iupOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                      No results
                    </div>
                  </SelectGroup>
                </div>
              </SelectContent>
            </Select>

            <p v-if="fieldError('iup')" class="text-sm text-destructive">
              {{ fieldError("iup") }}
            </p>
          </div>

          <!-- Unit -->
          <!-- Unit -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">Unit</label>

            <Select :model-value="local.unit_id ?? ''" @update:model-value="(v) => onUnitChange(String(v || ''))"
              :disabled="unitLoading || !local.iup">
              <SelectTrigger class="h-10">
                <SelectValue :placeholder="!local.iup
                  ? 'Select IUP first'
                  : unitLoading
                    ? 'Loading unit...'
                    : 'Select unit'" />
              </SelectTrigger>

              <SelectContent>
                <div class="max-h-80 overflow-auto" @scroll="onUnitScroll">
                  <SelectGroup>
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input v-model="unitSearch" placeholder="Search unit..." class="h-8"
                        @input="onUnitSearch(unitSearch)" @keydown.stop @click.stop />
                    </div>

                    <SelectItem v-for="o in unitOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>

                    <div v-if="unitLoading" class="p-2 text-sm text-muted-foreground">
                      Loading...
                    </div>

                    <div v-if="!unitLoading && unitOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                      No results
                    </div>
                  </SelectGroup>
                </div>
              </SelectContent>
            </Select>

            <!-- <div v-if="local.unit_code || local.unit_model"
              class="rounded-md border px-3 py-2 text-xs text-muted-foreground">
              <div v-if="local.unit_code" class="font-medium text-foreground">
                {{ local.unit_code }}
              </div>
              <div v-if="local.unit_model">
                {{ local.unit_model }}
              </div>
            </div> -->

            <p v-if="fieldError('unit')" class="text-sm text-destructive">
              {{ fieldError("unit") }}
            </p>
          </div>
          <!-- Date -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">Date</label>
            <Input v-model="local.date" type="date" />
            <p v-if="fieldError('date')" class="text-sm text-destructive">
              {{ fieldError("date") }}
            </p>
          </div>

          <!-- Shift -->
          <div class="grid gap-2">
            <label class="text-sm font-medium">Shift</label>
            <Select :model-value="local.shift ?? ''"
              @update:model-value="(v) => (local.shift = String(v || '') || null)">
              <SelectTrigger class="h-10">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="o in shiftOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('shift')" class="text-sm text-destructive">
              {{ fieldError("shift") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">HM Start</label>
            <Input v-model="local.hm_start" type="number" step="0.01" />
            <p v-if="fieldError('hm_start')" class="text-sm text-destructive">
              {{ fieldError("hm_start") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">HM End</label>
            <Input v-model="local.hm_end" type="number" step="0.01" />
            <p v-if="fieldError('hm_end')" class="text-sm text-destructive">
              {{ fieldError("hm_end") }}
            </p>
          </div>
        </div>

        <!-- Details -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Details</h3>
            <Button type="button" variant="outline" @click="addDetail">
              Add Detail
            </Button>
          </div>

          <div class="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
            <div v-for="(d, index) in local.details" :key="d.id || index" class="border rounded-xl p-5 grid gap-4">
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-muted-foreground">
                  Detail #{{ index + 1 }}
                </div>
                <Button type="button" variant="destructive" @click="removeDetail(index)">
                  Remove
                </Button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="grid gap-2">
                  <label class="text-sm">Start Time</label>
                  <Input v-model="d.start_time" type="time" />
                  <p v-if="detailFieldError(index, 'start_time')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "start_time") }}
                  </p>
                </div>

                <div class="grid gap-2">
                  <label class="text-sm">End Time</label>
                  <Input v-model="d.end_time" type="time" />
                  <p v-if="detailFieldError(index, 'end_time')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "end_time") }}
                  </p>
                </div>

                <div class="grid gap-2">
                  <label class="text-sm">Duration (min)</label>
                  <Input v-model="d.duration_min" type="number" readonly />
                  <p v-if="detailFieldError(index, 'duration_min')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "duration_min") }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Status -->
                <div class="grid gap-2">
                  <label class="text-sm">Status</label>
                  <Select :model-value="d.status_id != null ? String(d.status_id) : ''"
                    @update:model-value="(v) => onStatusChange(index, String(v || ''))" :disabled="statusLoading">
                    <SelectTrigger class="h-10">
                      <SelectValue :placeholder="statusLoading ? 'Loading status...' : 'Select status'" />
                    </SelectTrigger>

                    <SelectContent>
                      <div class="max-h-80 overflow-auto" @scroll="onStatusScroll">
                        <SelectGroup>
                          <div class="sticky top-0 z-10 bg-background p-2 border-b">
                            <Input v-model="statusSearch" placeholder="Search status..." class="h-8"
                              @input="onStatusSearch(statusSearch)" @keydown.stop @click.stop />
                          </div>

                          <SelectItem v-for="o in statusOptions" :key="o.value" :value="o.value">
                            {{ o.label }}
                          </SelectItem>

                          <div v-if="statusLoading" class="p-2 text-sm text-muted-foreground">
                            Loading...
                          </div>

                          <div v-if="!statusLoading && statusOptions.length === 0"
                            class="p-2 text-sm text-muted-foreground">
                            No results
                          </div>
                        </SelectGroup>
                      </div>
                    </SelectContent>
                  </Select>

                  <p v-if="detailFieldError(index, 'status_id')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "status_id") }}
                  </p>
                </div>

                <!-- Activity -->
                <div class="grid gap-2">
                  <label class="text-sm">Activity</label>
                  <Select :model-value="d.activity_id != null ? String(d.activity_id) : ''"
                    @update:model-value="(v) => onActivityChange(index, String(v || ''))"
                    :disabled="!d.status_id || activityLoadingMap[index]">
                    <SelectTrigger class="h-10">
                      <SelectValue :placeholder="!d.status_id
                        ? 'Select status first'
                        : activityLoadingMap[index]
                          ? 'Loading activity...'
                          : 'Select activity'
                        " />
                    </SelectTrigger>

                    <SelectContent>
                      <div class="max-h-80 overflow-auto" @scroll="(e) => onActivityScroll(index, e)">
                        <SelectGroup>
                          <div class="sticky top-0 z-10 bg-background p-2 border-b">
                            <Input :model-value="activitySearchMap[index] ?? ''" placeholder="Search activity..."
                              class="h-8" @input="(e: any) => onActivitySearch(index, e?.target?.value || '')"
                              @keydown.stop @click.stop />
                          </div>

                          <SelectItem v-for="o in activityOptionsMap[index] ?? []" :key="o.value" :value="o.value">
                            {{ o.label }}
                          </SelectItem>

                          <div v-if="activityLoadingMap[index]" class="p-2 text-sm text-muted-foreground">
                            Loading...
                          </div>

                          <div v-if="!activityLoadingMap[index] && (activityOptionsMap[index] ?? []).length === 0"
                            class="p-2 text-sm text-muted-foreground">
                            No results
                          </div>
                        </SelectGroup>
                      </div>
                    </SelectContent>
                  </Select>

                  <p v-if="detailFieldError(index, 'activity_id')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "activity_id") }}
                  </p>
                </div>

                <!-- Location -->
                <div class="grid gap-2">
                  <label class="text-sm">Location</label>
                  <Select :model-value="d.location_id ?? ''"
                    @update:model-value="(v) => onLocationChange(index, String(v || ''))" :disabled="locationLoading">
                    <SelectTrigger class="h-10">
                      <SelectValue :placeholder="locationLoading ? 'Loading location...' : 'Select location'" />
                    </SelectTrigger>

                    <SelectContent>
                      <div class="max-h-80 overflow-auto" @scroll="onLocationScroll">
                        <SelectGroup>
                          <div class="sticky top-0 z-10 bg-background p-2 border-b">
                            <Input v-model="locationSearch" placeholder="Search location..." class="h-8"
                              @input="onLocationSearch(locationSearch)" @keydown.stop @click.stop />
                          </div>

                          <SelectItem v-for="o in locationOptions" :key="o.value" :value="o.value">
                            {{ o.label }}
                          </SelectItem>

                          <div v-if="locationLoading" class="p-2 text-sm text-muted-foreground">
                            Loading...
                          </div>

                          <div v-if="!locationLoading && locationOptions.length === 0"
                            class="p-2 text-sm text-muted-foreground">
                            No results
                          </div>
                        </SelectGroup>
                      </div>
                    </SelectContent>
                  </Select>

                  <p v-if="detailFieldError(index, 'location_id')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "location_id") }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="grid gap-2">
                  <label class="text-sm">Category</label>
                  <Input v-model="d.category" placeholder="MINING / PROJECT" />
                  <p v-if="detailFieldError(index, 'category')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "category") }}
                  </p>
                </div>

                <div class="grid gap-2">
                  <label class="text-sm">Description</label>
                  <Input v-model="d.description" placeholder="Description" />
                  <p v-if="detailFieldError(index, 'description')" class="text-sm text-destructive">
                    {{ detailFieldError(index, "description") }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="local.details.length === 0"
              class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No detail rows yet.
            </div>
          </div>

          <p v-if="fieldError('details')" class="text-sm text-destructive">
            {{ fieldError("details") }}
          </p>
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
        <Button :disabled="!canSubmit" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>