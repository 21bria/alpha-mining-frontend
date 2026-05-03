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

export type SourceMinePayload = {
  id?: number
  iup: number | null
  sources_area: string
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  geometry?: unknown | null
  extra_properties?: Record<string, any> | null
}

type SourceMineFormState = {
  id?: number
  iup: number | null

  sources_area: string
  description: string

  status: string // UI string -> convert number/null
  latitude: string
  longitude: string
}
// ===== helpers =====
const toNumberOrNull = (v: string) => {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: SourceMinePayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: SourceMinePayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")

const local = ref<SourceMineFormState>({
  iup: null,
  sources_area: '',
  description: '',
  status: '',
  latitude: '',
  longitude: '',
})

// ===== Mine IUP lookup (only if canChooseIup) =====
const mineIUPOptions = ref<Array<{ value: number; label: string }>>([])
const mineIUPLoading = ref(false)
const mineIUPSearch = ref("")
const mineIUPPage = ref(1)
const mineIUPHasMore = ref(true)
const mineIUPContentRef = ref<HTMLElement | null>(null)

function normalizeMineIUPId(v: any): number | null {
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

const title = computed(() => (props.mode === "create" ? "Add Source" : "Edit Source"))
const close = () => emit("update:open", false)

const submit = () => {
  const payload: SourceMinePayload = {
    id: local.value.id,
    iup: local.value.iup,
    sources_area: local.value.sources_area.trim(),
    description: local.value.description.trim() === '' ? null : local.value.description.trim(),
    latitude: toNumberOrNull(local.value.latitude),
    longitude: toNumberOrNull(local.value.longitude),
  }

  // hanya SYSTEM/MANAGEMENT kirim iup; SITE_USER biar server set otomatis
  if (canChooseIup.value) payload.iup = local.value.iup

  emit("submit", payload)
}

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

// init on open
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const iupId = normalizeMineIUPId((props.initial as any)?.iup ?? (props.initial as any)?.iup_id)

    local.value = {
      id: props.initial?.id,
      iup: iupId,
      sources_area: (props.initial as any)?.sources_area ?? '',
      description: (props.initial as any)?.description ?? '',
      status: (props.initial as any)?.status == null ? '' : String((props.initial as any).status),
      latitude: (props.initial as any)?.latitude == null ? '' : String((props.initial as any).latitude),
      longitude: (props.initial as any)?.longitude == null ? '' : String((props.initial as any).longitude),
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      if (iupId != null && !mineIUPOptions.value.some((x) => Number(x.value) === iupId)) {
        const label =
          (props.initial as any)?.iup_label ??
          (props.initial as any)?.iup?.label ??
          (props.initial as any)?.iup_code ??
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

        <!-- sources_area -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Source Area</label>
          <Input v-model="local.sources_area" placeholder="e.g. Pit A" />
          <p v-if="fieldError('sources_area')" class="text-sm text-destructive">
            {{ fieldError('sources_area') }}
          </p>
        </div>

        <!-- description -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Optional..." />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
        </div>

        <!-- lat lng -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Latitude</label>
            <Input v-model="local.latitude" inputmode="decimal" placeholder="-6.2" />
            <p v-if="fieldError('latitude')" class="text-sm text-destructive">
              {{ fieldError('latitude') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Longitude</label>
            <Input v-model="local.longitude" inputmode="decimal" placeholder="106.8" />
            <p v-if="fieldError('longitude')" class="text-sm text-destructive">
              {{ fieldError('longitude') }}
            </p>
          </div>
        </div>

      <!-- general errors -->
      <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
        {{ fieldError("non_field_errors") }}
      </p>
      <p v-if="fieldError('detail')" class="text-sm text-destructive">
        {{ fieldError("detail") }}
      </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button v-if="canMutate" :disabled="loading || !local.sources_area.trim() || (requiresIup && !local.iup)"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>