<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
type DomeType = "" | "TEMP" | "SELECTIVE" | "ROM" | "STOCK"

export type SourcePitDomePayload = {
  id?: number

  loading_point?: number | null

  dome: string
  dome_type?: "TEMP" | "SELECTIVE" | "ROM" | "STOCK"

  description?: string | null
  compositing?: string | null
  status_dome?: string | null
  is_active?: boolean
  direct_sale?: string | null

  latitude?: number | null
  longitude?: number | null
  geometry?: unknown | null
  extra_properties?: Record<string, any> | null
}

type FormState = {
  id?: number

  loading_point: number | null

  dome: string
  dome_type: DomeType

  description: string
  compositing: string
  status_dome: string

  is_active: boolean
  direct_sale: YesNo

  latitude: string
  longitude: string
}

const DOME_TYPE_OPTIONS: Array<{
  value: "TEMP" | "SELECTIVE" | "ROM" | "STOCK"
  label: string
}> = [
  { value: "TEMP", label: "Temporary" },
  { value: "SELECTIVE", label: "Selective" },
  { value: "ROM", label: "ROM" },
  { value: "STOCK", label: "Stock" },
]

const YESNO_OPTIONS: Array<{ value: "Yes" | "No"; label: string }> = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
]

const ACTIVE_OPTIONS: Array<{ value: "true" | "false"; label: string }> = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
]

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
  initial?: SourcePitDomePayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: SourcePitDomePayload): void
}>()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const title = computed(() => (props.mode === "create" ? "Add Pit Dome" : "Edit Pit Dome"))

const close = () => emit("update:open", false)

const local = ref<FormState>({
  loading_point: null,

  dome: "",
  dome_type: "TEMP",

  description: "",
  compositing: "",
  status_dome: "",

  is_active: true,
  direct_sale: "",

  latitude: "",
  longitude: "",
})

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

// LOADING POINT LOOKUP
const loadingPointOptions = ref<Array<{ value: number; label: string }>>([])
const loadingPointLoading = ref(false)
const loadingPointSearch = ref("")
const loadingPointPage = ref(1)
const loadingPointHasMore = ref(true)
const loadingPointContentRef = ref<HTMLElement | null>(null)

async function fetchLoadingPoints(q = "", page = 1) {
  if (loadingPointLoading.value) return

  loadingPointLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/mine-loading/", {
      method: "GET",
      query: {
        q,
        search: q,
        page,
        page_size: 10,
        value_key: "id",
        label_key: "loading_point",
      },
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) {
      loadingPointOptions.value = items
    } else {
      loadingPointOptions.value = [...loadingPointOptions.value, ...items]
    }

    loadingPointPage.value = page
    loadingPointHasMore.value = loadingPointOptions.value.length < count

    if (local.value.loading_point == null && loadingPointOptions.value.length === 1) {
      const [only] = loadingPointOptions.value
      if (only) local.value.loading_point = Number(only.value)
    }
  } finally {
    loadingPointLoading.value = false
  }
}

const onLoadingPointSearch = useDebounceFn((q: string) => {
  loadingPointPage.value = 1
  loadingPointHasMore.value = true

  fetchLoadingPoints(q, 1).then(() => {
    if (loadingPointContentRef.value) {
      loadingPointContentRef.value.scrollTop = 0
    }
  })
}, 300)

const selectedLoadingPointLabel = computed(() => {
  const v = local.value.loading_point
  if (v == null) return null

  return (
    loadingPointOptions.value.find((x) => Number(x.value) === Number(v))?.label ??
    null
  )
})

function onLoadingPointScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (
    nearBottom &&
    loadingPointHasMore.value &&
    !loadingPointLoading.value
  ) {
    fetchLoadingPoints(
      loadingPointSearch.value,
      loadingPointPage.value + 1
    )
  }
}

