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

function normalizeRole(v: any): UserRole {
  const raw = String(v ?? "").trim().toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(raw)) return raw as UserRole
  if (["SUPER_ADMIN", "SUPERADMIN", "ADMIN"].includes(raw)) return "SYSTEM"
  return "SITE_USER"
}

export type PointsPayload = {
  id?: number
  iup?: number | null // optional untuk SITE_USER (server set)
  name: string
  description?: string | null
}

type PointsFormState = {
  id?: number
  iup: number | null
  name: string
  description: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: PointsPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: PointsPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const local = ref<PointsFormState>({
  iup: null,
  name: "",
  description: "",
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

const title = computed(() => (props.mode === "create" ? "Add Points" : "Edit Points"))
const close = () => emit("update:open", false)

const submit = () => {
  const payload: PointsPayload = {
    id: local.value.id,
    name: local.value.name.trim(),
    description: local.value.description.trim() === "" ? null : local.value.description.trim(),
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
      name: (props.initial as any)?.name ?? "",
      description: (props.initial as any)?.description ?? "",
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
          <label class="text-sm font-medium">Name</label>
          <Input v-model="local.name" placeholder="e.g. Points A" :disabled="!canMutate" />
          <p v-if="fieldError('name')" class="text-sm text-destructive">
            {{ fieldError("name") }}
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
        <Button v-if="canMutate" :disabled="loading || !local.name.trim() || (canChooseIup && !local.iup)"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>