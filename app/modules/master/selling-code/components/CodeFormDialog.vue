<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"
type CheckState = boolean | "indeterminate"

export type SellingCodePayload = {
  id?: number
  iup?: number | null
  code: string
  type: string
  description: string | null
  active: number | null

  truck_factors: number | null
  sublot_close: string | null
  group_close: number | null
  ritase_max: number | null

  // tonnage: number | null
  ni: number | null
  fe: number | null
  // al2o3: number | null
  // co: number | null
  mgo: number | null
  sio2: number | null
  // cao: number | null
  // mno: number | null
  // cr2o3: number | null
  // sm: number | null
  // mc: number | null

  user?: number | null
}

type SellingCodeState = {
  id?: number
  iup: number | null
  code: string
  type: string
  description: string
  active: boolean

  truck_factors: string
  sublot_close: string
  group_close: string
  ritase_max: string

  // tonnage: string
  ni: string
  fe: string
  // al2o3: string
  // co: string
  mgo: string
  sio2: string
  // cao: string
  // mno: string
  // cr2o3: string
  // sm: string
  // mc: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: SellingCodePayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: SellingCodePayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const local = ref<SellingCodeState>({
  iup: null,
  code: "",
  type: "",
  description: "",
  active: true,

  truck_factors: "",
  sublot_close: "",
  group_close: "",
  ritase_max: "",

  // tonnage: "",
  ni: "",
  fe: "",
  // al2o3: "",
  // co: "",
  mgo: "",
  sio2: "",
  // cao: "",
  // mno: "",
  // cr2o3: "",
  // sm: "",
  // mc: "",
})

const typeOptions = [
  { value: "LIS", label: "LIS" },
  { value: "SAS", label: "SAS" },
] as const

const lotOptions = [
  { value: "SL_07", label: "SL_07" },
  { value: "SL_06", label: "SL_06" },
  { value: "SL_05", label: "SL_05" },
  { value: "SL_04", label: "SL_04" },
  { value: "SL_03", label: "SL_03" },
  { value: "SL_02", label: "SL_02" },
  { value: "SL_01", label: "SL_01" },
] as const

const selectedLotLabel = computed(() => {
  const v = (local.value.sublot_close ?? "").trim()
  if (!v) return null
  return lotOptions.find((x) => x.value === v)?.label ?? v
})

const selectedTypeLabel = computed(() => {
  const v = (local.value.type ?? "").trim()
  if (!v) return null
  return typeOptions.find((x) => x.value === v)?.label ?? v
})

// ===== Mine IUP lookup =====
const mineIUPOptions = ref<Array<{ value: number; label: string }>>([])
const mineIUPLoading = ref(false)
const mineIUPSearch = ref("")
const mineIUPPage = ref(1)
const mineIUPHasMore = ref(true)
const mineIUPContentRef = ref<HTMLElement | null>(null)

function normalizeMineIUPId(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string" && v !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>
    const n = Number(obj.value ?? obj.id ?? null)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeStatusToBool(v: unknown): boolean {
  if (v === 1 || v === "1" || v === true) return true
  if (v === 0 || v === "0" || v === false) return false
  return true
}

function toInputString(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v)
}

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null
  }

  const s = String(v).trim()
  if (!s) return null

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function toNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}
async function fetchMineIUP(q = "", page = 1) {
  if (mineIUPLoading.value) return
  mineIUPLoading.value = true
  try {
    const res = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    }) as {
      count?: number
      results?: Array<{ value: number; label: string }>
    }

    const items = res?.results ?? []
    const count = Number(res?.count ?? 0)

    if (page === 1) {
      mineIUPOptions.value = items
    } else {
      mineIUPOptions.value = [...mineIUPOptions.value, ...items]
    }

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
    if (mineIUPContentRef.value) {
      mineIUPContentRef.value.scrollTop = 0
    }
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


function onActiveChange(v: CheckState) {
  local.value.active = v === true
}

