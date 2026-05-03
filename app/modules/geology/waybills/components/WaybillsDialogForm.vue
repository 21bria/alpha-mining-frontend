<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useApi } from "@/composables/useApi"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type MineIupOption = {
  value: number
  label: string
}

export type WaybillPayload = {
  id?: number | string
  iup?: number | null
  tgl_deliver: string | null
  delivery_time: string | null
  waybill_number: string | null
  qty: number | null
  sample_id: string | null
  sample_status: string | null
  mral_order: string | null
  roa_order: string | null
  remarks: string | null
  delivery: string | null
}

type FormState = {
  id?: number | string
  iup: number | null
  tgl_deliver: string
  delivery_time: string
  waybill_number: string
  qty: string
  sample_id: string
  sample_status: string
  mral_order: boolean
  roa_order: boolean
  remarks: string
  delivery: string
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
  (e: "submit", payload: WaybillPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const title = computed(() => (props.mode === "create" ? "Add Waybill" : "Edit Waybill"))

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

function normalizeTimeInput(value: any): string {
  const v = String(value ?? "").trim()
  if (!v) return ""
  if (/^\d{2}:\d{2}$/.test(v)) return v
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5)

  const dt = new Date(`1970-01-01T${v}`)
  if (!Number.isNaN(dt.getTime())) {
    const hh = String(dt.getHours()).padStart(2, "0")
    const mm = String(dt.getMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  }
  return ""
}

function yesNoToBool(value: any): boolean {
  return String(value ?? "").trim().toUpperCase() === "YES"
}

const local = ref<FormState>({
  id: undefined,
  iup: null,
  tgl_deliver: "",
  delivery_time: "",
  waybill_number: "",
  qty: "",
  sample_id: "",
  sample_status: "",
  mral_order: false,
  roa_order: false,
  remarks: "",
  delivery: "",
})

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



function submit() {
  const payload: WaybillPayload = {
    id: local.value.id,
    iup: local.value.iup,
    tgl_deliver: local.value.tgl_deliver || null,
    delivery_time: local.value.delivery_time || null,
    waybill_number: local.value.waybill_number.trim() || null,
    qty: toNumberOrNull(local.value.qty),
    sample_id: local.value.sample_id.trim() || null,
    sample_status: local.value.sample_status || null,
    mral_order: local.value.mral_order ? "YES" : "NO",
    roa_order: local.value.roa_order ? "YES" : "NO",
    remarks: local.value.remarks.trim() || null,
    delivery: local.value.delivery.trim() || null,
  }

  emit("submit", payload)
}

function normalizeMineIUPId(v: any): number | null {
  if (v == null) return null
  if (typeof v === "number") return v
  if (typeof v === "string" && v !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === "object") {
    const n = Number(v?.value ?? v?.id ?? v?.iup_id ?? null)
    return Number.isFinite(n) ? n : null
  }
  return null
}

watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const initialIupId = normalizeMineIUPId(
      props.fixedIup ?? props.initial?.iup ?? props.initial?.iup_id
    )

    local.value = {
      id: props.initial?.id,
      iup: initialIupId,
      tgl_deliver: normalizeDateInput(props.initial?.tgl_deliver),
      delivery_time: normalizeTimeInput(props.initial?.delivery_time),
      waybill_number: String(props.initial?.waybill_number ?? ""),
      qty: props.initial?.qty == null ? "" : String(props.initial.qty),
      sample_id: String(props.initial?.sample_id ?? ""),
      sample_status: String(props.initial?.sample_status ?? ""),
      mral_order: yesNoToBool(props.initial?.mral_order),
      roa_order: yesNoToBool(props.initial?.roa_order),
      remarks: String(props.initial?.remarks ?? ""),
      delivery: String(props.initial?.delivery ?? ""),
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPOptions.value = []
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      if (
        initialIupId != null &&
        !mineIUPOptions.value.some((x) => Number(x.value) === Number(initialIupId))
      ) {
        const label =
          props.fixedIupLabel ||
          props.initial?.iup_label ||
          props.initial?.iup_code ||
          props.initial?.iup_name ||
          `IUP #${initialIupId}`

        mineIUPOptions.value = [
          { value: Number(initialIupId), label: String(label) },
          ...mineIUPOptions.value,
        ]
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
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
            <p v-if="fieldError('iup')" class="text-sm text-destructive">
              {{ fieldError("iup") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Delivery Date</label>
            <Input v-model="local.tgl_deliver" type="date" :disabled="!canMutate" />
            <p v-if="fieldError('tgl_deliver')" class="text-sm text-destructive">
              {{ fieldError("tgl_deliver") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Delivery Time</label>
            <Input v-model="local.delivery_time" type="time" :disabled="!canMutate" />
            <p v-if="fieldError('delivery_time')" class="text-sm text-destructive">
              {{ fieldError("delivery_time") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Waybill Number</label>
            <Input v-model="local.waybill_number" placeholder="Waybill Number" :disabled="!canMutate" />
            <p v-if="fieldError('waybill_number')" class="text-sm text-destructive">
              {{ fieldError("waybill_number") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Qty</label>
            <Input v-model="local.qty" type="number" step="1" placeholder="0" :disabled="!canMutate" />
            <p v-if="fieldError('qty')" class="text-sm text-destructive">
              {{ fieldError("qty") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Sample ID</label>
            <Input v-model="local.sample_id" placeholder="Sample ID" :disabled="!canMutate" />
            <p v-if="fieldError('sample_id')" class="text-sm text-destructive">
              {{ fieldError("sample_id") }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex items-center gap-3 rounded-md border p-3">
            <input v-model="local.mral_order" type="checkbox" class="h-4 w-4" :disabled="!canMutate" />
            <div class="flex flex-col">
              <label class="text-sm font-medium">MRAL Order</label>
              <span class="text-sm text-muted-foreground">
                {{ local.mral_order ? "YES" : "NO" }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 rounded-md border p-3">
            <input v-model="local.roa_order" type="checkbox" class="h-4 w-4" :disabled="!canMutate" />
            <div class="flex flex-col">
              <label class="text-sm font-medium">ROA Order</label>
              <span class="text-sm text-muted-foreground">
                {{ local.roa_order ? "YES" : "NO" }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Remarks</label>
          <Textarea v-model="local.remarks" placeholder="Enter remarks" :disabled="!canMutate" />
          <p v-if="fieldError('remarks')" class="text-sm text-destructive">
            {{ fieldError("remarks") }}
          </p>
        </div>

        <p v-if="fieldError('mral_order')" class="text-sm text-destructive">
          {{ fieldError("mral_order") }}
        </p>
        <p v-if="fieldError('roa_order')" class="text-sm text-destructive">
          {{ fieldError("roa_order") }}
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
        <Button v-if="canMutate" :disabled="loading ||
          !local.tgl_deliver ||
          !local.delivery_time ||
          !local.waybill_number.trim() ||
          !local.qty ||
          !local.sample_id.trim() ||
          (requiresIup && !local.iup)
          " @click="submit">
          {{ loading ? "Saving..." : "Submit" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>