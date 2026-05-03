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

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"
/** ========= Role normalize ========= */
function normalizeRole(v: any): UserRole {
  const raw = String(v ?? "").trim().toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(raw)) return raw as UserRole
  if (raw === "SUPER_ADMIN" || raw === "SUPERADMIN" || raw === "ADMIN") return "SYSTEM"
  return "SITE_USER"
}

const currentRole = computed<UserRole>(() => normalizeRole(props.role))
export type MineUnitsPayload = {
  id?: number
  iup?: number | null
  unit_code: string
  unit_model?: string | null
  unit_class?: string | null
  brand?: string | null
  id_category?: number | null
  id_vendor?: number | null
  supports?: string | null
  status?: number | null
  description?: string | null
  commisioning_date?: string | null
  on_hire?: string | null
  off_hire?: string | null
}

type FormState = {
  id?: number
  iup: number | null
  unit_code: string
  unit_model: string
  unit_class: string
  brand: string
  id_category: number | null
  id_vendor: number | null
  supports: string
  status: boolean
  description: string
  commisioning_date: string
  on_hire: string
  off_hire: string
}
const { request } = useApi()

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: MineUnitsPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: MineUnitsPayload): void
}>()

const canChooseIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const requiresIup = computed(() => props.role === "SYSTEM" || props.role === "MANAGEMENT")
const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const title = computed(() => (props.mode === "create" ? "Add Mine Unit" : "Edit Mine Unit"))
const close = () => emit("update:open", false)

const normalizeId = (v: any): number | null => {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === "object") {
    const n = Number(v.value ?? v.id ?? null)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const normalizeStatusToBool = (v: any): boolean => {
  if (v === 1 || v === "1" || v === true) return true
  if (v === 0 || v === "0" || v === false) return false
  return true
}

const local = ref<FormState>({
  iup: null,
  unit_code: "",
  unit_model: "",
  unit_class: "",
  brand: "",
  id_category: null,
  id_vendor: null,
  supports: "",
  status: true,
  description: "",
  commisioning_date: "",
  on_hire: "",
  off_hire: "",
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
// CATEGORY LOOKUP
// ======================
const categoryOptions = ref<Array<{ value: number; label: string }>>([])
const categoryLoading = ref(false)
const categorySearch = ref("")
const categoryPage = ref(1)
const categoryHasMore = ref(true)
const categoryContentRef = ref<HTMLElement | null>(null)

async function fetchCategories(q = "", page = 1) {
  if (categoryLoading.value) return
  categoryLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/units-categories/", {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) categoryOptions.value = items
    else categoryOptions.value = [...categoryOptions.value, ...items]

    categoryPage.value = page
    categoryHasMore.value = categoryOptions.value.length < count
  } finally {
    categoryLoading.value = false
  }
}

const onCategorySearch = useDebounceFn((q: string) => {
  categoryPage.value = 1
  categoryHasMore.value = true
  fetchCategories(q, 1).then(() => {
    if (categoryContentRef.value) categoryContentRef.value.scrollTop = 0
  })
}, 300)

const selectedCategoryLabel = computed(() => {
  const v = local.value.id_category
  if (v == null) return null
  return categoryOptions.value.find((x) => Number(x.value) === Number(v))?.label ?? null
})

function onCategoryScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && categoryHasMore.value && !categoryLoading.value) {
    fetchCategories(categorySearch.value, categoryPage.value + 1)
  }
}

// ======================
// VENDOR LOOKUP
// ======================
const vendorOptions = ref<Array<{ value: number; label: string }>>([])
const vendorLoading = ref(false)
const vendorSearch = ref("")
const vendorPage = ref(1)
const vendorHasMore = ref(true)
const vendorContentRef = ref<HTMLElement | null>(null)

async function fetchVendors(q = "", page = 1) {
  if (vendorLoading.value) return
  vendorLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/vendors/", {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) vendorOptions.value = items
    else vendorOptions.value = [...vendorOptions.value, ...items]

    vendorPage.value = page
    vendorHasMore.value = vendorOptions.value.length < count
  } finally {
    vendorLoading.value = false
  }
}

const onVendorSearch = useDebounceFn((q: string) => {
  vendorPage.value = 1
  vendorHasMore.value = true
  fetchVendors(q, 1).then(() => {
    if (vendorContentRef.value) vendorContentRef.value.scrollTop = 0
  })
}, 300)

