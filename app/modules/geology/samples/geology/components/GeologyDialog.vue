<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useApi } from "@/composables/useApi"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

function normalizeRole(v: any): UserRole {
  const raw = String(v ?? "").trim().toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(raw)) return raw as UserRole
  if (["SUPER_ADMIN", "SUPERADMIN", "ADMIN"].includes(raw)) return "SYSTEM"
  return "SITE_USER"
}

type LookupOption = {
  value: string
  label: string
}

export type SamplePayload = {
  id?: string | number
  iup?: number | null
  tgl_sample: string | null
  shift: string | null
  id_type_sample: number | null
  id_method: number | null
  id_material: number | null
  sampling_area: number | null
  sampling_point: number | null
  sampling_deskripsi: string | null
  batch_code: string | null
  increments: number | null
  sample_weight: number | null
  sample_number: string | null
  primer_raw: number | null
  duplicate_raw: number | null
  remark: string | null
  type: string | null
}

type FormState = {
  id?: string | number
  iup: number | null
  tgl_sample: string
  shift: string
  id_type_sample: string
  id_method: string
  id_material: string
  sampling_area: string
  sampling_point: string
  sampling_deskripsi: string
  batch_code: string
  increments: string
  sample_weight: string
  sample_number: string
  primer_raw: string
  duplicate_raw: string
  remark: string
  type: string
}

const { request } = useApi()

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: Record<string, any> | null
  loading?: boolean
  errors?: Record<string, any> | null
  fixedIup?: number | null
  fixedIupLabel?: string | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: SamplePayload): void
}>()
const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const currentRole = computed<UserRole>(() => normalizeRole(props.role))
const title = computed(() => (props.mode === "create" ? "Add Sample" : "Edit Sample"))
const close = () => emit("update:open", false)

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

