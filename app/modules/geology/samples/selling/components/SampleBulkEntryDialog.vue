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
  discharge_area: string
  product_code: string
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
  methodLoading: boolean

  productCodeOptions: LookupOption[]
  productCodeLoading: boolean
  productCodeSearch: string
  productCodePage: number
  productCodeHasMore: boolean
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
    discharge_area: "",
    product_code: "",
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
    methodLoading: false,

    productCodeOptions: [],
    productCodeLoading: false,
    productCodeSearch: "",
    productCodePage: 1,
    productCodeHasMore: true,
  }
}

const rows = ref<RowState[]>([
  emptyRow(),
  emptyRow(),
  emptyRow(),
])

function addRow() {
  rows.value.push(emptyRow())
}

function duplicateRow(index: number) {
  const current = rows.value[index]
  if (!current) return

  rows.value.splice(index + 1, 0, {
    ...current,
    methodOptions: [...current.methodOptions],
    productCodeOptions: [...current.productCodeOptions],
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
const sampleTypeOptions = ref<LookupOption[]>([])
const materialOptions = ref<LookupOption[]>([])
const dischargeAreaOptions = ref<LookupOption[]>([])

const mineIUPLoading = ref(false)
const sampleTypeLoading = ref(false)
const materialLoading = ref(false)
const dischargeAreaLoading = ref(false)

const mineIUPSearch = ref("")
const sampleTypeSearch = ref("")
const materialSearch = ref("")
const dischargeAreaSearch = ref("")

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

async function fetchSampleTypes(q = "") {
  sampleTypeLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/sample-type/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 50,
        category: "selling",
        value_key: "id",
        label_key: "type_sample",
      },
    })

    sampleTypeOptions.value = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["type_sample", "name"])
    )
  } finally {
    sampleTypeLoading.value = false
  }
}

async function fetchMaterials(q = "") {
  materialLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/material/", {
      method: "GET",
      query: {
        q,
        page: 1,
        page_size: 50,
        value_key: "id",
        label_key: "name",
      },
    })

    materialOptions.value = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["id"], ["name", "material"])
    )
  } finally {
    materialLoading.value = false
  }
}

// async function fetchDischargeAreas(q = "") {
//   dischargeAreaLoading.value = true
//   try {
//     const res: any = await request("/api/master/lookups/selling-discharge/", {
//       method: "GET",
//       query: {
//         q,
//         page: 1,
//         page_size: 50,
//         value_key: "id",
//         label_key: "factory_stock",
//       },
//     })

