<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useApi } from "@/composables/useApi"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type LookupOption = {
  value: string
  label: string
}

type MineIupOption = {
  value: number
  label: string
}

export type ProductionPayload = {
  id?: string | number
  iup?: number | null
  tgl_production: string | null
  shift: string | null
  id_block: number | null
  id_prospect_area: number | null
  from_rl: number | null
  to_rl: number | null
  id_material: number | null
  grade_expect: number | null
  grade_control: string | null
  unit_truck: string | null
  id_pile: number | null
  batch_code: string | null
  increment: number | null
  batch_status: string | null
  ritase: number | null
  tonnage: number | null
  pile_status: string | null
  kode_batch: string | null
  pile_original: string | null
  truck_factor: number | null
  ore_class: string | null
  batch_status_set: string | null
  dome_compositing: string | null
  stock_compositing: string | null
  status_dome: string | null
  sale_adjust: number | null
  remarks: string | null
  category: string | null
  direct: string | null
  no_production: string | null
}

type FormState = {
  id?: string | number
  iup: number | null
  tgl_production: string
  shift: string
  id_block: string
  id_prospect_area: string
  from_rl: string
  to_rl: string
  id_material: string
  grade_expect: string
  grade_control: string
  unit_truck: string
  id_pile: string
  batch_code: string
  increment: string
  batch_status: string
  ritase: string
  tonnage: string
  pile_status: string
  kode_batch: string
  pile_original: string
  truck_factor: string
  ore_class: string
  batch_status_set: string
  dome_compositing: string
  stock_compositing: string
  status_dome: string
  sale_adjust: string
  remarks: string
  category: string
  direct: boolean
  no_production: string
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
  (e: "submit", payload: ProductionPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const title = computed(() => (props.mode === "create" ? "Add Ore Production" : "Edit Ore Production"))

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

function normalizeDateInput(value: any): string {
  const v = String(value ?? "").trim()
  if (!v) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const dt = new Date(v)
  if (!Number.isNaN(dt.getTime())) {
    const yyyy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
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

  return { value: String(value), label: String(label) }
}

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

function ensureOptionExists(optionsRef: { value: LookupOption[] }, value: string, label?: string) {
  if (!value) return
  const exists = optionsRef.value.some((x) => String(x.value) === String(value))
  if (!exists) {
    optionsRef.value = [{ value: String(value), label: String(label || value) }, ...optionsRef.value]
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
    if (value != null && String(value).trim() !== "") return String(value)
  }
  return ""
}

const local = ref<FormState>({
  id: undefined,
  iup: null,
  tgl_production: "",
  shift: "",
  id_block: "",
  id_prospect_area: "",
  from_rl: "",
  to_rl: "",
  id_material: "",
  grade_expect: "",
  grade_control: "",
  unit_truck: "",
  id_pile: "",
  batch_code: "",
  increment: "",
  batch_status: "",
  ritase: "",
  tonnage: "",
  pile_status: "",
  kode_batch: "",
  pile_original: "",
  truck_factor: "",
  ore_class: "",
  batch_status_set: "",
  dome_compositing: "",
  stock_compositing: "",
  status_dome: "",
  sale_adjust: "",
  remarks: "",
  category: "",
  direct: false,
  no_production: "",
})

const isInitializing = ref(false)

const shiftOptions: LookupOption[] = [
  { value: "D", label: "D" },
  { value: "N", label: "N" },
]

const batchStatusOptions: LookupOption[] = [
  { value: "Complete", label: "Complete" },
  { value: "InComplete", label: "InComplete" },
]


const domeStatusOptions: LookupOption[] = [
  { value: "Continue", label: "Continue" },
  { value: "Close", label: "Close" },
]

/* IUP */
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
      query: { search: q, page, page_size: 10 },
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

/* BLOCK */
const blockOptions = ref<LookupOption[]>([])
const blockLoading = ref(false)
const blockSearch = ref("")
const blockPage = ref(1)
const blockHasMore = ref(true)

async function fetchBlocks(q = "", page = 1) {
  if (blockLoading.value) return
  blockLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-block/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        value_key: "id",
        label_key: "name",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["name"])
    )

    assignPagedOptions(blockOptions, items, page)
    blockPage.value = page
    blockHasMore.value = computeHasMore(blockOptions.value.length, Number(res?.count ?? 0))
  } finally {
    blockLoading.value = false
  }
}