function toNumberOrNull(v: string) {
  if (v == null || String(v).trim() === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const normalizeId = (v: any): number | null => {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === "object") {
    const n = Number(v.value ?? v.id ?? null)
    return Number.isFinite(n) ? n : null
  }
  return null
}
function normalizeDateInput(value: any): string {
  const v = String(value ?? "").trim()
  if (!v) return ""

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const slash = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slash) {
    const [, dd, mm, yyyy] = slash
    return `${yyyy}-${mm}-${dd}`
  }

  const iso = new Date(v)
  if (!Number.isNaN(iso.getTime())) {
    const yyyy = iso.getFullYear()
    const mm = String(iso.getMonth() + 1).padStart(2, "0")
    const dd = String(iso.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  return ""
}

function toLookupOption(item: any, fallbackValueKeys: string[], fallbackLabelKeys: string[]): LookupOption {
  const value =
    item?.value ??
    fallbackValueKeys.map((k) => item?.[k]).find((v) => v != null && String(v).trim() !== "") ??
    ""

  const label =
    item?.label ??
    fallbackLabelKeys.map((k) => item?.[k]).find((v) => v != null && String(v).trim() !== "") ??
    value

  return {
    value: String(value),
    label: String(label),
  }
}

const local = ref<FormState>({
  id: undefined,
  iup: null,
  tgl_sample: "",
  shift: "",
  id_type_sample: "",
  id_method: "",
  id_material: "",
  sampling_area: "",
  sampling_point: "",
  sampling_deskripsi: "",
  batch_code: "",
  increments: "",
  sample_weight: "",
  sample_number: "",
  primer_raw: "",
  duplicate_raw: "",
  remark: "",
  type: "",
})

const shiftOptions: LookupOption[] = [
  { value: "D", label: "D" },
  { value: "N", label: "N" },
]

const sampleTypeOptions = ref<LookupOption[]>([])
const sampleTypeLoading = ref(false)
const sampleTypeSearch = ref("")
const sampleTypePage = ref(1)
const sampleTypeHasMore = ref(true)

const sampleMethodOptions = ref<LookupOption[]>([])
const sampleMethodLoading = ref(false)
const sampleMethodSearch = ref("")
const sampleMethodPage = ref(1)
const sampleMethodHasMore = ref(true)

const materialOptions = ref<LookupOption[]>([])
const materialLoading = ref(false)
const materialSearch = ref("")
const materialPage = ref(1)
const materialHasMore = ref(true)

const samplingAreaOptions = ref<LookupOption[]>([])
const samplingAreaLoading = ref(false)
const samplingAreaSearch = ref("")
const samplingAreaPage = ref(1)
const samplingAreaHasMore = ref(true)

const samplingPointOptions = ref<LookupOption[]>([])
const samplingPointLoading = ref(false)
const samplingPointSearch = ref("")
const samplingPointPage = ref(1)
const samplingPointHasMore = ref(true)

/** penting: cegah watcher cascade reset saat init edit */
const isInitializing = ref(false)

function assignPagedOptions(target: { value: LookupOption[] }, items: LookupOption[], page: number) {
  const merged = page === 1 ? items : [...target.value, ...items]
  const seen = new Set<string>()

  target.value = merged.filter((item) => {
    if (!item.value) return false
    if (seen.has(item.value)) return false
    seen.add(item.value)
    return true
  })
}

function computeHasMore(currentLength: number, count: number) {
  return currentLength < count
}

function resetPagedLookup(
  optionsRef: { value: LookupOption[] },
  pageRef: { value: number },
  hasMoreRef: { value: boolean },
  searchRef?: { value: string }
) {
  optionsRef.value = []
  pageRef.value = 1
  hasMoreRef.value = true
  if (searchRef) searchRef.value = ""
}

function ensureOptionExists(
  optionsRef: { value: LookupOption[] },
  value: string,
  label?: string
) {
  if (!value) return

  const cleanLabel = String(label ?? "").trim()
  const exists = optionsRef.value.some((x) => String(x.value) === String(value))

  if (!exists) {
    optionsRef.value = [
      {
        value: String(value),
        label: cleanLabel || String(value),
      },
      ...optionsRef.value,
    ]
  }
}

function getInitialString(key: string, fallback = "") {
  const value = (props.initial as any)?.[key]
  if (value == null) return fallback
  return String(value)
}

function getInitialLabel(...keys: string[]) {
  for (const key of keys) {
    const value = (props.initial as any)?.[key]
    if (value != null && String(value).trim() !== "") {
      return String(value)
    }
  }
  return ""
}

// IUP LOOKUP

const mineIUPOptions = ref<Array<{ value: number; label: string }>>([])
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

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
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

const selectedMineIUPLabel = computed(() => {
  const v = local.value.iup
  if (v == null) return null
  return mineIUPOptions.value.find((x) => Number(x.value) === Number(v))?.label ?? null
})

function onMineIUPScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && mineIUPHasMore.value && !mineIUPLoading.value) {
    fetchMineIUP(mineIUPSearch.value, mineIUPPage.value + 1)
  }
}

// FETCH: SAMPLE TYPE
async function fetchSampleTypes(q = "", page = 1) {
  if (sampleTypeLoading.value) return

  sampleTypeLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/sample-type/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
         usage: "production,geology",
        value_key: "id",
        label_key: "type_sample",
      },
    })

    const items: LookupOption[] = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["type_sample", "name"])
    )

    const count = Number(res?.count ?? 0)

    assignPagedOptions(sampleTypeOptions, items, page)
    sampleTypePage.value = page
    sampleTypeHasMore.value = computeHasMore(sampleTypeOptions.value.length, count)
  } finally {
    sampleTypeLoading.value = false
  }
}

const onSampleTypeSearch = useDebounceFn((q: string) => {
  sampleTypePage.value = 1
  sampleTypeHasMore.value = true
  fetchSampleTypes(q, 1)
}, 300)

function onSampleTypeScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && sampleTypeHasMore.value && !sampleTypeLoading.value) {
    fetchSampleTypes(sampleTypeSearch.value, sampleTypePage.value + 1)
  }
}

/** =========================
 * FETCH: SAMPLE METHOD
 * ========================= */
async function fetchSampleMethods(q = "", page = 1) {
  if (!local.value.id_type_sample) return
  if (sampleMethodLoading.value) return

  sampleMethodLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/sample-method/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        sample_type_id: local.value.id_type_sample,
        value_key: "id",
        label_key: "sample_method",
      },
    })

    const items: LookupOption[] = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["sample_method", "name"])
    )

    const count = Number(res?.count ?? 0)
    assignPagedOptions(sampleMethodOptions, items, page)
    sampleMethodPage.value = page
    sampleMethodHasMore.value = computeHasMore(sampleMethodOptions.value.length, count)
  } finally {
    sampleMethodLoading.value = false
  }
}

