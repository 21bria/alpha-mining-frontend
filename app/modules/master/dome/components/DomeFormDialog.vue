<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
type YesNo = "" | "Yes" | "No"

export type SourceMinesDomePayload = {
  id?: number
  iup?: number | null // optional untuk SITE_USER (server set)

  pile_id: string
  description?: string | null
  category?: string | null

  dumping?: number | null // ✅ FK dumping point

  compositing?: "Yes" | "No" | null
  direct_sale?: string | null

  plan_ni_min?: number | null
  plan_ni_max?: number | null

  status?: number | null
  latitude?: number | null
  longitude?: number | null
  geometry?: unknown | null
  extra_properties?: Record<string, any> | null
}

type FormState = {
  id?: number
  iup: number | null

  pile_id: string
  description: string

  category: "" | "Dome" | "General"
  dumping: number | null
  plan_ni_min: string
  plan_ni_max: string

  compositing: YesNo
  direct_sale: YesNo

  status: string
  latitude: string
  longitude: string
}

const CATEGORY_OPTIONS: Array<{ value: "Dome" | "General"; label: string }> = [
  { value: "Dome", label: "Dome" },
  { value: "General", label: "General" },
]

const YESNO_OPTIONS: Array<{ value: "Yes" | "No"; label: string }> = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
]

