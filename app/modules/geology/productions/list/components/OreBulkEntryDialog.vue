<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useApi } from "@/composables/useApi"
type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"



type LookupOption = {
  value: string
  label: string
}

type RowState = {
  iup: number | null
  tgl_production: string
  category: string
  shift: string
  id_prospect_area: string
  id_block: string
  from_rl: string
  to_rl: string
  id_material: string
  ore_class: string
  grade_expect: string
  grade_control: string
  id_pile: string
  batch_code: string
  truck_factor: string
  unit_truck: string
  ritase: string
  tonnage: string
  increment: string
  batch_status: string
  status_dome: string
  direct: boolean
  remarks: string
  oreClassOptions: LookupOption[]
  truckFactorOptions: LookupOption[]
  oreClassLoading: boolean
  truckFactorLoading: boolean 

  prospectOptions: LookupOption[]
  blockOptions: LookupOption[]
  materialOptions: LookupOption[]
  gradeControlOptions: LookupOption[]
  pileOptions: LookupOption[]

  prospectLoading: boolean
  blockLoading: boolean
  materialLoading: boolean
  gradeControlLoading: boolean
  pileLoading: boolean

  prospectSearch: string
  blockSearch: string
  materialSearch: string
  gradeControlSearch: string
  pileSearch: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  role: UserRole
  fixedIup?: number | null
  fixedIupLabel?: string | null
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "submit", payload: any[]): void
}>()

const { request } = useApi()

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyRow(): RowState {
  return {
    iup: props.fixedIup ?? null,
    tgl_production: today(),
    category: "",
    shift: "",
    id_prospect_area: "",
    id_block: "",
    from_rl: "",
    to_rl: "",
    id_material: "",
    ore_class: "",
    grade_expect: "",
    grade_control: "",
    id_pile: "",
    truck_factor: "",
    unit_truck: "",
    ritase: "",
    tonnage: "",
    increment: "",
    batch_status: "",
    status_dome: "",
    direct: false,
    remarks: "",
    batch_code: "",
    oreClassOptions: [],
    truckFactorOptions: [],
    oreClassLoading: false,
    truckFactorLoading: false,

    prospectOptions: [],
    blockOptions: [],
    materialOptions: [],
    gradeControlOptions: [],
    pileOptions: [],

    prospectLoading: false,
    blockLoading: false,
    materialLoading: false,
    gradeControlLoading: false,
    pileLoading: false,

    prospectSearch: "",
    blockSearch: "",
    materialSearch: "",
    gradeControlSearch: "",
    pileSearch: "",
  }
}

const rows = ref<RowState[]>([emptyRow(), emptyRow(), emptyRow()])
const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")

function toNumberOrNull(value: string) {
  if (!value || String(value).trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toLookupOption(item: any, valueKeys: string[], labelKeys: string[]): LookupOption {
  const value =
    item?.value ??
    valueKeys.map(k => item?.[k]).find(v => v != null && String(v).trim() !== "") ??
    ""

  const label =
    item?.label ??
    labelKeys.map(k => item?.[k]).find(v => v != null && String(v).trim() !== "") ??
    value

  return {
    value: String(value),
    label: String(label),
  }
}

// function addRow() {
//   const last = rows.value[rows.value.length - 1]

//   rows.value.push(
//     last
//       ? {
//           ...last,
//           ritase: "",
//           tonnage: "",
//           remarks: "",
//         }
//       : emptyRow()
//   )
// }

function addRow() {
  const row = emptyRow()

  rows.value.push(row)

  fetchBlocks(row)
  fetchProspects(row)
  fetchMaterials(row)
  fetchPiles(row)
  fetchGradeControls(row)
}

function duplicateRow(index: number) {
  const current = rows.value[index]
  if (!current) return

  rows.value.splice(index + 1, 0, {
    ...current,

    prospectOptions: [...current.prospectOptions],
    blockOptions: [...current.blockOptions],
    materialOptions: [...current.materialOptions],
    gradeControlOptions: [...current.gradeControlOptions],
    pileOptions: [...current.pileOptions],

    oreClassOptions: [...current.oreClassOptions],
    truckFactorOptions: [...current.truckFactorOptions],
  })
}
function removeRow(index: number) {
  if (rows.value.length === 1) return
  rows.value.splice(index, 1)
}

function extractUnitTruck(label?: string) {
  const raw = String(label ?? "").trim()
  if (!raw) return ""

  return raw.split("-")[0]?.trim() ?? ""
}

function recalculateTonnage(row: RowState) {
  const ritase = Number(row.ritase || 0)
  const tf = Number(row.truck_factor || 0)

  if (!tf) {
    row.tonnage = ""
    return
  }

  row.tonnage = ritase ? (ritase * tf).toFixed(2) : tf.toFixed(2)
}

function onTruckFactorChange(row: RowState) {
  const selected = row.truckFactorOptions.find(
    item => String(item.value) === String(row.truck_factor)
  )

  row.unit_truck = extractUnitTruck(selected?.label)
  recalculateTonnage(row)
}

/* OPTIONS */
const categoryOptions = ref<LookupOption[]>([])
const mineIUPOptions = ref<MineIupOption[]>([])

const categorySearch = ref("")

const categoryLoading = ref(false)
const mineIUPLoading = ref(false)

async function fetchCategories(q = "") {
  categoryLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-categories/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        value_key: "category",
        label_key: "category",
      },
    })

    categoryOptions.value = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["category", "name"], ["category", "name"])
    )
  } finally {
    categoryLoading.value = false
  }
}