const onBlockSearch = useDebounceFn((q: string) => {
  blockPage.value = 1
  blockHasMore.value = true
  fetchBlocks(q, 1)
}, 300)

function onBlockScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && blockHasMore.value && !blockLoading.value) {
    fetchBlocks(blockSearch.value, blockPage.value + 1)
  }
}

/* PROSPECT AREA */
const prospectOptions = ref<LookupOption[]>([])
const prospectLoading = ref(false)
const prospectSearch = ref("")
const prospectPage = ref(1)
const prospectHasMore = ref(true)

async function fetchProspects(q = "", page = 1) {
  if (prospectLoading.value) return
  prospectLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-loading/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        value_key: "id",
        label_key: "loading_point",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["prospect_area", "name"])
    )

    assignPagedOptions(prospectOptions, items, page)
    prospectPage.value = page
    prospectHasMore.value = computeHasMore(prospectOptions.value.length, Number(res?.count ?? 0))
  } finally {
    prospectLoading.value = false
  }
}

const onProspectSearch = useDebounceFn((q: string) => {
  prospectPage.value = 1
  prospectHasMore.value = true
  fetchProspects(q, 1)
}, 300)

function onProspectScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && prospectHasMore.value && !prospectLoading.value) {
    fetchProspects(prospectSearch.value, prospectPage.value + 1)
  }
}

/* MATERIAL */
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
        page_size: 10,
        categories: "ORE",
        value_key: "id",
        label_key: "name",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["name", "material"])
    )

    assignPagedOptions(materialOptions, items, page)
    materialPage.value = page
    materialHasMore.value = computeHasMore(materialOptions.value.length, Number(res?.count ?? 0))
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

/* ORE CLASS */
const oreClassOptions = ref<LookupOption[]>([])
const oreClassLoading = ref(false)
const oreClassSearch = ref("")
const oreClassPage = ref(1)
const oreClassHasMore = ref(true)

async function fetchOreClasses(q = "", page = 1) {
  if (!local.value.id_material) return
  if (oreClassLoading.value) return

  oreClassLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/ore-class/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        ...(local.value.id_material ? { material_id: local.value.id_material } : {}),
        value_key: "ore_class",
        label_key: "ore_class",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["ore_class", "id"], ["ore_class"])
    )

    assignPagedOptions(oreClassOptions, items, page)
    oreClassPage.value = page
    oreClassHasMore.value = computeHasMore(oreClassOptions.value.length, Number(res?.count ?? 0))
  } finally {
    oreClassLoading.value = false
  }
}

const onOreClassSearch = useDebounceFn((q: string) => {
  oreClassPage.value = 1
  oreClassHasMore.value = true
  fetchOreClasses(q, 1)
}, 300)

function onOreClassScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && oreClassHasMore.value && !oreClassLoading.value) {
    fetchOreClasses(oreClassSearch.value, oreClassPage.value + 1)
  }
}
/* TRUCK FACTOR */
const truckFactorOptions = ref<LookupOption[]>([])
const truckFactorLoading = ref(false)
const truckFactorSearch = ref("")
const truckFactorPage = ref(1)
const truckFactorHasMore = ref(true)

async function fetchTruckFactors(q = "", page = 1) {
  if (!local.value.id_material) return
  if (truckFactorLoading.value) return

  truckFactorLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/ore-truck-factors/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        ...(local.value.id_material ? { material_id: local.value.id_material } : {}),
        value_key: "ton",
        label_key: "type_tf",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["ton"], ["type_tf"])
    )

    assignPagedOptions(truckFactorOptions, items, page)
    truckFactorPage.value = page
    truckFactorHasMore.value = computeHasMore(
      truckFactorOptions.value.length,
      Number(res?.count ?? 0)
    )
  } finally {
    truckFactorLoading.value = false
  }
}

