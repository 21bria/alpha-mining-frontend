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

export type DumpingPointPayload = {
  id?: number
  iup?: number | null // optional untuk SITE_USER (server set)
  dumping_point: string
  description?: string | null
  category?: string | null
  status?: number | null
}

type DumpingPointFormState = {
  id?: number
  iup: number | null
  dumping_point: string
  description: string
  category: string
  status: boolean
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: DumpingPointPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: DumpingPointPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const local = ref<DumpingPointFormState>({
  iup: null,
  dumping_point: "",
  description: "",
  category: "",
  status: true, // default active
})

const categoryOptions = [
  { value: "Stockpile", label: "Stockpile" },
  { value: "General", label: "General" },
] as const

const selectedCategoryLabel = computed(() => {
  const v = (local.value.category ?? "").trim()
  if (!v) return null
  return categoryOptions.find((x) => x.value === v)?.label ?? v
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

function normalizeStatusToBool(v: any): boolean {
  // backend: 1/0/null
  if (v === 1 || v === "1" || v === true) return true
  if (v === 0 || v === "0" || v === false) return false
  // default kalau null/undefined: active
  return true
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

const title = computed(() => (props.mode === "create" ? "Add Dumping Point" : "Edit Dumping Point"))
const close = () => emit("update:open", false)

const submit = () => {
  const payload: DumpingPointPayload = {
    id: local.value.id,
    dumping_point: local.value.dumping_point.trim(),
    description: local.value.description.trim() === "" ? null : local.value.description.trim(),
    category: local.value.category.trim() === "" ? null : local.value.category.trim(),
    status: local.value.status ? 1 : 0,
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
      dumping_point: (props.initial as any)?.dumping_point ?? "",
      description: (props.initial as any)?.description ?? "",
      category: String((props.initial as any)?.category ?? "").trim(),
      status: normalizeStatusToBool((props.initial as any)?.status),
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

        <!-- name -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Dumping Point</label>
          <Input v-model="local.dumping_point" placeholder="e.g. Dumping A" :disabled="!canMutate" />
          <p v-if="fieldError('dumping_point')" class="text-sm text-destructive">
            {{ fieldError("dumping_point") }}
          </p>
        </div>
        <!-- category -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Category</label>

          <Select :model-value="local.category" @update:model-value="(v) => (local.category = String(v ?? ''))"
            :disabled="!canMutate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="'Select Category'">
                <!-- kalau komponen SelectValue kamu support slot -->
                {{ selectedCategoryLabel ?? 'Select Category' }}
              </SelectValue>
            </SelectTrigger>

            <SelectContent class="max-h-60 overflow-auto">
              <SelectGroup>
                <SelectItem v-for="o in categoryOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

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

        <!-- status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="local.status" @update:model-value="(v) => (local.status = v === true)"
              :disabled="!canMutate" />
            Active
          </label>
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
        <Button v-if="canMutate" :disabled="loading || !local.dumping_point.trim() || !local.category.trim() || (canChooseIup && !local.iup)"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>