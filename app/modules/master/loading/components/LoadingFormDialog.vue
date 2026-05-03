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

export type SourceMinesLoadingPayload = {
  id?: number
  iup?: number | null
  loading_point: string
  description?: string | null
  category?: string | null
  source?: number | null
  status?: number | null
  latitude?: number | null
  longitude?: number | null
  geometry?: unknown | null
  extra_properties?: Record<string, any> | null
}

type FormState = {
  id?: number
  iup: number | null
  loading_point: string
  description: string
  category: string
  source: number | null
  status: string
  latitude: string
  longitude: string
}

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
  initial?: SourceMinesLoadingPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: SourceMinesLoadingPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")

const title = computed(() => (props.mode === "create" ? "Add Loading Point" : "Edit Loading Point"))
const close = () => emit("update:open", false)

const local = ref<FormState>({
  iup: null,
  loading_point: "",
  description: "",
  category: "",
  source: null,
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
// SOURCE LOOKUP
// ======================
const sourceOptions = ref<Array<{ value: number; label: string }>>([])
const sourceLoading = ref(false)
const sourceSearch = ref("")
const sourcePage = ref(1)
const sourceHasMore = ref(true)
const sourceContentRef = ref<HTMLElement | null>(null)

async function fetchSources(q = "", page = 1) {
  if (sourceLoading.value) return
  sourceLoading.value = true
  try {
    const params: any = { search: q, page, page_size: 10 }

    // SYSTEM/MGMT filter by selected IUP
    // SITE_USER: jangan kirim iup_id, biar backend auto-filter by active iup user
    if (canChooseIup.value && local.value.iup) params.iup_id = local.value.iup

    const res: any = await request("/api/master/lookups/mine-source/", {
      method: "GET",
      query: params,
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) sourceOptions.value = items
    else sourceOptions.value = [...sourceOptions.value, ...items]

    sourcePage.value = page
    sourceHasMore.value = sourceOptions.value.length < count

    // auto-select kalau cuma 1 dan belum pilih
    if (local.value.source == null && sourceOptions.value.length === 1) {
      const [only] = sourceOptions.value
      if (only) local.value.source = Number(only.value)
    }
  } finally {
    sourceLoading.value = false
  }
}

const onSourceSearch = useDebounceFn((q: string) => {
  sourcePage.value = 1
  sourceHasMore.value = true
  fetchSources(q, 1).then(() => {
    if (sourceContentRef.value) sourceContentRef.value.scrollTop = 0
  })
}, 300)

const selectedSourceLabel = computed(() => {
  const v = local.value.source
  if (v == null) return null
  return sourceOptions.value.find((x) => Number(x.value) === Number(v))?.label ?? null
})

function onSourceScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && sourceHasMore.value && !sourceLoading.value) {
    fetchSources(sourceSearch.value, sourcePage.value + 1)
  }
}

// ✅ IUP berubah => reload source sesuai iup, validasi selected source
watch(
  () => local.value.iup,
  async () => {
    if (!props.open) return
    if (!canChooseIup.value) return // SITE_USER iup tidak dipilih di UI

    // reset list & search
    sourceSearch.value = ""
    sourceOptions.value = []
    sourcePage.value = 1
    sourceHasMore.value = true

    // fetch based on new iup
    await fetchSources("", 1)

    // kalau source yang sedang dipilih tidak ada di list baru -> reset
    if (local.value.source != null) {
      const exists = sourceOptions.value.some((x) => Number(x.value) === Number(local.value.source))
      if (!exists) local.value.source = null
    }

    // fetchSources sudah auto-select jika hanya 1
  }
)

// ======================
// SUBMIT
// ======================
const submit = () => {
  const payload: SourceMinesLoadingPayload = {
    id: local.value.id,
    loading_point: local.value.loading_point.trim(),
    description: local.value.description.trim() === "" ? null : local.value.description.trim(),
    category: local.value.category.trim() === "" ? null : local.value.category.trim(),
    source: local.value.source,
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
    const sourceId = normalizeId((props.initial as any)?.source ?? (props.initial as any)?.id_sources)

    local.value = {
      id: props.initial?.id,
      iup: iupId,
      loading_point: (props.initial as any)?.loading_point ?? "",
      description: (props.initial as any)?.description ?? "",
      category: (props.initial as any)?.category ?? "",
      source: sourceId,
      status: (props.initial as any)?.status == null ? "" : String((props.initial as any).status),
      latitude: (props.initial as any)?.latitude == null ? "" : String((props.initial as any).latitude),
      longitude: (props.initial as any)?.longitude == null ? "" : String((props.initial as any).longitude),
    }

    // load iup options (for SYSTEM/MGMT)
    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      // inject selected iup if missing
      if (iupId != null && !mineIUPOptions.value.some((x) => Number(x.value) === Number(iupId))) {
        const label =
          (props.initial as any)?.iup_label ??
          (props.initial as any)?.iup?.label ??
          (props.initial as any)?.iup_code ??
          `IUP #${iupId}`
        mineIUPOptions.value = [{ value: iupId, label }, ...mineIUPOptions.value]
      }
    }

    // load sources
    sourceSearch.value = ""
    sourceOptions.value = []
    sourcePage.value = 1
    sourceHasMore.value = true
    await fetchSources("", 1)

    // inject selected source if missing (edit mode safety)
    if (sourceId != null && !sourceOptions.value.some((x) => Number(x.value) === Number(sourceId))) {
      const label =
        (props.initial as any)?.source_label ??
        (props.initial as any)?.source_name ??
        `Source #${sourceId}`
      sourceOptions.value = [{ value: sourceId, label }, ...sourceOptions.value]
    }

    // auto-select sudah ditangani fetchSources jika hanya 1 & belum ada pilihan
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

          <p v-if="fieldError('iup')" class="text-sm text-destructive">
            {{ fieldError("iup") }}
          </p>
        </div>

        <!-- loading_point -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Loading Point</label>
          <Input v-model="local.loading_point" placeholder="e.g. LP-01" :disabled="!canMutate" />
          <p v-if="fieldError('loading_point')" class="text-sm text-destructive">
            {{ fieldError("loading_point") }}
          </p>
        </div>

        <!-- source -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Source</label>

          <Select :model-value="local.source != null ? String(local.source) : ''"
            @update:model-value="(v) => (local.source = v ? Number(v) : null)" :disabled="sourceLoading || !canMutate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="sourceLoading ? 'Loading...' : 'Select Source'" />
            </SelectTrigger>

            <SelectContent ref="sourceContentRef" class="max-h-80 overflow-auto" @scroll="onSourceScroll">
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input v-model="sourceSearch" placeholder="Search Source..." class="h-8"
                    @input="onSourceSearch(sourceSearch)" @keydown.stop @click.stop />
                </div>

                <div v-if="local.source != null && selectedSourceLabel"
                  class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                  Selected: <span class="font-medium">{{ selectedSourceLabel }}</span>
                </div>

                <SelectItem v-for="o in sourceOptions" :key="String(o.value)" :value="String(o.value)">
                  {{ o.label }}
                </SelectItem>

                <div v-if="sourceLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                <div v-if="!sourceLoading && sourceOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                  No results
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="fieldError('source')" class="text-sm text-destructive">
            {{ fieldError("source") }}
          </p>
        </div>

        <!-- category -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Category</label>
          <Input v-model="local.category" placeholder="e.g. PIT / ROM / STOCKPILE" :disabled="!canMutate" />
          <p v-if="fieldError('category')" class="text-sm text-destructive">
            {{ fieldError("category") }}
          </p>
        </div>

        <!-- description -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Optional..." :disabled="!canMutate" />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError("description") }}
          </p>
        </div>

        <!-- lat lng -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Latitude</label>
            <Input v-model="local.latitude" inputmode="decimal" placeholder="-6.2" :disabled="!canMutate" />
            <p v-if="fieldError('latitude')" class="text-sm text-destructive">
              {{ fieldError("latitude") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Longitude</label>
            <Input v-model="local.longitude" inputmode="decimal" placeholder="106.8" :disabled="!canMutate" />
            <p v-if="fieldError('longitude')" class="text-sm text-destructive">
              {{ fieldError("longitude") }}
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
        <Button v-if="canMutate"
          :disabled="loading || !local.loading_point.trim() || !local.source || (requiresIup && !local.iup)"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>