const onTruckFactorSearch = useDebounceFn((q: string) => {
  truckFactorPage.value = 1
  truckFactorHasMore.value = true
  fetchTruckFactors(q, 1)
}, 300)

function onTruckFactorScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && truckFactorHasMore.value && !truckFactorLoading.value) {
    fetchTruckFactors(truckFactorSearch.value, truckFactorPage.value + 1)
  }
}

function extractUnitTruck(label?: string): string {
  const raw: string = String(label ?? "").trim()

  if (!raw) return ""

  const parts = raw.split("-")
  return parts[0]?.trim() ?? ""
}

function syncUnitTruckFromTruckFactor() {
  const selected = truckFactorOptions.value.find(
    (item) => String(item.value) === String(local.value.truck_factor)
  )

  local.value.unit_truck = extractUnitTruck(selected?.label)
}

function recalculateTonnage() {
  const ritase = Number(local.value.ritase || 0)
  const ton = Number(local.value.truck_factor || 0)

  if (!ton) {
    local.value.tonnage = ""
    return
  }

  if (!ritase) {
    local.value.tonnage = ton.toFixed(2)
    return
  }

  local.value.tonnage = (ritase * ton).toFixed(2)
}

function syncInitialTonnage() {
  const initialTonnage = String(local.value.tonnage ?? "").trim()

  // kalau backend sudah kirim tonnage, tampilkan itu dulu
  if (initialTonnage !== "") {
    return
  }

  // kalau tonnage kosong, baru hitung otomatis
  recalculateTonnage()
}
/* CATEGORY */
const categoryOptions = ref<LookupOption[]>([])
const categoryLoading = ref(false)
const categorySearch = ref("")
const categoryPage = ref(1)
const categoryHasMore = ref(true)

async function fetchCategories(q = "", page = 1) {
  if (categoryLoading.value) return
  categoryLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-categories/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        value_key: "category",
        label_key: "category",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["category", "name"])
    )

    assignPagedOptions(categoryOptions, items, page)
    categoryPage.value = page
    categoryHasMore.value = computeHasMore(categoryOptions.value.length, Number(res?.count ?? 0))
  } finally {
    categoryLoading.value = false
  }
}

const onCategorySearch = useDebounceFn((q: string) => {
  categoryPage.value = 1
  categoryHasMore.value = true
  fetchCategories(q, 1)
}, 300)

function onCategoryScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && categoryHasMore.value && !categoryLoading.value) {
    fetchCategories(categorySearch.value, categoryPage.value + 1)
  }
}

/* DOME / PILE */
const pileOptions = ref<LookupOption[]>([])
const pileLoading = ref(false)
const pileSearch = ref("")
const pilePage = ref(1)
const pileHasMore = ref(true)

async function fetchPiles(q = "", page = 1) {
  if (!local.value.iup && requiresIup.value) return
  if (pileLoading.value) return

  pileLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-dome/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        value_key: "id",
        label_key: "pile_id",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["pile_id", "name"])
    )

    assignPagedOptions(pileOptions, items, page)
    pilePage.value = page
    pileHasMore.value = computeHasMore(
      pileOptions.value.length,
      Number(res?.count ?? 0)
    )
  } finally {
    pileLoading.value = false
  }
}

const onPileSearch = useDebounceFn((q: string) => {
  pilePage.value = 1
  pileHasMore.value = true
  fetchPiles(q, 1)
}, 300)

function onPileScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && pileHasMore.value && !pileLoading.value) {
    fetchPiles(pileSearch.value, pilePage.value + 1)
  }
}

/* GRADE CONTROL */
const gradeControlOptions = ref<LookupOption[]>([])
const gradeControlLoading = ref(false)
const gradeControlSearch = ref("")
const gradeControlPage = ref(1)
const gradeControlHasMore = ref(true)

async function fetchGradeControls(q = "", page = 1) {
  if (gradeControlLoading.value) return
  gradeControlLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/grade-control/", {
      method: "GET",
      query: {
        q,
        page,
        page_size: 10,
        ...(local.value.iup ? { iup_id: local.value.iup } : {}),
        value_key: "code",
        label_key: "name",
      },
    })

    const items = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["code", "id"], ["code", "name"])
    )

    assignPagedOptions(gradeControlOptions, items, page)
    gradeControlPage.value = page
    gradeControlHasMore.value = computeHasMore(
      gradeControlOptions.value.length,
      Number(res?.count ?? 0)
    )
  } finally {
    gradeControlLoading.value = false
  }
}