async function fetchBlocks(row: RowState, q = "") {
  row.blockLoading = true

  try {
    const res: any = await request("/api/master/lookups/mine-block/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        value_key: "id",
        label_key: "name",
      },
    })

    row.blockOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["name"])
    )
  } finally {
    row.blockLoading = false
  }
}


async function fetchProspects(row: RowState, q = "") {
  row.prospectLoading = true
  try {
    const res: any = await request("/api/master/lookups/mine-loading/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        value_key: "id",
        label_key: "loading_point",
      },
    })

    row.prospectOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["loading_point", "prospect_area", "name"])
    )
  } finally {
    row.prospectLoading = false
  }
}

async function fetchMaterials(row: RowState, q = "") {
  row.materialLoading = true
  try {
    const res: any = await request("/api/master/lookups/material/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        categories: "ORE",
        value_key: "id",
        label_key: "name",
      },
    })

    row.materialOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["name", "material"])
    )
  } finally {
    row.materialLoading = false
  }
}

async function fetchPiles(row: RowState, q = "") {
  row.pileLoading = true

  try {
    const res: any = await request("/api/master/lookups/mine-dome/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        value_key: "id",
        label_key: "pile_id",
      },
    })

    row.pileOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["pile_id", "name"])
    )
  } finally {
    row.pileLoading = false
  }
}

async function fetchGradeControls(row: RowState, q = "") {
  row.gradeControlLoading = true

  try {
    const res: any = await request(
      "/api/master/lookups/grade-control/",
      {
        method: "GET",
        query: {
          q,
          page: 1,
          page_size: 20,
          value_key: "code",
          label_key: "name",
        },
      }
    )

    row.gradeControlOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["code", "id"], ["code", "name"])
    )
  } finally {
    row.gradeControlLoading = false
  }
}

async function fetchOreClasses(row: RowState, q = "") {
    if (!row.id_material) {
    row.oreClassOptions = []
    return
  }

  row.oreClassLoading = true

  try {
    const res: any = await request("/api/master/lookups/ore-class/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        material_id: row.id_material,
        value_key: "ore_class",
        label_key: "ore_class",
      },
    })

    row.oreClassOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["ore_class", "id"], ["ore_class"])
    )
  } finally {
    row.oreClassLoading = false
  }
}

async function fetchTruckFactors(row: RowState, q = "") {
  if (!row.id_material) {
    row.truckFactorOptions = []
    return
  }

  row.truckFactorLoading = true

  try {
    const res: any = await request("/api/master/lookups/ore-truck-factors/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        material_id: row.id_material,
        value_key: "ton",
        label_key: "type_tf",
      },
    })

    row.truckFactorOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["ton"], ["type_tf"])
    )
  } finally {
    row.truckFactorLoading = false
  }
}