const title = computed(() =>
  props.mode === "create" ? "Add Selling Code" : "Edit Selling Code"
)

const isSubmitDisabled = computed(() => {
  if (props.loading) return true
  if (!canMutate.value) return true
  if (!local.value.code.trim()) return true
  if (!local.value.type.trim()) return true
  if (canChooseIup.value && !local.value.iup) return true
  return false
})

const close = () => emit("update:open", false)
const submit = () => {
  const payload: SellingCodePayload = {
    id: local.value.id,
    code: String(local.value.code ?? "").trim(),
    type: String(local.value.type ?? "").trim(),
    description: toNullableString(local.value.description),
    active: local.value.active ? 1 : 0,

    truck_factors: toNullableNumber(local.value.truck_factors),
    sublot_close: toNullableString(local.value.sublot_close),
    group_close: toNullableNumber(local.value.group_close),
    ritase_max: toNullableNumber(local.value.ritase_max),

    // tonnage: toNullableNumber(local.value.tonnage),
    ni: toNullableNumber(local.value.ni),
    fe: toNullableNumber(local.value.fe),
    // al2o3: toNullableNumber(local.value.al2o3),
    // co: toNullableNumber(local.value.co),
    mgo: toNullableNumber(local.value.mgo),
    sio2: toNullableNumber(local.value.sio2),
    // cao: toNullableNumber(local.value.cao),
    // mno: toNullableNumber(local.value.mno),
    // cr2o3: toNullableNumber(local.value.cr2o3),
    // sm: toNullableNumber(local.value.sm),
    // mc: toNullableNumber(local.value.mc),
  }

  if (canChooseIup.value) {
    payload.iup = local.value.iup
  }

  emit("submit", payload)
}

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const initial = props.initial as Record<string, any> | null | undefined
    const iupId = normalizeMineIUPId(initial?.iup ?? initial?.iup_id)

    local.value = {
      id: initial?.id,
      iup: iupId,
      code: initial?.code ?? "",
      type: initial?.type ?? "",
      description: initial?.description ?? "",
      active: normalizeStatusToBool(initial?.active),

      truck_factors: toInputString(initial?.truck_factors),
      sublot_close: toInputString(initial?.sublot_close),
      group_close: toInputString(initial?.group_close),
      ritase_max: toInputString(initial?.ritase_max),

      // tonnage: toInputString(initial?.tonnage),
      ni: toInputString(initial?.ni),
      fe: toInputString(initial?.fe),
      // al2o3: toInputString(initial?.al2o3),
      // co: toInputString(initial?.co),
      mgo: toInputString(initial?.mgo),
      sio2: toInputString(initial?.sio2),
      // cao: toInputString(initial?.cao),
      // mno: toInputString(initial?.mno),
      // cr2o3: toInputString(initial?.cr2o3),
      // sm: toInputString(initial?.sm),
      // mc: toInputString(initial?.mc),
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      if (iupId != null && !mineIUPOptions.value.some((x) => Number(x.value) === iupId)) {
        const label =
          initial?.iup_label ??
          initial?.iup?.label ??
          initial?.iup_code ??
          `IUP #${iupId}`

        mineIUPOptions.value = [{ value: iupId, label }, ...mineIUPOptions.value]
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <!-- IUP (only SYSTEM/MANAGEMENT) -->
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

        <!-- main -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Code</label>
            <Input v-model="local.code" placeholder="e.g. SC-001" :disabled="!canMutate" />
            <p v-if="fieldError('code')" class="text-sm text-destructive">
              {{ fieldError("code") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Type</label>
            <Select :model-value="local.type" @update:model-value="(v) => (local.type = String(v ?? ''))"
              :disabled="!canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="'Select Type'">
                  {{ selectedTypeLabel ?? 'Select Type' }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent class="max-h-60 overflow-auto">
                <SelectGroup>
                  <SelectItem v-for="o in typeOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('type')" class="text-sm text-destructive">
              {{ fieldError("type") }}
            </p>
          </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Optional..." :disabled="!canMutate" />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError("description") }}
          </p>
        </div>

        <!-- operational -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Truck Factors</label>
            <Input v-model="local.truck_factors" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('truck_factors')" class="text-sm text-destructive">
              {{ fieldError("truck_factors") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">SubLot Close</label>
            <Select :model-value="local.sublot_close"
              @update:model-value="(v) => (local.sublot_close = String(v ?? ''))" :disabled="!canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="'Select Sub Lot'">
                  {{ selectedLotLabel ?? 'Select Sub Lot' }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent class="max-h-60 overflow-auto">
                <SelectGroup>
                  <SelectItem v-for="o in lotOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="fieldError('sublot_close')" class="text-sm text-destructive">
              {{ fieldError("sublot_close") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Group Close</label>
            <Input v-model="local.group_close" type="number" step="1" :disabled="!canMutate" />
            <p v-if="fieldError('group_close')" class="text-sm text-destructive">
              {{ fieldError("group_close") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Ritase Max</label>
            <Input v-model="local.ritase_max" type="number" step="1" :disabled="!canMutate" />
            <p v-if="fieldError('ritase_max')" class="text-sm text-destructive">
              {{ fieldError("ritase_max") }}
            </p>
          </div>
        </div>

        <!-- assay -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <!-- <div class="grid gap-2">
            <label class="text-sm font-medium">Tonnage</label>
            <Input v-model="local.tonnage" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('tonnage')" class="text-sm text-destructive">
              {{ fieldError("tonnage") }}
            </p>
          </div> -->

          <div class="grid gap-2">
            <label class="text-sm font-medium">Ni</label>
            <Input v-model="local.ni" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('ni')" class="text-sm text-destructive">
              {{ fieldError("ni") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Fe</label>
            <Input v-model="local.fe" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('fe')" class="text-sm text-destructive">
              {{ fieldError("fe") }}
            </p>
          </div>

          <!-- <div class="grid gap-2">
            <label class="text-sm font-medium">Al2O3</label>
            <Input v-model="local.al2o3" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('al2o3')" class="text-sm text-destructive">
              {{ fieldError("al2o3") }}
            </p>
          </div> -->

          <!-- <div class="grid gap-2">
            <label class="text-sm font-medium">Co</label>
            <Input v-model="local.co" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('co')" class="text-sm text-destructive">
              {{ fieldError("co") }}
            </p>
          </div> -->

          <div class="grid gap-2">
            <label class="text-sm font-medium">MgO</label>
            <Input v-model="local.mgo" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('mgo')" class="text-sm text-destructive">
              {{ fieldError("mgo") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">SiO2</label>
            <Input v-model="local.sio2" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('sio2')" class="text-sm text-destructive">
              {{ fieldError("sio2") }}
            </p>
          </div>

          <!-- <div class="grid gap-2">
            <label class="text-sm font-medium">CaO</label>
            <Input v-model="local.cao" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('cao')" class="text-sm text-destructive">
              {{ fieldError("cao") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">MnO</label>
            <Input v-model="local.mno" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('mno')" class="text-sm text-destructive">
              {{ fieldError("mno") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Cr2O3</label>
            <Input v-model="local.cr2o3" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('cr2o3')" class="text-sm text-destructive">
              {{ fieldError("cr2o3") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">SM</label>
            <Input v-model="local.sm" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('sm')" class="text-sm text-destructive">
              {{ fieldError("sm") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">MC</label>
            <Input v-model="local.mc" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('mc')" class="text-sm text-destructive">
              {{ fieldError("mc") }}
            </p>
          </div> -->
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="local.active" @update:model-value="onActiveChange" :disabled="!canMutate" />
            Active
          </label>
        </div>

        <p v-if="!canChooseIup && fieldError('iup')" class="text-sm text-destructive">
          {{ fieldError("iup") }}
        </p>
        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>

        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate" :disabled="isSubmitDisabled" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>