const selectedVendorLabel = computed(() => {
  const v = local.value.id_vendor
  if (v == null) return null
  return vendorOptions.value.find((x) => Number(x.value) === Number(v))?.label ?? null
})

function onVendorScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && vendorHasMore.value && !vendorLoading.value) {
    fetchVendors(vendorSearch.value, vendorPage.value + 1)
  }
}

// ======================
// SUBMIT
// ======================
const submit = () => {
  const payload: MineUnitsPayload = {
    id: local.value.id,
    unit_code: local.value.unit_code.trim(),
    unit_model: local.value.unit_model.trim() === "" ? null : local.value.unit_model.trim(),
    unit_class: local.value.unit_class.trim() === "" ? null : local.value.unit_class.trim(),
    brand: local.value.brand.trim() === "" ? null : local.value.brand.trim(),
    id_category: local.value.id_category,
    id_vendor: local.value.id_vendor,
    supports: local.value.supports.trim() === "" ? null : local.value.supports.trim(),
    status: local.value.status ? 1 : 0,
    description: local.value.description.trim() === "" ? null : local.value.description.trim(),
    commisioning_date: local.value.commisioning_date || null,
    on_hire: local.value.on_hire || null,
    off_hire: local.value.off_hire || null,
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

    const categoryId = normalizeId((props.initial as any)?.id_category)
    const vendorId = normalizeId((props.initial as any)?.id_vendor)
    const iupId = normalizeId((props.initial as any)?.iup ?? (props.initial as any)?.active_iup)
    local.value = {
      id: props.initial?.id,
      iup: iupId,
      unit_code: (props.initial as any)?.unit_code ?? "",
      unit_model: (props.initial as any)?.unit_model ?? "",
      unit_class: (props.initial as any)?.unit_class ?? "",
      brand: (props.initial as any)?.brand ?? "",
      id_category: categoryId,
      id_vendor: vendorId,
      supports: (props.initial as any)?.supports ?? "",
      status: normalizeStatusToBool((props.initial as any)?.status),
      description: (props.initial as any)?.description ?? "",
      commisioning_date: (props.initial as any)?.commisioning_date ?? "",
      on_hire: (props.initial as any)?.on_hire ?? "",
      off_hire: (props.initial as any)?.off_hire ?? "",
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPOptions.value = []
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      await fetchMineIUP("", 1)

      if (iupId != null && !mineIUPOptions.value.some((x) => Number(x.value) === Number(iupId))) {
        const label =
          (props.initial as any)?.iup_label ??
          (props.initial as any)?.active_iup_code ??
          `IUP #${iupId}`

        mineIUPOptions.value = [{ value: iupId, label }, ...mineIUPOptions.value]
      }
    }
    // load categories
    categorySearch.value = ""
    categoryOptions.value = []
    categoryPage.value = 1
    categoryHasMore.value = true
    await fetchCategories("", 1)

    if (categoryId != null && !categoryOptions.value.some((x) => Number(x.value) === Number(categoryId))) {
      const label =
        (props.initial as any)?.category_name ??
        `Category #${categoryId}`
      categoryOptions.value = [{ value: categoryId, label }, ...categoryOptions.value]
    }

    // load vendors
    vendorSearch.value = ""
    vendorOptions.value = []
    vendorPage.value = 1
    vendorHasMore.value = true
    await fetchVendors("", 1)

    if (vendorId != null && !vendorOptions.value.some((x) => Number(x.value) === Number(vendorId))) {
      const label =
        (props.initial as any)?.vendor_name ??
        `Vendor #${vendorId}`
      vendorOptions.value = [{ value: vendorId, label }, ...vendorOptions.value]
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <!-- <DialogContent class="sm:max-w-2xl"> -->
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <p v-if="role === 'SITE_USER'" class="text-xs text-muted-foreground">
          Unit akan otomatis diassign ke IUP aktif Anda.
        </p>
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
        <!-- unit_code -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Unit Code</label>
          <Input v-model="local.unit_code" placeholder="e.g. DT-001" :disabled="!canMutate" />
          <p v-if="fieldError('unit_code')" class="text-sm text-destructive">
            {{ fieldError("unit_code") }}
          </p>
        </div>

        <!-- unit_model + unit_class -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Unit Model</label>
            <Input v-model="local.unit_model" placeholder="e.g. HD785" :disabled="!canMutate" />
            <p v-if="fieldError('unit_model')" class="text-sm text-destructive">
              {{ fieldError("unit_model") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Unit Class</label>
            <Input v-model="local.unit_class" placeholder="e.g. Hauler" :disabled="!canMutate" />
            <p v-if="fieldError('unit_class')" class="text-sm text-destructive">
              {{ fieldError("unit_class") }}
            </p>
          </div>
        </div>

        <!-- brand + supports -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Brand</label>
            <Input v-model="local.brand" placeholder="e.g. Komatsu" :disabled="!canMutate" />
            <p v-if="fieldError('brand')" class="text-sm text-destructive">
              {{ fieldError("brand") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Supports</label>
            <Input v-model="local.supports" placeholder="e.g. Ore / Waste" :disabled="!canMutate" />
            <p v-if="fieldError('supports')" class="text-sm text-destructive">
              {{ fieldError("supports") }}
            </p>
          </div>
        </div>

        <!-- category + vendor lookup -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Category</label>

            <Select :model-value="local.id_category != null ? String(local.id_category) : ''"
              @update:model-value="(v) => (local.id_category = v ? Number(v) : null)"
              :disabled="categoryLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="categoryLoading ? 'Loading...' : 'Select Category'" />
              </SelectTrigger>

              <SelectContent ref="categoryContentRef" class="max-h-80 overflow-auto" @scroll="onCategoryScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="categorySearch" placeholder="Search Category..." class="h-8"
                      @input="onCategorySearch(categorySearch)" @keydown.stop @click.stop />
                  </div>

                  <div v-if="local.id_category != null && selectedCategoryLabel"
                    class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                    Selected: <span class="font-medium">{{ selectedCategoryLabel }}</span>
                  </div>

                  <SelectItem v-for="o in categoryOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="categoryLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!categoryLoading && categoryOptions.length === 0"
                    class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('id_category')" class="text-sm text-destructive">
              {{ fieldError("id_category") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Vendor</label>

            <Select :model-value="local.id_vendor != null ? String(local.id_vendor) : ''"
              @update:model-value="(v) => (local.id_vendor = v ? Number(v) : null)"
              :disabled="vendorLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="vendorLoading ? 'Loading...' : 'Select Vendor'" />
              </SelectTrigger>

              <SelectContent ref="vendorContentRef" class="max-h-80 overflow-auto" @scroll="onVendorScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                    <Input v-model="vendorSearch" placeholder="Search Vendor..." class="h-8"
                      @input="onVendorSearch(vendorSearch)" @keydown.stop @click.stop />
                  </div>

                  <div v-if="local.id_vendor != null && selectedVendorLabel"
                    class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                    Selected: <span class="font-medium">{{ selectedVendorLabel }}</span>
                  </div>

                  <SelectItem v-for="o in vendorOptions" :key="String(o.value)" :value="String(o.value)">
                    {{ o.label }}
                  </SelectItem>

                  <div v-if="vendorLoading" class="p-2 text-sm text-muted-foreground">Loading...</div>
                  <div v-if="!vendorLoading && vendorOptions.length === 0" class="p-2 text-sm text-muted-foreground">
                    No results
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>

            <p v-if="fieldError('id_vendor')" class="text-sm text-destructive">
              {{ fieldError("id_vendor") }}
            </p>
          </div>
        </div>

        <!-- dates -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Commisioning Date</label>
            <Input v-model="local.commisioning_date" type="date" :disabled="!canMutate" />
            <p v-if="fieldError('commisioning_date')" class="text-sm text-destructive">
              {{ fieldError("commisioning_date") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">On Hire</label>
            <Input v-model="local.on_hire" type="date" :disabled="!canMutate" />
            <p v-if="fieldError('on_hire')" class="text-sm text-destructive">
              {{ fieldError("on_hire") }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Off Hire</label>
            <Input v-model="local.off_hire" type="date" :disabled="!canMutate" />
            <p v-if="fieldError('off_hire')" class="text-sm text-destructive">
              {{ fieldError("off_hire") }}
            </p>
          </div>
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
        <Button v-if="canMutate"
         :disabled="loading || !local.unit_code.trim() || !local.id_vendor || !local.id_category || (requiresIup && !local.iup)" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>