type MineIupOption = {
  value: number
  label: string
}


async function fetchMineIUP() {
  if (!canChooseIup.value) return

  mineIUPLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: {
        page: 1,
        page_size: 50,
      },
    })

    mineIUPOptions.value = res?.results ?? []
  } finally {
    mineIUPLoading.value = false
  }
}

const onCategorySearch = useDebounceFn(() => fetchCategories(categorySearch.value), 300)

const onBlockSearch = useDebounceFn((row: RowState) => {
  fetchBlocks(row, row.blockSearch)
}, 300)

const onProspectSearch = useDebounceFn((row: RowState) => {
  fetchProspects(row, row.prospectSearch)
}, 300)

const onMaterialSearch = useDebounceFn((row: RowState) => {
  fetchMaterials(row, row.materialSearch)
}, 300)

const onPileSearch = useDebounceFn((row: RowState) => {
  fetchPiles(row, row.pileSearch)
}, 300)

const onGradeControlSearch = useDebounceFn((row: RowState) => {
  fetchGradeControls(row, row.gradeControlSearch)
}, 300)

const onOreClassSearch = useDebounceFn((row: RowState, q: string) => {
  fetchOreClasses(row, q)
}, 300)

const onTruckFactorSearch = useDebounceFn((row: RowState, q: string) => {
  fetchTruckFactors(row, q)
}, 300)

async function onMaterialChange(row: RowState) {
  row.ore_class = ""
  row.truck_factor = ""
  row.unit_truck = ""
  row.tonnage = ""

  await Promise.all([
    fetchOreClasses(row),
    fetchTruckFactors(row),
  ])
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    await Promise.all([
      fetchMineIUP(),
      fetchCategories(),
      ...rows.value.flatMap(row => [
        fetchBlocks(row),
        fetchProspects(row),
        fetchMaterials(row),
        fetchPiles(row),
        fetchGradeControls(row),
      ]),
    ])
  },
  { immediate: true }
)

const canSubmit = computed(() => {
  return rows.value.some(row =>
    (!requiresIup.value || row.iup) &&
    row.tgl_production &&
    row.shift &&
    row.id_prospect_area &&
    row.id_block &&
    row.id_material &&
    row.id_pile &&
    row.batch_code &&
    row.ritase &&
    row.tonnage &&
    row.increment &&
    row.batch_status &&
    row.status_dome
  )
})

function submit() {
  const payload = rows.value
    .filter(row =>
      (!requiresIup.value || row.iup) &&
      row.tgl_production &&
      row.shift &&
      row.id_prospect_area &&
      row.id_block &&
      row.id_material &&
      row.id_pile &&
      row.ritase &&
      row.tonnage
    )
    .map(row => {
      const selectedTruck = row.truckFactorOptions.find(
        item => String(item.value) === String(row.truck_factor)
      )

      return {
        iup: row.iup,
        tgl_production: row.tgl_production,
        category: row.category || null,
        shift: row.shift || null,
        id_prospect_area: toNumberOrNull(row.id_prospect_area),
        id_block: toNumberOrNull(row.id_block),
        from_rl: toNumberOrNull(row.from_rl),
        to_rl: toNumberOrNull(row.to_rl),
        id_material: toNumberOrNull(row.id_material),
        ore_class: row.ore_class || null,
        grade_expect: toNumberOrNull(row.grade_expect),
        grade_control: row.grade_control || null,
        id_pile: toNumberOrNull(row.id_pile),
        batch_code: row.batch_code || null,
        truck_factor:row.unit_truck || extractUnitTruck(selectedTruck?.label) || null,
        unit_truck: row.unit_truck || extractUnitTruck(selectedTruck?.label) || null,
        ritase: toNumberOrNull(row.ritase),
        tonnage: toNumberOrNull(row.tonnage),
        increment: toNumberOrNull(row.increment),
        batch_status: row.batch_status || null,
        status_dome: row.status_dome || null,
        direct: row.direct ? "Yes" : "No",
        remarks: row.remarks || null,
      }
    })

  emit("submit", payload)
}
</script>