const onGradeControlSearch = useDebounceFn((q: string) => {
  gradeControlPage.value = 1
  gradeControlHasMore.value = true
  fetchGradeControls(q, 1)
}, 300)

function onGradeControlScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && gradeControlHasMore.value && !gradeControlLoading.value) {
    fetchGradeControls(gradeControlSearch.value, gradeControlPage.value + 1)
  }
}

/* WATCH CASCADE */
watch(
  () => local.value.iup,
  async (val, oldVal) => {
    if (isInitializing.value) return
    if (val === oldVal) return

    local.value.id_block = ""
    local.value.id_prospect_area = ""
    local.value.id_pile = ""
    local.value.category = ""
    local.value.truck_factor = ""
    local.value.ore_class = ""

    resetPagedLookup(blockOptions, blockPage, blockHasMore, blockSearch)
    resetPagedLookup(prospectOptions, prospectPage, prospectHasMore, prospectSearch)
    resetPagedLookup(pileOptions, pilePage, pileHasMore, pileSearch)
    resetPagedLookup(categoryOptions, categoryPage, categoryHasMore, categorySearch)
    resetPagedLookup(truckFactorOptions, truckFactorPage, truckFactorHasMore, truckFactorSearch)
    resetPagedLookup(oreClassOptions, oreClassPage, oreClassHasMore, oreClassSearch)

    await Promise.all([
      fetchBlocks("", 1),
      fetchProspects("", 1),
      fetchMaterials("", 1),
      fetchPiles("", 1),
      fetchCategories("", 1),
    ])

    if (local.value.id_material) {
      await Promise.all([
        fetchOreClasses("", 1),
        fetchTruckFactors("", 1),
      ])
    }
  }
)

watch(
  () => local.value.truck_factor,
  () => {
    recalculateTonnage()
    syncUnitTruckFromTruckFactor()
  }
)

watch(
  () => local.value.ritase,
  () => {
    recalculateTonnage()
  }
)

watch(
  () => local.value.id_material,
  async (val, oldVal) => {
    if (isInitializing.value) return
    if (val === oldVal) return

    local.value.ore_class = ""
    local.value.truck_factor = ""
    local.value.tonnage = ""
    local.value.unit_truck = ""

    resetPagedLookup(oreClassOptions, oreClassPage, oreClassHasMore, oreClassSearch)
    resetPagedLookup(truckFactorOptions, truckFactorPage, truckFactorHasMore, truckFactorSearch)

    if (val) {
      await Promise.all([
        fetchOreClasses("", 1),
        fetchTruckFactors("", 1),
      ])
    }
  }
)

/* SUBMIT */
function submit() {
  const payload: ProductionPayload = {
    id: local.value.id,
    iup: local.value.iup,
    tgl_production: local.value.tgl_production || null,
    shift: local.value.shift || null,
    id_block: toNumberOrNull(local.value.id_block),
    id_prospect_area: toNumberOrNull(local.value.id_prospect_area),
    from_rl: toNumberOrNull(local.value.from_rl),
    to_rl: toNumberOrNull(local.value.to_rl),
    id_material: toNumberOrNull(local.value.id_material),
    grade_expect: toNumberOrNull(local.value.grade_expect),
    grade_control: local.value.grade_control.trim() || null,
    unit_truck: local.value.unit_truck.trim() || null,
    id_pile: toNumberOrNull(local.value.id_pile),
    batch_code: local.value.batch_code.trim() || null,
    increment: toNumberOrNull(local.value.increment),
    batch_status: local.value.batch_status || null,
    ritase: toNumberOrNull(local.value.ritase),
    tonnage: toNumberOrNull(local.value.tonnage),
    pile_status: local.value.pile_status || null,
    kode_batch: local.value.kode_batch.trim() || null,
    pile_original: local.value.pile_original.trim() || null,
    truck_factor: toNumberOrNull(local.value.truck_factor),
    ore_class: local.value.ore_class || null,
    batch_status_set: local.value.batch_status_set.trim() || null,
    dome_compositing: local.value.dome_compositing.trim() || null,
    stock_compositing: local.value.stock_compositing.trim() || null,
    status_dome: local.value.status_dome || null,
    sale_adjust: toNumberOrNull(local.value.sale_adjust),
    remarks: local.value.remarks.trim() || null,
    category: local.value.category || null,
    direct: local.value.direct ? "Yes" : "No",
    no_production: local.value.no_production.trim() || null,
  }

  emit("submit", payload)
}