//     dischargeAreaOptions.value = (res?.results ?? []).map((item: any) =>
//       toLookupOption(item, ["id"], ["factory_stock", "name"])
//     )
//   } finally {
//     dischargeAreaLoading.value = false
//   }
// }
async function fetchDischargeAreas(q = "") {
  dischargeAreaLoading.value = true
  try {
    const query: any = {
      page: 1,
      page_size: 50,
      value_key: "id",
      label_key: "factory_stock",
    }

    if (q.trim()) query.q = q.trim()
    if (props.fixedIup) query.iup_id = props.fixedIup

    const res: any = await request("/api/master/lookups/selling-discharge/", {
      method: "GET",
      query,
    })

    dischargeAreaOptions.value = (res?.results ?? []).map((item: any) =>
      toLookupOption(item, ["value", "id"], ["label", "factory_stock", "name"])
    )
  } finally {
    dischargeAreaLoading.value = false
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


async function fetchProductCodesForRow(row: RowState, q = "", page = 1) {
  if (row.productCodeLoading) return

  row.productCodeLoading = true

  try {
    const query: any = {
      page,
      page_size: 10,
      value_key: "id",
      label_key: "code",
    }

    const cleanQ = String(q ?? "").trim()
    const iupId = row.iup ?? props.fixedIup

    if (cleanQ) query.q = cleanQ
    if (iupId) query.iup_id = iupId
    console.log("query selling-code:", query)
    const res: any = await request("/api/master/lookups/selling-code/", {
      method: "GET",
      query,
    })

    const items: LookupOption[] = (res?.results ?? []).map((item: any) => ({
      value: String(item.value),
      label: String(item.label),
    }))

    if (page === 1) {
      row.productCodeOptions = items
    } else {
      const merged = [...row.productCodeOptions, ...items]
      const seen = new Set<string>()

      row.productCodeOptions = merged.filter(item => {
        if (!item.value) return false
        if (seen.has(item.value)) return false
        seen.add(item.value)
        return true
      })
    }

    const count = Number(res?.count ?? 0)
    row.productCodePage = page
    row.productCodeHasMore = row.productCodeOptions.length < count
  } finally {
    row.productCodeLoading = false
  }
}

async function onSampleTypeChange(row: RowState) {
  row.id_method = ""
  row.methodOptions = []
  await fetchSampleMethodsForRow(row)
}

// async function onDischargeAreaChange(row: RowState) {
//   // row.product_code = ""
//   // row.productCodeOptions = []
//   // await fetchProductCodes(row)
// }

async function onDischargeAreaChange(row: RowState) {
  row.product_code = ""
  row.productCodeOptions = []
  row.productCodeSearch = ""
  row.productCodePage = 1
  row.productCodeHasMore = true

  if (!row.iup && props.fixedIup) {
    row.iup = props.fixedIup
  }

  await fetchProductCodesForRow(row, "", 1)
}

async function onIupChange(row: RowState) {
  row.discharge_area = ""
  row.product_code = ""
  row.productCodeOptions = []
  row.productCodeSearch = ""
  row.productCodePage = 1
  row.productCodeHasMore = true
}

const onMineIUPSearch = useDebounceFn(() => fetchMineIUP(mineIUPSearch.value), 300)
const onSampleTypeSearch = useDebounceFn(() => fetchSampleTypes(sampleTypeSearch.value), 300)
const onMaterialSearch = useDebounceFn(() => fetchMaterials(materialSearch.value), 300)
const onDischargeAreaSearch = useDebounceFn(() => fetchDischargeAreas(dischargeAreaSearch.value), 300)

const onSampleMethodSearch = useDebounceFn((row: RowState, q: string) => { fetchSampleMethodsForRow(row, q) }, 300)

const onProductCodeSearch = useDebounceFn((row: RowState) => {
  row.productCodePage = 1
  row.productCodeHasMore = true

  console.log("search product:", row.productCodeSearch)

  fetchProductCodesForRow(row, row.productCodeSearch, 1)
}, 300)




watch(
  () => [props.open, props.fixedIup],
  async ([open]) => {
    if (!open) return

    rows.value.forEach(row => {
      if (!row.iup && props.fixedIup) {
        row.iup = props.fixedIup
      }
    })

    await Promise.all([
      fetchMineIUP(),
      fetchSampleTypes(),
      fetchMaterials(),
      fetchDischargeAreas(),
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
    row.discharge_area &&
    row.product_code &&
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
      row.discharge_area &&
      row.product_code &&
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
      discharge_area: toNumberOrNull(row.discharge_area),
      product_code: toNumberOrNull(row.product_code),
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
    <DialogContent class="sm:max-w-9xl max-w-[96vw] h-[80vh] overflow-hidden flex flex-col"
      @pointer-down-outside.prevent @interact-outside.prevent @escape-key-down.prevent>
      <DialogHeader class="shrink-0">
        <DialogTitle>Add Multiple Selling Samples</DialogTitle>
      </DialogHeader>

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
              <TableHead>Discharge</TableHead>
              <TableHead>Selling Code</TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Increment</TableHead>
              <TableHead>Sample Weight</TableHead>
              <TableHead>Sample Number</TableHead>
              <TableHead>Description</TableHead>
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
                <Select :model-value="row.iup != null ? String(row.iup) : ''" @update:model-value="v => {
                  row.iup = v ? Number(v) : null
                  onIupChange(row)
                }">
                  <SelectTrigger class="w-36">
                    <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'IUP'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input v-model="mineIUPSearch" placeholder="Search IUP..." class="h-8" @input="onMineIUPSearch"
                        @keydown.stop @click.stop />
                    </div>

                    <SelectItem v-for="o in mineIUPOptions" :key="String(o.value)" :value="String(o.value)">
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
                <Select v-model="row.id_type_sample" @update:model-value="() => onSampleTypeChange(row)">
                  <SelectTrigger class="w-44">
                    <SelectValue :placeholder="sampleTypeLoading ? 'Loading...' : 'Sample Type'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input v-model="sampleTypeSearch" placeholder="Search type..." class="h-8"
                        @input="onSampleTypeSearch" @keydown.stop @click.stop />
                    </div>

                    <SelectItem v-for="o in sampleTypeOptions" :key="o.value" :value="o.value">
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
                      <Input placeholder="Search method..." class="h-8"
                        @input="(e: any) => onSampleMethodSearch(row, e.target.value)" @keydown.stop @click.stop />
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
                    <SelectValue :placeholder="materialLoading ? 'Loading...' : 'Layer'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input v-model="materialSearch" placeholder="Search layer..." class="h-8"
                        @input="onMaterialSearch" @keydown.stop @click.stop />
                    </div>

                    <SelectItem v-for="o in materialOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.discharge_area" @update:model-value="() => onDischargeAreaChange(row)">
                  <SelectTrigger class="w-48">
                    <SelectValue :placeholder="dischargeAreaLoading ? 'Loading...' : 'Discharge'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <div class="sticky top-0 z-10 bg-background p-2 border-b">
                      <Input v-model="dischargeAreaSearch" placeholder="Search discharge..." class="h-8"
                        @input="onDischargeAreaSearch" @keydown.stop @click.stop />
                    </div>

                    <SelectItem v-for="o in dischargeAreaOptions" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                <Select v-model="row.product_code" @update:open="(open) => {
                  if (open && row.productCodeOptions.length === 0) {
                    fetchProductCodesForRow(row, row.productCodeSearch, 1)
                  }
                }">
                  <SelectTrigger class="w-48">
                    <SelectValue :placeholder="row.productCodeLoading ? 'Loading...' : 'Selling Code'" />
                  </SelectTrigger>

                  <SelectContent class="max-h-80 overflow-auto">
                    <SelectGroup>
                      <div class="sticky top-0 z-10 bg-background p-2 border-b">
                        <Input :model-value="row.productCodeSearch" placeholder="Search code..." class="h-8"
                          @update:model-value="(v) => {
                            row.productCodeSearch = String(v ?? '')
                            onProductCodeSearch(row)
                          }" @keydown.stop @keyup.stop @keypress.stop @click.stop @mousedown.stop />
                      </div>

                      <SelectItem v-for="o in row.productCodeOptions" :key="o.value" :value="o.value">
                        {{ o.label }}
                      </SelectItem>

                      <div v-if="row.productCodeLoading" class="p-2 text-sm text-muted-foreground">
                        Loading...
                      </div>

                      <div v-if="row.productCodeHasMore && !row.productCodeLoading" class="p-2" @mousedown.prevent>
                        <Button type="button" variant="ghost" size="sm" class="w-full"
                          @click.stop="fetchProductCodesForRow(row, row.productCodeSearch, row.productCodePage + 1)">
                          Load more
                        </Button>
                      </div>

                      <div v-if="!row.productCodeLoading && row.productCodeOptions.length === 0"
                        class="p-2 text-sm text-muted-foreground">
                        No results
                      </div>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                <Input v-model="row.sampling_deskripsi" placeholder="Description" class="w-52" />
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