// SUBMIT
const submit = () => {
  const payload: SourcePitDomePayload = {
    id: local.value.id,

    loading_point: local.value.loading_point,

    dome: local.value.dome.trim(),

    dome_type:
      local.value.dome_type === ""
        ? "TEMP"
        : local.value.dome_type,

    description:
      local.value.description.trim() === ""
        ? null
        : local.value.description.trim(),

    compositing:
      local.value.compositing.trim() === ""
        ? null
        : local.value.compositing.trim(),

    status_dome:
      local.value.status_dome.trim() === ""
        ? null
        : local.value.status_dome.trim(),

    is_active: local.value.is_active,

    direct_sale:
      local.value.direct_sale === ""
        ? null
        : local.value.direct_sale,

    latitude: toNumberOrNull(local.value.latitude),
    longitude: toNumberOrNull(local.value.longitude),
  }

  emit("submit", payload)
}

// INIT ON OPEN
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const loadingPointId = normalizeId(
      (props.initial as any)?.loading_point ??
        (props.initial as any)?.loading_point_id ??
        (props.initial as any)?.id_loading
    )

    local.value = {
      id: props.initial?.id,

      loading_point: loadingPointId,

      dome: (props.initial as any)?.dome ?? "",
      dome_type: ((props.initial as any)?.dome_type ?? "TEMP") as DomeType,

      description: (props.initial as any)?.description ?? "",
      compositing: (props.initial as any)?.compositing ?? "",
      status_dome: (props.initial as any)?.status_dome ?? "",

      is_active:
        (props.initial as any)?.is_active == null
          ? true
          : Boolean((props.initial as any)?.is_active),

      direct_sale: ((props.initial as any)?.direct_sale ?? "") as YesNo,

      latitude:
        (props.initial as any)?.latitude == null
          ? ""
          : String((props.initial as any).latitude),

      longitude:
        (props.initial as any)?.longitude == null
          ? ""
          : String((props.initial as any).longitude),
    }

    loadingPointSearch.value = ""
    loadingPointOptions.value = []
    loadingPointPage.value = 1
    loadingPointHasMore.value = true

    await fetchLoadingPoints("", 1)

    if (
      loadingPointId != null &&
      !loadingPointOptions.value.some(
        (x) => Number(x.value) === Number(loadingPointId)
      )
    ) {
      const label =
        (props.initial as any)?.loading_point_label ??
        (props.initial as any)?.loading_point_name ??
        (props.initial as any)?.dumping_point ??
        `Loading Point #${loadingPointId}`

      loadingPointOptions.value = [
        { value: loadingPointId, label },
        ...loadingPointOptions.value,
      ]
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
        <!-- loading point -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Loading Point</label>

          <Select
            :model-value="local.loading_point != null ? String(local.loading_point) : ''"
            :disabled="loadingPointLoading || !canMutate"
            @update:model-value="(v) => (local.loading_point = v ? Number(v) : null)"
          >
            <SelectTrigger class="h-9">
              <SelectValue
                :placeholder="loadingPointLoading ? 'Loading...' : 'Select Loading Point'"
              />
            </SelectTrigger>

           <SelectContent>
            <div
              ref="loadingPointContentRef"
              class="max-h-80 overflow-auto"
              @scroll="onLoadingPointScroll"
            >
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input
                    v-model="loadingPointSearch"
                    placeholder="Search Loading Point..."
                    class="h-8"
                    @input="onLoadingPointSearch(loadingPointSearch)"
                    @keydown.stop
                    @click.stop
                  />
                </div>

                <div
                  v-if="local.loading_point != null && selectedLoadingPointLabel"
                  class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs"
                >
                  Selected:
                  <span class="font-medium">
                    {{ selectedLoadingPointLabel }}
                  </span>
                </div>

                <SelectItem
                  v-for="o in loadingPointOptions"
                  :key="String(o.value)"
                  :value="String(o.value)"
                >
                  {{ o.label }}
                </SelectItem>

                <div
                  v-if="loadingPointLoading"
                  class="p-2 text-sm text-muted-foreground"
                >
                  Loading...
                </div>

                <div
                  v-if="!loadingPointLoading && loadingPointOptions.length === 0"
                  class="p-2 text-sm text-muted-foreground"
                >
                  No results
                </div>
              </SelectGroup>
            </div>
          </SelectContent>
          </Select>

          <p
            v-if="fieldError('loading_point')"
            class="text-sm text-destructive"
          >
            {{ fieldError("loading_point") }}
          </p>
        </div>

        <!-- dome -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Dome</label>

          <Input
            v-model="local.dome"
            placeholder="e.g. TEMP_01"
            :disabled="!canMutate"
          />

          <p v-if="fieldError('dome')" class="text-sm text-destructive">
            {{ fieldError("dome") }}
          </p>
        </div>

        <!-- dome type -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Dome Type</label>

          <Select
            :model-value="local.dome_type"
            :disabled="!canMutate"
            @update:model-value="(v) => (local.dome_type = (v as DomeType) || 'TEMP')"
          >
            <SelectTrigger class="h-9">
              <SelectValue placeholder="Select Dome Type" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="o in DOME_TYPE_OPTIONS"
                  :key="o.value"
                  :value="o.value"
                >
                  {{ o.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="fieldError('dome_type')" class="text-sm text-destructive">
            {{ fieldError("dome_type") }}
          </p>
        </div>

        <!-- compositing -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Compositing</label>

          <Input
            v-model="local.compositing"
            placeholder="Optional..."
            :disabled="!canMutate"
          />

          <p v-if="fieldError('compositing')" class="text-sm text-destructive">
            {{ fieldError("compositing") }}
          </p>
        </div>

        <!-- direct sale -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Direct Sale</label>

          <Select
            :model-value="local.direct_sale"
            :disabled="!canMutate"
            @update:model-value="(v) => (local.direct_sale = (v as YesNo) || '')"
          >
            <SelectTrigger class="h-9">
              <SelectValue placeholder="Select Yes/No" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="o in YESNO_OPTIONS"
                  :key="o.value"
                  :value="o.value"
                >
                  {{ o.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="fieldError('direct_sale')" class="text-sm text-destructive">
            {{ fieldError("direct_sale") }}
          </p>
        </div>

        <!-- status active -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Status Dome</label>

            <Input
              v-model="local.status_dome"
              placeholder="e.g. ACTIVE"
              :disabled="!canMutate"
            />

            <p
              v-if="fieldError('status_dome')"
              class="text-sm text-destructive"
            >
              {{ fieldError("status_dome") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Active Status</label>

            <Select
              :model-value="String(local.is_active)"
              :disabled="!canMutate"
              @update:model-value="(v) => (local.is_active = v === 'true')"
            >
              <SelectTrigger class="h-9">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="o in ACTIVE_OPTIONS"
                    :key="o.value"
                    :value="o.value"
                  >
                    {{ o.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('is_active')" class="text-sm text-destructive">
              {{ fieldError("is_active") }}
            </p>
          </div>
        </div>

        <!-- description -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>

          <Textarea
            v-model="local.description"
            placeholder="Optional..."
            :disabled="!canMutate"
          />

          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError("description") }}
          </p>
        </div>

        <!-- lat lng -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Latitude</label>

            <Input
              v-model="local.latitude"
              inputmode="decimal"
              placeholder="-6.2"
              :disabled="!canMutate"
            />

            <p v-if="fieldError('latitude')" class="text-sm text-destructive">
              {{ fieldError("latitude") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Longitude</label>

            <Input
              v-model="local.longitude"
              inputmode="decimal"
              placeholder="106.8"
              :disabled="!canMutate"
            />

            <p v-if="fieldError('longitude')" class="text-sm text-destructive">
              {{ fieldError("longitude") }}
            </p>
          </div>
        </div>

        <p
          v-if="fieldError('non_field_errors')"
          class="text-sm text-destructive"
        >
          {{ fieldError("non_field_errors") }}
        </p>

        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          Cancel
        </Button>

        <Button
          v-if="canMutate"
          :disabled="
            loading ||
            !local.dome.trim() ||
            !local.loading_point ||
            !local.dome_type
          "
          @click="submit"
        >
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>