<template>
  <Dialog :open="open" @update:open="v => emit('update:open', v)">
    <DialogContent
        class="sm:max-w-9xl max-w-[96vw] h-[80vh] overflow-hidden flex flex-col"
        @pointer-down-outside.prevent
        @interact-outside.prevent
        @escape-key-down.prevent
        >
      <DialogHeader>
        <DialogTitle>Add Multiple Ore Production</DialogTitle>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-auto scroll-thin border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[90px]">Action</TableHead>
              <TableHead v-if="canChooseIup">IUP</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Prospect Area</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>From RL</TableHead>
              <TableHead>To RL</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Ore Class</TableHead>
              <TableHead>Ni Expect</TableHead>
              <TableHead>Grade Control</TableHead>
              <TableHead>Dome / Pile</TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Truck Factor</TableHead>
              <TableHead>Ritase</TableHead>
              <TableHead>Tonnage</TableHead>
              <TableHead>Unit Truck</TableHead>
              <TableHead>Increment</TableHead>
              <TableHead>Batch Status</TableHead>
              <TableHead>Status Dome</TableHead>
              <TableHead>Direct</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-for="(row, index) in rows" :key="index">
              <TableCell>
                <div class="flex gap-1">
                  <Button size="icon" variant="ghost" @click="duplicateRow(index)">
                    <Icon name="i-lucide-copy" class="h-4 w-4" />
                  </Button>

                  <Button size="icon" variant="ghost" @click="removeRow(index)">
                    <Icon name="i-lucide-x" class="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>

              <TableCell v-if="canChooseIup">
                    <Select
                        :model-value="row.iup != null ? String(row.iup) : ''"
                        @update:model-value="v => row.iup = v ? Number(v) : null"  >
                        <SelectTrigger class="w-32">
                        <SelectValue placeholder="Select IUP" />
                        </SelectTrigger>

                        <SelectContent class="max-h-80 overflow-auto">
                        <SelectItem
                            v-for="o in mineIUPOptions"
                            :key="String(o.value)"
                            :value="String(o.value)">
                            {{ o.label }}
                        </SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>

              <TableCell>
                <Input v-model="row.tgl_production" type="date" class="w-40" />
              </TableCell>

              <TableCell>
                <Select v-model="row.category">
                  <SelectTrigger class="w-32">
                    <SelectValue :placeholder="categoryLoading ? 'Loading...' : 'Category'" />
                  </SelectTrigger>
                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="categorySearch"
                        placeholder="Search category..."
                        class="h-8"
                        @input="onCategorySearch"
                        @keydown.stop
                        @click.stop
                      />
                    </div>
                    <SelectItem v-for="o in categoryOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.shift">
                  <SelectTrigger class="w-28">
                    <SelectValue placeholder="Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.id_prospect_area">
                  <SelectTrigger class="w-52">
                    <SelectValue :placeholder="row.prospectLoading ? 'Loading...' : 'Prospect Area'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="row.prospectSearch"
                        placeholder="Search prospect..."
                        class="h-8"
                        @input="onProspectSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem
                      v-for="o in row.prospectOptions"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.id_block">
                  <SelectTrigger class="w-44">
                    <SelectValue :placeholder="row.blockLoading ? 'Loading...' : 'Block'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="row.blockSearch"
                        placeholder="Search block..."
                        class="h-8"
                        @input="onBlockSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem
                      v-for="o in row.blockOptions"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Input v-model="row.from_rl" type="number" class="w-28" />
              </TableCell>

              <TableCell>
                <Input v-model="row.to_rl" type="number" class="w-28" />
              </TableCell>

             <TableCell>
                <Select
                  v-model="row.id_material"
                  @update:model-value="() => onMaterialChange(row)"
                >
                  <SelectTrigger class="w-28">
                    <SelectValue
                      :placeholder="row.materialLoading ? 'Loading...' : 'Material'"
                    />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="row.materialSearch"
                        placeholder="Search material..."
                        class="h-8"
                        @input="onMaterialSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem
                      v-for="o in row.materialOptions"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

            <TableCell>
                <Select v-model="row.ore_class" :disabled="!row.id_material">
                    <SelectTrigger class="w-28">
                    <SelectValue :placeholder="row.oreClassLoading ? 'Loading...' : 'Ore Class'" />
                    </SelectTrigger>

                    <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                        <Input
                        placeholder="Search ore class..."
                        class="h-8"
                        @input="(e: any) => onOreClassSearch(row, e.target.value)"
                        @keydown.stop
                        @click.stop
                        />
                    </div>

                    <SelectItem
                        v-for="o in row.oreClassOptions"
                        :key="o.value"
                        :value="o.value" >
                        {{ o.label }}
                    </SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

              <TableCell>
                <Input v-model="row.grade_expect" type="number" step="any" class="w-25" />
              </TableCell>

              <TableCell>
                <Select v-model="row.grade_control">
                  <SelectTrigger class="w-30">
                    <SelectValue
                      :placeholder="row.gradeControlLoading ? 'Loading...' : 'Grade Control'"
                    />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="row.gradeControlSearch"
                        placeholder="Search GC..."
                        class="h-8"
                        @input="onGradeControlSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem
                      v-for="o in row.gradeControlOptions"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

             <TableCell>
              <Select v-model="row.id_pile">
                <SelectTrigger class="w-35">
                  <SelectValue :placeholder="row.pileLoading ? 'Loading...' : 'Dome / Pile'" />
                </SelectTrigger>

                <SelectContent class="max-h-80 overflow-auto">
                  <div class="sticky top-0 z-10 bg-background p-2 border-b">
                    <Input
                      v-model="row.pileSearch"
                      placeholder="Search pile..."
                      class="h-8"
                      @input="onPileSearch(row)"
                      @keydown.stop
                      @click.stop
                    />
                  </div>

                  <SelectItem
                    v-for="o in row.pileOptions"
                    :key="o.value"
                    :value="o.value"
                  >
                    {{ o.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            
              <TableCell>
                <Input
                  v-model="row.batch_code"
                  placeholder="Batch"
                  class="w-20"
                />
              </TableCell>

              <TableCell>
                <Select
                    v-model="row.truck_factor"
                    :disabled="!row.id_material"
                    @update:model-value="() => onTruckFactorChange(row)">
                    <SelectTrigger class="w-28">
                    <SelectValue :placeholder="row.truckFactorLoading ? 'Loading...' : 'Truck Factor'" />
                    </SelectTrigger>

                    <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                        <Input
                        placeholder="Search truck factor..."
                        class="h-8"
                        @input="(e: any) => onTruckFactorSearch(row, e.target.value)"
                        @keydown.stop
                        @click.stop
                        />
                    </div>
                    <SelectItem
                        v-for="o in row.truckFactorOptions"
                        :key="o.value"
                        :value="o.value">
                        {{ o.label }}
                    </SelectItem>
                    </SelectContent>
                </Select>
                </TableCell>

              <TableCell>
                <Input
                  v-model="row.ritase"
                  type="number"
                  step="any"
                  class="w-28"
                  @input="recalculateTonnage(row)"
                />
              </TableCell>

              <TableCell>
                <Input v-model="row.tonnage" type="number" disabled class="w-32" />
              </TableCell>

              <TableCell>
                <Input v-model="row.unit_truck" placeholder="Unit" class="w-32" />
              </TableCell>

              <TableCell>
                <Input v-model="row.increment" type="number" class="w-20" />
              </TableCell>


                <TableCell>
                <Select v-model="row.batch_status">
                  <SelectTrigger class="w-28">
                    <SelectValue placeholder="Batch Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="InComplete">InComplete</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

                <TableCell>
                <Select v-model="row.status_dome">
                  <SelectTrigger class="w-28">
                    <SelectValue placeholder="Status Dome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Continue">Continue</SelectItem>
                    <SelectItem value="Close">Close</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Checkbox v-model:checked="row.direct" />
              </TableCell>

              <TableCell>
                <Input v-model="row.remarks" placeholder="Remarks" class="w-60" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <DialogFooter class="shrink-0 pt-2">
        <Button variant="secondary" @click="addRow">
          Add Row
        </Button>

        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>

        <Button :disabled="loading || !canSubmit" @click="submit">
          {{ loading ? "Saving..." : "Save data" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>