const onSampleMethodSearch = useDebounceFn((q: string) => {
  sampleMethodPage.value = 1
  sampleMethodHasMore.value = true
  fetchSampleMethods(q, 1)
}, 300)

function onSampleMethodScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && sampleMethodHasMore.value && !sampleMethodLoading.value) {
    fetchSampleMethods(sampleMethodSearch.value, sampleMethodPage.value + 1)
  }
}

/** =========================
 * FETCH: MATERIAL
 * ========================= */
async function fetchMaterials(q = "", page = 1) {
  if (materialLoading.value) return
  materialLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/material/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        value_key: "id",
        label_key: "name",
      },
    })

    const items: LookupOption[] = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["name", "material"])
    )

    const count = Number(res?.count ?? 0)
    assignPagedOptions(materialOptions, items, page)
    materialPage.value = page
    materialHasMore.value = computeHasMore(materialOptions.value.length, count)
  } finally {
    materialLoading.value = false
  }
}

const onMaterialSearch = useDebounceFn((q: string) => {
  materialPage.value = 1
  materialHasMore.value = true
  fetchMaterials(q, 1)
}, 300)

function onMaterialScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && materialHasMore.value && !materialLoading.value) {
    fetchMaterials(materialSearch.value, materialPage.value + 1)
  }
}

/** =========================
 * FETCH: SAMPLING AREA
 * ========================= */
async function fetchSamplingAreas(q = "", page = 1) {
  if (samplingAreaLoading.value) return
  samplingAreaLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-dumping/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        value_key: "id",
        label_key: "dumping_point",
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
      },
    })

    const items: LookupOption[] = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["dumping_point", "name"])
    )

    const count = Number(res?.count ?? 0)
    assignPagedOptions(samplingAreaOptions, items, page)
    samplingAreaPage.value = page
    samplingAreaHasMore.value = computeHasMore(samplingAreaOptions.value.length, count)
  } finally {
    samplingAreaLoading.value = false
  }
}

const onSamplingAreaSearch = useDebounceFn((q: string) => {
  samplingAreaPage.value = 1
  samplingAreaHasMore.value = true
  fetchSamplingAreas(q, 1)
}, 300)

function onSamplingAreaScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && samplingAreaHasMore.value && !samplingAreaLoading.value) {
    fetchSamplingAreas(samplingAreaSearch.value, samplingAreaPage.value + 1)
  }
}

/** =========================
 * FETCH: SAMPLING POINT
 * ========================= */
async function fetchSamplingPoints(q = "", page = 1) {
  if (!local.value.sampling_area) return
  if (samplingPointLoading.value) return

  samplingPointLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-dome/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        value_key: "id",
        label_key: "pile_id",
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        ...(local.value.sampling_area ? { dumping_id: local.value.sampling_area } : {}),
      },
    })

    const items: LookupOption[] = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["pile_id", "name"])
    )

    const count = Number(res?.count ?? 0)
    assignPagedOptions(samplingPointOptions, items, page)
    samplingPointPage.value = page
    samplingPointHasMore.value = computeHasMore(samplingPointOptions.value.length, count)
  } finally {
    samplingPointLoading.value = false
  }
}

const onSamplingPointSearch = useDebounceFn((q: string) => {
  samplingPointPage.value = 1
  samplingPointHasMore.value = true
  fetchSamplingPoints(q, 1)
}, 300)

function onSamplingPointScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && samplingPointHasMore.value && !samplingPointLoading.value) {
    fetchSamplingPoints(samplingPointSearch.value, samplingPointPage.value + 1)
  }
}

/** =========================
 * CASCADE WATCH
 * ========================= */
watch(
  () => local.value.id_type_sample,
  async (val, oldVal) => {
    if (isInitializing.value) return
    if (val === oldVal) return

    local.value.id_method = ""
    resetPagedLookup(sampleMethodOptions, sampleMethodPage, sampleMethodHasMore, sampleMethodSearch)

    if (val) {
      await fetchSampleMethods("", 1)
    }
  }
)