/* INIT */
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    isInitializing.value = true
    try {
      local.value = {
        id: props.initial?.id,
        iup: props.fixedIup ?? props.initial?.iup ?? null,
        tgl_production: normalizeDateInput((props.initial as any)?.tgl_production),
        shift: getInitialString("shift"),
        id_block: getInitialString("id_block"),
        id_prospect_area: getInitialString("id_prospect_area"),
        from_rl: getInitialString("from_rl"),
        to_rl: getInitialString("to_rl"),
        id_material: getInitialString("id_material"),
        grade_expect: getInitialString("grade_expect"),
        grade_control: getInitialString("grade_control"),
        unit_truck: getInitialString("unit_truck"),
        id_pile: getInitialString("id_pile"),
        batch_code: getInitialString("batch_code"),
        increment: getInitialString("increment"),
        batch_status: getInitialString("batch_status"),
        ritase: getInitialString("ritase"),
        tonnage: getInitialString("tonnage"),
        pile_status: getInitialString("pile_status"),
        kode_batch: getInitialString("kode_batch"),
        pile_original: getInitialString("pile_original"),
        truck_factor: getInitialString("truck_factor"),
        ore_class: getInitialString("ore_class"),
        batch_status_set: getInitialString("batch_status_set"),
        dome_compositing: getInitialString("dome_compositing"),
        stock_compositing: getInitialString("stock_compositing"),
        status_dome: getInitialString("status_dome"),
        sale_adjust: getInitialString("sale_adjust"),
        remarks: getInitialString("remarks"),
        category: getInitialString("category"),
        direct: String((props.initial as any)?.direct ?? "").toLowerCase() === "yes",
        no_production: getInitialString("no_production"),
      }

      resetPagedLookup(blockOptions, blockPage, blockHasMore, blockSearch)
      resetPagedLookup(prospectOptions, prospectPage, prospectHasMore, prospectSearch)
      resetPagedLookup(materialOptions, materialPage, materialHasMore, materialSearch)
      resetPagedLookup(pileOptions, pilePage, pileHasMore, pileSearch)
      resetPagedLookup(oreClassOptions, oreClassPage, oreClassHasMore, oreClassSearch)
      resetPagedLookup(categoryOptions, categoryPage, categoryHasMore, categorySearch)
      resetPagedLookup(truckFactorOptions, truckFactorPage, truckFactorHasMore, truckFactorSearch)
      resetPagedLookup(gradeControlOptions, gradeControlPage, gradeControlHasMore, gradeControlSearch)

      await Promise.all([
        fetchBlocks("", 1),
        fetchProspects("", 1),
        fetchMaterials("", 1),
        fetchPiles("", 1),
        fetchCategories("", 1),
        fetchGradeControls("", 1),
      ])

      ensureOptionExists(blockOptions, local.value.id_block, getInitialLabel("block_label"))
      ensureOptionExists(prospectOptions, local.value.id_prospect_area, getInitialLabel("prospect_label"))
      ensureOptionExists(materialOptions, local.value.id_material, getInitialLabel("material_label"))
      ensureOptionExists(pileOptions, local.value.id_pile, getInitialLabel("pile_label", "id_pile_label", "pile_id"))
      ensureOptionExists(gradeControlOptions, local.value.grade_control, getInitialLabel("grade_control_label", "grade_control", "code"))

      if (local.value.id_material) {
        await Promise.all([
          fetchOreClasses("", 1),
          fetchTruckFactors("", 1),
        ])

        ensureOptionExists(
          oreClassOptions,
          local.value.ore_class,
          local.value.ore_class
        )

        ensureOptionExists(
          truckFactorOptions,
          local.value.truck_factor,
          local.value.truck_factor
        )
      }

      if (canChooseIup.value) {
        mineIUPSearch.value = ""
        mineIUPOptions.value = []
        mineIUPPage.value = 1
        mineIUPHasMore.value = true
        await fetchMineIUP("", 1)
      }
      syncUnitTruckFromTruckFactor()
      syncInitialTonnage()
    } finally {
      isInitializing.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-6">
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
                  <SelectItem v-for="o in mineIUPOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('iup')" class="text-sm text-destructive">{{ fieldError("iup") }}</p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Category</label>
            <Select v-model="local.category" :disabled="categoryLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="categoryLoading ? 'Loading...' : 'Select Category'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onCategoryScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="categorySearch" placeholder="Search Category..." class="h-8"
                      @input="onCategorySearch(categorySearch)" @keydown.stop @click.stop />
                  </div>
                  <SelectItem v-for="o in categoryOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('category')" class="text-sm text-destructive">{{ fieldError("category") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Date</label>
            <Input v-model="local.tgl_production" type="date" :disabled="!canMutate" />
            <p v-if="fieldError('tgl_production')" class="text-sm text-destructive">
              {{ fieldError("tgl_production") }}
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
            <p v-if="fieldError('shift')" class="text-sm text-destructive">{{ fieldError("shift") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Block</label>
            <Select v-model="local.id_block" :disabled="blockLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="blockLoading ? 'Loading...' : 'Select Block'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onBlockScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="blockSearch" placeholder="Search Block..." class="h-8"
                      @input="onBlockSearch(blockSearch)" @keydown.stop @click.stop />
                  </div>
                  <SelectItem v-for="o in blockOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_block')" class="text-sm text-destructive">{{ fieldError("id_block") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Prospect Area</label>
            <Select v-model="local.id_prospect_area" :disabled="prospectLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="prospectLoading ? 'Loading...' : 'Select Prospect Area'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onProspectScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="prospectSearch" placeholder="Search Prospect Area..." class="h-8"
                      @input="onProspectSearch(prospectSearch)" @keydown.stop @click.stop />
                  </div>
                  <SelectItem v-for="o in prospectOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_prospect_area')" class="text-sm text-destructive">
              {{ fieldError("id_prospect_area") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">From RL</label>
            <Input v-model="local.from_rl" type="number" step="any" placeholder="0" :disabled="!canMutate" />
            <p v-if="fieldError('from_rl')" class="text-sm text-destructive">{{ fieldError("from_rl") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">To RL</label>
            <Input v-model="local.to_rl" type="number" step="any" placeholder="0" :disabled="!canMutate" />
            <p v-if="fieldError('to_rl')" class="text-sm text-destructive">{{ fieldError("to_rl") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Material</label>
            <Select v-model="local.id_material" :disabled="materialLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="materialLoading ? 'Loading...' : 'Select Material'" />
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
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_material')" class="text-sm text-destructive">{{ fieldError("id_material") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Ore Class</label>
            <Select v-model="local.ore_class" :disabled="oreClassLoading || !canMutate || !local.id_material">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="oreClassLoading ? 'Loading...' : 'Select Ore Class'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onOreClassScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="oreClassSearch" placeholder="Search Ore Class..." class="h-8"
                      @input="onOreClassSearch(oreClassSearch)" @keydown.stop @click.stop />
                  </div>
                  <SelectItem v-for="o in oreClassOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('ore_class')" class="text-sm text-destructive">{{ fieldError("ore_class") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Ni Expect</label>
            <Input v-model="local.grade_expect" type="number" step="any" placeholder="0.00" :disabled="!canMutate" />
            <p v-if="fieldError('grade_expect')" class="text-sm text-destructive">{{ fieldError("grade_expect") }}</p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Grade Control</label>
            <Select v-model="local.grade_control" :disabled="gradeControlLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="gradeControlLoading ? 'Loading...' : 'Select Grade Control'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onGradeControlScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="gradeControlSearch" placeholder="Search Grade Control..." class="h-8"
                      @input="onGradeControlSearch(gradeControlSearch)" @keydown.stop @click.stop />
                  </div>

                  <SelectItem v-for="o in gradeControlOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('grade_control')" class="text-sm text-destructive">
              {{ fieldError("grade_control") }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Dome / Pile</label>
            <Select v-model="local.id_pile" :disabled="pileLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="pileLoading ? 'Loading...' : 'Select Dome / Pile'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onPileScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="pileSearch" placeholder="Search Dome / Pile..." class="h-8"
                      @input="onPileSearch(pileSearch)" @keydown.stop @click.stop />
                  </div>
                  <SelectItem v-for="o in pileOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('id_pile')" class="text-sm text-destructive">
              {{ fieldError("id_pile") }}
            </p>
          </div>


          <div class="grid gap-2">
            <label class="text-sm font-medium">Batch Code</label>
            <Input v-model="local.batch_code" placeholder="Batch Code" :disabled="!canMutate" />

          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Increment</label>
            <Input v-model="local.increment" type="number" placeholder="0" :disabled="!canMutate" />
            <p v-if="fieldError('increment')" class="text-sm text-destructive">{{ fieldError("increment") }}</p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Batch Status</label>
            <Select v-model="local.batch_status" :disabled="!canMutate">
              <SelectTrigger class="h-9">
                <SelectValue placeholder="Select Batch Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="o in batchStatusOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('batch_status')" class="text-sm text-destructive">{{ fieldError("batch_status") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Status Dome</label>
            <Select v-model="local.status_dome" :disabled="!canMutate">
              <SelectTrigger class="h-9">
                <SelectValue placeholder="Select Status Dome" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="o in domeStatusOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('status_dome')" class="text-sm text-destructive">{{ fieldError("status_dome") }}</p>
          </div>


          <div class="grid gap-2">
            <label class="text-sm font-medium">Truck Factor</label>
            <Select v-model="local.truck_factor" :disabled="truckFactorLoading || !canMutate || !local.id_material">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="truckFactorLoading ? 'Loading...' : 'Select Truck Factor'" />
              </SelectTrigger>
              <SelectContent class="max-h-80 overflow-auto" @scroll="onTruckFactorScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="truckFactorSearch" placeholder="Search Truck Factor..." class="h-8"
                      @input="onTruckFactorSearch(truckFactorSearch)" @keydown.stop @click.stop />
                  </div>
                  <SelectItem v-for="o in truckFactorOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('truck_factor')" class="text-sm text-destructive">{{ fieldError("truck_factor") }}</p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Ritase</label>
            <Input v-model="local.ritase" type="number" step="any" placeholder="0" :disabled="!canMutate" />
            <p v-if="fieldError('ritase')" class="text-sm text-destructive">{{ fieldError("ritase") }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Tonnage</label>
            <Input v-model="local.tonnage" type="number" step="any" placeholder="0" disabled />
            <p v-if="fieldError('tonnage')" class="text-sm text-destructive">
              {{ fieldError("tonnage") }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Unit Truck</label>
            <Input v-model="local.unit_truck" placeholder="Unit Truck" :disabled="!canMutate" />
          </div>

        </div>

        <div class="flex items-center gap-3">
          <label class="text-sm font-medium">Direct</label>

          <input v-model="local.direct" type="checkbox" class="h-4 w-4" :disabled="!canMutate" />

          <span class="text-sm text-muted-foreground">
            {{ local.direct ? "Yes" : "No" }}
          </span>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Remarks</label>
          <Textarea v-model="local.remarks" placeholder="Enter remarks" :disabled="!canMutate" />
        </div>
        <p v-if="fieldError('batch_code')" class="text-sm text-destructive">{{ fieldError("batch_code") }}</p>
        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate" :disabled="loading ||
          !local.tgl_production ||
          !local.shift ||
          !local.id_prospect_area ||
          !local.id_block ||
          !local.id_material ||
          !local.id_pile ||
          // !local.batch_code ||
          !local.ritase ||
          !local.tonnage ||
          (requiresIup && !local.iup)
          " @click="submit">
          {{ loading ? "Saving..." : "Submit" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>