// ===== helpers =====
const toNumberOrNull = (v: string) => {
  const t = (v ?? "").trim()
  if (t === "") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function normalizeId(v: any): number | null {
  if (v == null) return null
  if (typeof v === "number") return v
  if (typeof v === "string" && v !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === "object") {
    const n = Number(v.value ?? v.id ?? null)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: SourceMinesDomePayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: SourceMinesDomePayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")

const title = computed(() => (props.mode === "create" ? "Add Dome" : "Edit Dome"))
const close = () => emit("update:open", false)

const local = ref<FormState>({
  iup: null,
  pile_id: "",
  description: "",

  category: "",
  dumping: null,
  plan_ni_min: "",
  plan_ni_max: "",
  
  compositing: "",
  direct_sale: "",

  status: "",
  latitude: "",
  longitude: "",
})

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

// ======================
// IUP LOOKUP
// ======================
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

// ======================
// DUMPING LOOKUP (FK SourceMinesDumping)
// ======================
const dumpingOptions = ref<Array<{ value: number; label: string }>>([])
const dumpingLoading = ref(false)
const dumpingSearch = ref("")
const dumpingPage = ref(1)
const dumpingHasMore = ref(true)
const dumpingContentRef = ref<HTMLElement | null>(null)

async function fetchDumpings(q = "", page = 1) {
  if (dumpingLoading.value) return
  dumpingLoading.value = true
  try {
    // const params: any = { search: q, page, page_size: 10 }
    const params: any = { search: q, page, page_size: 10, category: "Stockpile" }
    // SYSTEM/MGMT: filter by selected iup
    // if (canChooseIup.value && local.value.iup) params.iup_id = local.value.iup

    if (canChooseIup.value && local.value.iup) params.iup_id = local.value.iup

    
    // SITE_USER: jangan kirim iup_id, biar backend auto-filter by active iup user
    const res: any = await request("/api/master/lookups/mine-dumping/", { method: "GET", query: params })

    // const res: any = await request("/api/master/lookups/mine-dumping/", {
    //   method: "GET",
    //   query: params,
    // })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) dumpingOptions.value = items
    else dumpingOptions.value = [...dumpingOptions.value, ...items]

    dumpingPage.value = page
    dumpingHasMore.value = dumpingOptions.value.length < count

    // auto-select kalau cuma 1 dan belum pilih
    if (local.value.dumping == null && dumpingOptions.value.length === 1) {
      const [only] = dumpingOptions.value
      if (only) local.value.dumping = Number(only.value)
    }
  } finally {
    dumpingLoading.value = false
  }
}

const onDumpingSearch = useDebounceFn((q: string) => {
  dumpingPage.value = 1
  dumpingHasMore.value = true
  fetchDumpings(q, 1).then(() => {
    if (dumpingContentRef.value) dumpingContentRef.value.scrollTop = 0
  })
}, 300)

const selectedDumpingLabel = computed(() => {
  const v = local.value.dumping
  if (v == null) return null
  return dumpingOptions.value.find((x) => Number(x.value) === Number(v))?.label ?? null
})

function onDumpingScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && dumpingHasMore.value && !dumpingLoading.value) {
    fetchDumpings(dumpingSearch.value, dumpingPage.value + 1)
  }
}

// IUP berubah => reload dumping sesuai iup, validasi selected dumping
watch(
  () => local.value.iup,
  async () => {
    if (!props.open) return
    if (!canChooseIup.value) return

    dumpingSearch.value = ""
    dumpingOptions.value = []
    dumpingPage.value = 1
    dumpingHasMore.value = true

    await fetchDumpings("", 1)

    if (local.value.dumping != null) {
      const exists = dumpingOptions.value.some((x) => Number(x.value) === Number(local.value.dumping))
      if (!exists) local.value.dumping = null
    }
  }
)

// ======================
// SUBMIT
// ======================
const submit = () => {
  const payload: SourceMinesDomePayload = {
    id: local.value.id,
    pile_id: local.value.pile_id.trim(),
    description: local.value.description.trim() === "" ? null : local.value.description.trim(),

    category: local.value.category === "" ? null : local.value.category,
    dumping: local.value.dumping,

    compositing: local.value.compositing === "" ? null : local.value.compositing,
    direct_sale: local.value.direct_sale === "" ? null : local.value.direct_sale,

    plan_ni_min: toNumberOrNull(local.value.plan_ni_min),
    plan_ni_max: toNumberOrNull(local.value.plan_ni_max),
    latitude: toNumberOrNull(local.value.latitude),
    longitude: toNumberOrNull(local.value.longitude),
  }

  if (canChooseIup.value) payload.iup = local.value.iup

  emit("submit", payload)
}

// ======================
// INIT ON OPEN
// ======================
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const iupId = normalizeId((props.initial as any)?.iup ?? (props.initial as any)?.iup_id)
    const dumpingId = normalizeId((props.initial as any)?.dumping ?? (props.initial as any)?.id_dumping)

    local.value = {
      id: props.initial?.id,
      iup: iupId,

      pile_id: (props.initial as any)?.pile_id ?? "",
      description: (props.initial as any)?.description ?? "",

      category: ((props.initial as any)?.category ?? "") as any,
      dumping: dumpingId,

      compositing: ((props.initial as any)?.compositing ?? "") as any,
      direct_sale: ((props.initial as any)?.direct_sale ?? "") as any,

      plan_ni_min: (props.initial as any)?.plan_ni_min == null ? "" : String((props.initial as any).plan_ni_min),
      plan_ni_max: (props.initial as any)?.plan_ni_max == null ? "" : String((props.initial as any).plan_ni_max),

      status: (props.initial as any)?.status == null ? "" : String((props.initial as any).status),
      latitude: (props.initial as any)?.latitude == null ? "" : String((props.initial as any).latitude),
      longitude: (props.initial as any)?.longitude == null ? "" : String((props.initial as any).longitude),
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      if (iupId != null && !mineIUPOptions.value.some((x) => Number(x.value) === Number(iupId))) {
        const label =
          (props.initial as any)?.iup_label ??
          (props.initial as any)?.iup?.label ??
          (props.initial as any)?.iup_code ??
          `IUP #${iupId}`
        mineIUPOptions.value = [{ value: iupId, label }, ...mineIUPOptions.value]
      }
    }

    // load dumping list
    dumpingSearch.value = ""
    dumpingOptions.value = []
    dumpingPage.value = 1
    dumpingHasMore.value = true
    await fetchDumpings("", 1)

    // inject selected dumping if missing (edit safety)
    if (dumpingId != null && !dumpingOptions.value.some((x) => Number(x.value) === Number(dumpingId))) {
      const label =
        (props.initial as any)?.dumping_label ??
        (props.initial as any)?.dumping_point ??
        `Dumping #${dumpingId}`
      dumpingOptions.value = [{ value: dumpingId, label }, ...dumpingOptions.value]
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
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

          <p v-if="fieldError('iup')" class="text-sm text-destructive">{{ fieldError("iup") }}</p>
        </div>

        <!-- pile_id -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Pile / Dome ID</label>
          <Input v-model="local.pile_id" placeholder="e.g. DOM-01" :disabled="!canMutate" />
          <p v-if="fieldError('pile_id')" class="text-sm text-destructive">{{ fieldError("pile_id") }}</p>
        </div>

        <!-- dumping -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Dumping Point</label>

          <Select :model-value="local.dumping != null ? String(local.dumping) : ''"
            @update:model-value="(v) => (local.dumping = v ? Number(v) : null)"
            :disabled="dumpingLoading || !canMutate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="dumpingLoading ? 'Loading...' : 'Select Dumping Point'" />
            </SelectTrigger>

            <SelectContent ref="dumpingContentRef" class="max-h-80 overflow-auto" @scroll="onDumpingScroll">
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input v-model="dumpingSearch" placeholder="Search Dumping..." class="h-8"
                    @input="onDumpingSearch(dumpingSearch)" @keydown.stop @click.stop />
                </div>

                <div v-if="local.dumping != null && selectedDumpingLabel"
                  class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                  Selected: <span class="font-medium">{{ selectedDumpingLabel }}</span>
                </div>

                <SelectItem v-for="o in dumpingOptions" :key="String(o.value)" :value="String(o.value)">
                  {{ o.label }}
                </SelectItem>

                <div v-if="dumpingLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                <div v-if="!dumpingLoading && dumpingOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                  No results
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="fieldError('dumping')" class="text-sm text-destructive">{{ fieldError("dumping") }}</p>
        </div>

        <!-- category select -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Category</label>
          <Select :model-value="local.category" @update:model-value="(v) => (local.category = (v as any) || '')"
            :disabled="!canMutate">
            <SelectTrigger class="h-9">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="o in CATEGORY_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p v-if="fieldError('category')" class="text-sm text-destructive">{{ fieldError("category") }}</p>
        </div>


        <!-- direct sale yes/no -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Direct Sale</label>
          <Select :model-value="local.direct_sale" @update:model-value="(v) => (local.direct_sale = (v as any) || '')"
            :disabled="!canMutate">
            <SelectTrigger class="h-9">
              <SelectValue placeholder="Select (Yes/No)" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="o in YESNO_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p v-if="fieldError('direct_sale')" class="text-sm text-destructive">{{ fieldError("direct_sale") }}</p>
        </div>

        <!-- control ni -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Min (Ni%)</label>
            <Input v-model="local.plan_ni_min" inputmode="decimal" placeholder="0.00" :disabled="!canMutate" />
            <p v-if="fieldError('plan_ni_min')" class="text-sm text-destructive">{{ fieldError("plan_ni_min") }}</p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Max (Ni%)</label>
            <Input v-model="local.plan_ni_max" inputmode="decimal" placeholder="0.00" :disabled="!canMutate" />
            <p v-if="fieldError('plan_ni_max')" class="text-sm text-destructive">{{ fieldError("plan_ni_max") }}</p>
          </div>
        </div>

        <!-- description -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Optional..." :disabled="!canMutate" />
          <p v-if="fieldError('description')" class="text-sm text-destructive">{{ fieldError("description") }}</p>
        </div>

        <!-- lat lng -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Latitude</label>
            <Input v-model="local.latitude" inputmode="decimal" placeholder="-6.2" :disabled="!canMutate" />
            <p v-if="fieldError('latitude')" class="text-sm text-destructive">{{ fieldError("latitude") }}</p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Longitude</label>
            <Input v-model="local.longitude" inputmode="decimal" placeholder="106.8" :disabled="!canMutate" />
            <p v-if="fieldError('longitude')" class="text-sm text-destructive">{{ fieldError("longitude") }}</p>
          </div>
        </div>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">{{ fieldError("non_field_errors") }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">{{ fieldError("detail") }}</p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate"
          :disabled="loading || !local.pile_id.trim() || !local.dumping || !local.category ||  !local.direct_sale ||(requiresIup && !local.iup)"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>