watch(
  () => local.value.sampling_area,
  async (val, oldVal) => {
    if (isInitializing.value) return
    if (val === oldVal) return

    local.value.sampling_point = ""
    resetPagedLookup(samplingPointOptions, samplingPointPage, samplingPointHasMore, samplingPointSearch)

    if (val) {
      await fetchSamplingPoints("", 1)
    }
  }
)

/** =========================
 * SUBMIT
 * ========================= */
function submit() {
  const payload: SamplePayload = {
    id: local.value.id,
    iup: local.value.iup,
    tgl_sample: local.value.tgl_sample || null,
    shift: local.value.shift || null,
    id_type_sample: toNumberOrNull(local.value.id_type_sample),
    id_method: toNumberOrNull(local.value.id_method),
    id_material: toNumberOrNull(local.value.id_material),
    sampling_area: toNumberOrNull(local.value.sampling_area),
    sampling_point: toNumberOrNull(local.value.sampling_point),
    sampling_deskripsi: local.value.sampling_deskripsi.trim() || null,
    batch_code: local.value.batch_code.trim() || null,
    increments: toNumberOrNull(local.value.increments),
    sample_weight: toNumberOrNull(local.value.sample_weight),
    sample_number: local.value.sample_number.trim() || null,
    primer_raw: toNumberOrNull(local.value.primer_raw),
    duplicate_raw: toNumberOrNull(local.value.duplicate_raw),
    remark: local.value.remark.trim() || null,
    type: local.value.type.trim() || null,
  }

  if (canChooseIup.value) payload.iup = local.value.iup
  emit("submit", payload)
}

