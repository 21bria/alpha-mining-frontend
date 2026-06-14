<script setup lang="ts">
import { ref, computed, watch } from "vue"
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

type RowState = {
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

  methodOptions: LookupOption[]
  pointOptions: LookupOption[]
  methodLoading: boolean
  pointLoading: boolean

  sampleTypeOptions: LookupOption[]
  sampleTypeLoading: boolean
  sampleTypeSearch: string

  materialOptions: LookupOption[]
  materialLoading: boolean
  materialSearch: string

  samplingAreaOptions: LookupOption[]
  samplingAreaLoading: boolean
  samplingAreaSearch: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  role: UserRole
  fixedIup?: number | null
  fixedIupLabel?: string | null
  errors?: string[]
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "submit", payload: any[]): void
}>()

const { request } = useApi()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyRow(): RowState {
  return {
    iup: props.fixedIup ?? null,
    tgl_sample: today(),
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
    methodOptions: [],
    pointOptions: [],
    methodLoading: false,
    pointLoading: false,

    sampleTypeOptions: [],
    sampleTypeLoading: false,
    sampleTypeSearch: "",

    materialOptions: [],
    materialLoading: false,
    materialSearch: "",

    samplingAreaOptions: [],
    samplingAreaLoading: false,
    samplingAreaSearch: "",
  }
}

const rows = ref<RowState[]>([
  emptyRow(),
  emptyRow(),
  emptyRow(),
])


function addRow() {
  const row = emptyRow()
  rows.value.push(row)

  fetchSampleTypes(row)
  fetchMaterials(row)
  fetchSamplingAreas(row)
}


function duplicateRow(index: number) {
  const current = rows.value[index]
  if (!current) return

  rows.value.splice(index + 1, 0, {
    ...current,

    sampleTypeOptions: [...current.sampleTypeOptions],
    materialOptions: [...current.materialOptions],
    samplingAreaOptions: [...current.samplingAreaOptions],

    methodOptions: [...current.methodOptions],
    pointOptions: [...current.pointOptions],
  })
}

function removeRow(index: number) {
  if (rows.value.length === 1) return
  rows.value.splice(index, 1)
}

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

/* GLOBAL OPTIONS */
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

async function fetchSampleTypes(row: RowState, q = "") {
  row.sampleTypeLoading = true
  try {
    const res: any = await request("/api/master/lookups/sample-type/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        category: ["geology", "production"],
        value_key: "id",
        label_key: "type_sample",
      },
    })

    row.sampleTypeOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["type_sample", "name"])
    )
  } finally {
    row.sampleTypeLoading = false
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

async function fetchSamplingAreas(row: RowState, q = "") {
  row.samplingAreaLoading = true
  try {
    const res: any = await request("/api/master/lookups/mine-dumping/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 20,
        value_key: "id",
        label_key: "dumping_point",
      },
    })

    row.samplingAreaOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["dumping_point", "name"])
    )
  } finally {
    row.samplingAreaLoading = false
  }
}

/* PER ROW OPTIONS */
async function fetchSampleMethodsForRow(row: RowState, q = "") {
  if (!row.id_type_sample) {
    row.methodOptions = []
    return
  }

  row.methodLoading = true

  try {
    const res: any = await request("/api/master/lookups/sample-method/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 50,
        sample_type_id: row.id_type_sample,
        value_key: "id",
        label_key: "sample_method",
      },
    })

    row.methodOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["sample_method", "name"])
    )
  } finally {
    row.methodLoading = false
  }
}

async function fetchSamplingPointsForRow(row: RowState, q = "") {
  if (!row.sampling_area) {
    row.pointOptions = []
    return
  }

  row.pointLoading = true

  try {
    const res: any = await request("/api/master/lookups/mine-dome/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 50,
        value_key: "id",
        label_key: "pile_id",
        ...(row.iup ? { iup_id: row.iup } : {}),
        ...(row.sampling_area ? { dumping_id: row.sampling_area } : {}),
      },
    })

    row.pointOptions = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["pile_id", "name"])
    )
  } finally {
    row.pointLoading = false
  }
}

async function onSampleTypeChange(row: RowState) {
  row.id_method = ""
  row.methodOptions = []

  await fetchSampleMethodsForRow(row)
}

async function onSamplingAreaChange(row: RowState) {
  row.sampling_point = ""
  row.pointOptions = []

  await fetchSamplingPointsForRow(row)
}

async function onIupChange(row: RowState) {
  row.sampling_area = ""
  row.sampling_point = ""
  row.pointOptions = []
}

const onMineIUPSearch = useDebounceFn(() => fetchMineIUP(mineIUPSearch.value), 300)

const onSampleTypeSearch = useDebounceFn((row: RowState) => {
  fetchSampleTypes(row, row.sampleTypeSearch)
}, 300)

const onMaterialSearch = useDebounceFn((row: RowState) => {
  fetchMaterials(row, row.materialSearch)
}, 300)

const onSamplingAreaSearch = useDebounceFn((row: RowState) => {
  fetchSamplingAreas(row, row.samplingAreaSearch)
}, 300)

const onSampleMethodSearch = useDebounceFn((row: RowState, q: string) => {
  fetchSampleMethodsForRow(row, q)
}, 300)

const onSamplingPointSearch = useDebounceFn((row: RowState, q: string) => {
  fetchSamplingPointsForRow(row, q)
}, 300)

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    await Promise.all([
      fetchMineIUP(),
      ...rows.value.flatMap(row => [
          fetchSampleTypes(row),
          fetchMaterials(row),
          fetchSamplingAreas(row)
        ]),
    ])
  },
  { immediate: true }
)

const canSubmit = computed(() => {
  return rows.value.some(row =>
    (!requiresIup.value || row.iup) &&
    row.tgl_sample &&
    row.shift &&
    row.id_type_sample &&
    row.id_method &&
    row.id_material &&
    row.sampling_area &&
    row.sampling_point &&
    row.batch_code &&
    row.sample_number
  )
})