/** =========================
 * INIT
 * ========================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    isInitializing.value = true
    const iupId = normalizeId((props.initial as any)?.iup ?? (props.initial as any)?.active_iup)
    try {
      local.value = {
        id: props.initial?.id,
        iup: props.fixedIup ?? props.initial?.iup ?? null,
        tgl_sample: normalizeDateInput((props.initial as any)?.tgl_sample ?? (props.initial as any)?.date_sample),
        shift: getInitialString("shift"),
        id_type_sample: getInitialString("id_type_sample"),
        id_method: getInitialString("id_method"),
        id_material: getInitialString("id_material"),
        sampling_area: getInitialString("sampling_area"),
        sampling_point: getInitialString("sampling_point"),
        sampling_deskripsi: getInitialString("sampling_deskripsi"),
        batch_code: getInitialString("batch_code"),
        increments: (props.initial as any)?.increments != null ? String((props.initial as any).increments) : "",
        sample_weight: (props.initial as any)?.sample_weight != null ? String((props.initial as any).sample_weight) : "",
        sample_number: getInitialString("sample_number"),
        primer_raw: (props.initial as any)?.primer_raw != null ? String((props.initial as any).primer_raw) : "",
        duplicate_raw: (props.initial as any)?.duplicate_raw != null ? String((props.initial as any).duplicate_raw) : "",
        remark: getInitialString("remark"),
        type: getInitialString("type"),
      }

      resetPagedLookup(sampleTypeOptions, sampleTypePage, sampleTypeHasMore, sampleTypeSearch)
      resetPagedLookup(sampleMethodOptions, sampleMethodPage, sampleMethodHasMore, sampleMethodSearch)
      resetPagedLookup(materialOptions, materialPage, materialHasMore, materialSearch)
      resetPagedLookup(samplingAreaOptions, samplingAreaPage, samplingAreaHasMore, samplingAreaSearch)
      resetPagedLookup(samplingPointOptions, samplingPointPage, samplingPointHasMore, samplingPointSearch)

      await fetchSampleTypes("", 1)
      await fetchMaterials("", 1)
      await fetchSamplingAreas("", 1)

      ensureOptionExists(
        sampleTypeOptions,
        local.value.id_type_sample,
        getInitialLabel("type_sample_label", "type")
      )

      ensureOptionExists(
        materialOptions,
        local.value.id_material,
        getInitialLabel("material_label", "material", "material_name")
      )

      ensureOptionExists(
        samplingAreaOptions,
        local.value.sampling_area,
        getInitialLabel("sampling_area_label", "sampling_area_name", "sampling_area_text")
      )

      if (local.value.id_type_sample) {
        await fetchSampleMethods("", 1)
        ensureOptionExists(
          sampleMethodOptions,
          local.value.id_method,
          getInitialLabel("sample_method_label", "sample_method", "method_label")
        )
      }

      if (local.value.sampling_area) {
        await fetchSamplingPoints("", 1)
        ensureOptionExists(
          samplingPointOptions,
          local.value.sampling_point,
          getInitialLabel("sampling_point_label", "sampling_point")
        )
      }
      if (canChooseIup.value) {
        mineIUPSearch.value = ""
        mineIUPOptions.value = []
        mineIUPPage.value = 1
        mineIUPHasMore.value = true
        await fetchMineIUP("", 1)

        if (iupId != null && !mineIUPOptions.value.some((x) => Number(x.value) === Number(iupId))) {
          const label =
            (props.initial as any)?.iup_label ??
            (props.initial as any)?.active_iup_code ??
            `IUP #${iupId}`

          mineIUPOptions.value = [{ value: iupId, label }, ...mineIUPOptions.value]
        }
      }
    } finally {
      isInitializing.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <p v-if="role === 'SITE_USER'" class="text-xs text-muted-foreground">
          Unit akan otomatis diassign ke IUP aktif Anda.
        </p>
      
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Date</label>
            <Input v-model="local.tgl_sample" type="date" :disabled="!canMutate" />
            <p v-if="fieldError('tgl_sample')" class="text-sm text-destructive">
              {{ fieldError("tgl_sample") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Shift</label>
            <Select v-model="local.shift" :disabled="!canMutate">
              <SelectTrigger class="h-9">
                <SelectValue placeholder="Select Shift" />
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
            <label class="text-sm font-medium">Sample Type</label>
            <Select v-model="local.id_type_sample" :disabled="sampleTypeLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="sampleTypeLoading ? 'Loading...' : 'Select Sample Type'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onSampleTypeScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="sampleTypeSearch" placeholder="Search Sample Type..." class="h-8"
                      @input="onSampleTypeSearch(sampleTypeSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in sampleTypeOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="sampleTypeLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!sampleTypeLoading && sampleTypeOptions.length === 0"
                    class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_type_sample')" class="text-sm text-destructive">
              {{ fieldError("id_type_sample") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sample Method</label>
            <Select v-model="local.id_method" :disabled="sampleMethodLoading || !local.id_type_sample || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue
                  :placeholder="!local.id_type_sample ? 'Select Type first' : (sampleMethodLoading ? 'Loading...' : 'Select Method')" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onSampleMethodScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="sampleMethodSearch" placeholder="Search Sample Method..." class="h-8"
                      @input="onSampleMethodSearch(sampleMethodSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in sampleMethodOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="sampleMethodLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!sampleMethodLoading && sampleMethodOptions.length === 0"
                    class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_method')" class="text-sm text-destructive">
              {{ fieldError("id_method") }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Layer</label>
            <Select v-model="local.id_material" :disabled="materialLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="materialLoading ? 'Loading...' : 'Select Layer'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onMaterialScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="materialSearch" placeholder="Search Material..." class="h-8"
                      @input="onMaterialSearch(materialSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in materialOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="materialLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!materialLoading && materialOptions.length === 0"
                    class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_material')" class="text-sm text-destructive">
              {{ fieldError("id_material") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sampling Area</label>
            <Select v-model="local.sampling_area" :disabled="samplingAreaLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="samplingAreaLoading ? 'Loading...' : 'Select Sampling Area'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onSamplingAreaScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="samplingAreaSearch" placeholder="Search Sampling Area..." class="h-8"
                      @input="onSamplingAreaSearch(samplingAreaSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in samplingAreaOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="samplingAreaLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!samplingAreaLoading && samplingAreaOptions.length === 0"
                    class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('sampling_area')" class="text-sm text-destructive">
              {{ fieldError("sampling_area") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sampling Point</label>
            <Select v-model="local.sampling_point"
              :disabled="samplingPointLoading || !local.sampling_area || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue
                  :placeholder="!local.sampling_area ? 'Select Sampling Area first' : (samplingPointLoading ? 'Loading...' : 'Select Sampling Point')" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onSamplingPointScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="samplingPointSearch" placeholder="Search Sampling Point..." class="h-8"
                      @input="onSamplingPointSearch(samplingPointSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in samplingPointOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="samplingPointLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!samplingPointLoading && samplingPointOptions.length === 0"
                    class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('sampling_point')" class="text-sm text-destructive">
              {{ fieldError("sampling_point") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sampling Description</label>
            <Input v-model="local.sampling_deskripsi" placeholder="Sampling Description" :disabled="!canMutate" />
            <p v-if="fieldError('sampling_deskripsi')" class="text-sm text-destructive">
              {{ fieldError("sampling_deskripsi") }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Batch Code</label>
            <Input v-model="local.batch_code" placeholder="Batch Code" :disabled="!canMutate" />
            <!-- <p v-if="fieldError('batch_code')" class="text-sm text-destructive">
              {{ fieldError("batch_code") }}
            </p> -->
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Increment</label>
            <Input v-model="local.increments" type="number" placeholder="0" :disabled="!canMutate" />
            <p v-if="fieldError('increments')" class="text-sm text-destructive">
              {{ fieldError("increments") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sample Weight (Kg)</label>
            <Input v-model="local.sample_weight" type="number" step="any" placeholder="0.0" :disabled="!canMutate" />
            <p v-if="fieldError('sample_weight')" class="text-sm text-destructive">
              {{ fieldError("sample_weight") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sample Number</label>
            <Input v-model="local.sample_number" placeholder="Sample Number" :disabled="!canMutate" />
            <p v-if="fieldError('sample_number')" class="text-sm text-destructive">
              {{ fieldError("sample_number") }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Primer Raw (Kg)</label>
            <Input v-model="local.primer_raw" type="number" step="any" placeholder="0.0" :disabled="!canMutate" />
            <p v-if="fieldError('primer_raw')" class="text-sm text-destructive">
              {{ fieldError("primer_raw") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Duplicate Raw (Kg)</label>
            <Input v-model="local.duplicate_raw" type="number" step="any" placeholder="0.0" :disabled="!canMutate" />
            <p v-if="fieldError('duplicate_raw')" class="text-sm text-destructive">
              {{ fieldError("duplicate_raw") }}
            </p>
          </div>

          <!-- <div class="grid gap-2">
            <label class="text-sm font-medium">Type</label>
            <Input v-model="local.type" placeholder="Type" :disabled="!canMutate" />
          </div> -->

          <!-- <div class="grid gap-2">
            <label class="text-sm font-medium">Remark</label>
            <Input v-model="local.remark" placeholder="Remark" :disabled="!canMutate" />
            <p v-if="fieldError('remark')" class="text-sm text-destructive">
              {{ fieldError("remark") }}
            </p>
          </div> -->
            <div v-if="canChooseIup" class="grid gap-2">
          <label class="text-sm font-medium">IUP</label>

          <Select :model-value="local.iup != null ? String(local.iup) : ''"
            @update:model-value="(v) => (local.iup = v ? Number(v) : null)" :disabled="mineIUPLoading || !canMutate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
            </SelectTrigger>

            <SelectContent ref="mineIUPContentRef" class="max-h-80 overflow-auto" @scroll="onMineIUPScroll">
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input v-model="mineIUPSearch" placeholder="Search IUP..." class="h-8"
                    @input="onMineIUPSearch(mineIUPSearch)" @keydown.stop @click.stop />
                </div>

                <div v-if="local.iup != null && selectedMineIUPLabel"
                  class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                  Selected: <span class="font-medium">{{ selectedMineIUPLabel }}</span>
                </div>

                <SelectItem v-for="o in mineIUPOptions" :key="String(o.value)" :value="String(o.value)">
                  {{ o.label }}
                </SelectItem>

                <div v-if="mineIUPLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                <div v-if="!mineIUPLoading && mineIUPOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                  No results
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="fieldError('iup')" class="text-sm text-destructive">
            {{ fieldError("iup") }}
          </p>
        </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.remark" placeholder="Enter Description" :disabled="!canMutate" />
        </div>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
        <p v-if="fieldError('batch_code')" class="text-sm text-destructive" variant="destructive">
          {{ fieldError('batch_code') }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate" :disabled="loading ||
          !local.tgl_sample ||
          !local.shift ||
          !local.id_type_sample ||
          !local.id_method ||
          !local.id_material ||
          !local.sampling_area ||
          !local.sampling_point ||
          !local.batch_code ||
          !local.sample_number||
          (requiresIup && !local.iup)
          " @click="submit">
          {{ loading ? "Saving..." : "Submit" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>