function submit() {
  const payload = rows.value
    .filter(row =>
      (!requiresIup.value || row.iup) &&
      row.tgl_sample &&
      row.shift &&
      row.id_type_sample &&
      row.id_method &&
      row.id_material &&
      row.sampling_area &&
      row.sampling_point &&
      row.batch_code &&
      row.sample_number
    )
    .map(row => ({
      iup: row.iup,
      tgl_sample: row.tgl_sample,
      shift: row.shift || null,
      id_type_sample: toNumberOrNull(row.id_type_sample),
      id_method: toNumberOrNull(row.id_method),
      id_material: toNumberOrNull(row.id_material),
      sampling_area: toNumberOrNull(row.sampling_area),
      sampling_point: toNumberOrNull(row.sampling_point),
      sampling_deskripsi: row.sampling_deskripsi.trim() || null,
      batch_code: row.batch_code.trim() || null,
      increments: toNumberOrNull(row.increments),
      sample_weight: toNumberOrNull(row.sample_weight),
      sample_number: row.sample_number.trim() || null,
      primer_raw: toNumberOrNull(row.primer_raw),
      duplicate_raw: toNumberOrNull(row.duplicate_raw),
      remark: row.remark.trim() || null,
      type: row.type.trim() || null,
    }))

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
      <DialogHeader class="shrink-0">
        <DialogTitle>Add Multiple Samples</DialogTitle>
      </DialogHeader>
      <div
        v-if="props.errors?.length"
        class="shrink-0 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        <div class="mb-1 font-semibold">
          Validation error
        </div>

        <ul class="list-disc space-y-1 pl-5">
          <li v-for="(err, i) in props.errors" :key="i">
            {{ err }}
          </li>
        </ul>
      </div>
      <div class="flex-1 min-h-0 overflow-auto scroll-thin border rounded-lg">
        <Table>
          <TableHeader class="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead class="w-[90px]">Action</TableHead>
              <TableHead v-if="canChooseIup">IUP</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Sample Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Layer</TableHead>
              <TableHead>Sampling Area</TableHead>
              <TableHead>Sampling Point</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Increment</TableHead>
              <TableHead>Sample Weight</TableHead>
              <TableHead>Sample Number</TableHead>
              <TableHead>Primer Raw</TableHead>
              <TableHead>Duplicate Raw</TableHead>
              <TableHead>Remark</TableHead>
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
                  @update:model-value="v => {
                    row.iup = v ? Number(v) : null
                    onIupChange(row)
                  }"
                >
                  <SelectTrigger class="w-36">
                    <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'IUP'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="mineIUPSearch"
                        placeholder="Search IUP..."
                        class="h-8"
                        @input="onMineIUPSearch"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem
                      v-for="o in mineIUPOptions"
                      :key="String(o.value)"
                      :value="String(o.value)"
                    >
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Input v-model="row.tgl_sample" type="date" class="w-40" />
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
                <Select
                  v-model="row.id_type_sample"
                  @update:model-value="() => onSampleTypeChange(row)">
                  <SelectTrigger class="w-44">
                    <SelectValue :placeholder="row.sampleTypeLoading ? 'Loading...' : 'Sample Type'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="row.sampleTypeSearch"
                        placeholder="Search type..."
                        class="h-8"
                        @input="onSampleTypeSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem v-for="o in row.sampleTypeOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.id_method" :disabled="!row.id_type_sample">
                  <SelectTrigger class="w-44">
                    <SelectValue :placeholder="row.methodLoading ? 'Loading...' : 'Method'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        placeholder="Search method..."
                        class="h-8"
                        @input="(e: any) => onSampleMethodSearch(row, e.target.value)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem v-for="o in row.methodOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.id_material">
                  <SelectTrigger class="w-44">
                    <SelectValue :placeholder="row.materialLoading ? 'Loading...' : 'Layer'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        v-model="row.materialSearch"
                        placeholder="Search layer..."
                        class="h-8"
                        @input="onMaterialSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                   <SelectItem v-for="o in row.materialOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select
                  v-model="row.sampling_area"
                  @update:model-value="() => onSamplingAreaChange(row)">
                  <SelectTrigger class="w-48">
                    <SelectValue :placeholder="row.samplingAreaLoading ? 'Loading...' : 'Sampling Area'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                     <Input
                        v-model="row.samplingAreaSearch"
                        placeholder="Search area..."
                        class="h-8"
                        @input="onSamplingAreaSearch(row)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem v-for="o in row.samplingAreaOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.sampling_point" :disabled="!row.sampling_area">
                  <SelectTrigger class="w-48">
                    <SelectValue :placeholder="row.pointLoading ? 'Loading...' : 'Sampling Point'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input
                        placeholder="Search point..."
                        class="h-8"
                        @input="(e: any) => onSamplingPointSearch(row, e.target.value)"
                        @keydown.stop
                        @click.stop
                      />
                    </div>

                    <SelectItem v-for="o in row.pointOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Input v-model="row.sampling_deskripsi" placeholder="Description" class="w-52" />
              </TableCell>

              <TableCell>
                <Input v-model="row.batch_code" placeholder="Batch Code" class="w-40" />
              </TableCell>

              <TableCell>
                <Input v-model="row.increments" type="number" placeholder="0" class="w-28" />
              </TableCell>

              <TableCell>
                <Input v-model="row.sample_weight" type="number" step="any" placeholder="0.0" class="w-36" />
              </TableCell>

              <TableCell>
                <Input v-model="row.sample_number" placeholder="Sample Number" class="w-44" />
              </TableCell>

              <TableCell>
                <Input v-model="row.primer_raw" type="number" step="any" placeholder="0.0" class="w-32" />
              </TableCell>

              <TableCell>
                <Input v-model="row.duplicate_raw" type="number" step="any" placeholder="0.0" class="w-36" />
              </TableCell>

              <TableCell>
                <Input v-model="row.remark" placeholder="Remark" class="w-60" />
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

        <Button :disabled="loading || !canSubmit || !canMutate" @click="submit">
          {{ loading ? "Saving..." : "Save data" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>