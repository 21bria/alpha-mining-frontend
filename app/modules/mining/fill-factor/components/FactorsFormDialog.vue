<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useApi } from "@/composables/useApi"
import { useCurrentRole } from "@/composables/useCurrentRole"

type MineIupOption = {
  value: number
  label: string
}

type MaterialOption = {
  value: number | string
  label: string
}

type FillFactorRowPayload = {
  type_unit: string
  material: string
  density_bcm?: number | null
  density_lcm?: number | null
  bucket_capacity?: number | null
  validation?: string | null
  description?: string | null
}

type FillFactorSubmitPayload = {
  id?: number | string
  iup: number | null
  details: FillFactorRowPayload[]
}

type FillFactorInitial = {
  id?: number | string
  iup?: number | null
  details?: FillFactorRowPayload[]
}

type FillFactorRowForm = {
  type_unit: string
  material: string
  density_bcm: string
  density_lcm: string
  bucket_capacity: string
  validation: string
  description: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  initial?: FillFactorInitial | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: FillFactorSubmitPayload): void
}>()

const { currentRole } = useCurrentRole()
const { request } = useApi()

const canChooseIup = computed(() =>
  ["SUPERADMIN", "MANAGEMENT", "SYSTEM"].includes(
    String(currentRole.value || "").toUpperCase()
  )
)

const canMutate = computed(() => true)

const title = computed(() =>
  props.mode === "create" ? "Add Fill Factor" : "Edit Fill Factor"
)

const local = ref<{
  id?: number | string
  iup: number | null
  details: FillFactorRowForm[]
}>({
  id: undefined,
  iup: null,
  details: [],
})

function blankRow(): FillFactorRowForm {
  return {
    type_unit: "",
    material: "",
    density_bcm: "",
    density_lcm: "",
    bucket_capacity: "",
    validation: "",
    description: "",
  }
}

function addRow() {
  local.value.details.push(blankRow())
}

function removeRow(index: number) {
  if (local.value.details.length <= 1) return
  local.value.details.splice(index, 1)
}

function close() {
  emit("update:open", false)
}

watch(
  () => props.open,
  (v) => {
    if (!v) return

    local.value = {
      id: props.initial?.id,
      iup: props.initial?.iup ?? null,
      details:
        props.initial?.details?.length
          ? props.initial.details.map((x) => ({
            type_unit: x.type_unit ?? "",
            material: x.material ?? "",
            density_bcm: x.density_bcm == null ? "" : String(x.density_bcm),
            density_lcm: x.density_lcm == null ? "" : String(x.density_lcm),
            bucket_capacity: x.bucket_capacity == null ? "" : String(x.bucket_capacity),
            validation: x.validation ?? "",
            description: x.description ?? "",
          }))
          : [blankRow()],
    }

    if (canChooseIup.value) {
      mineIUPSearch.value = ""
      mineIUPPage.value = 1
      mineIUPHasMore.value = true
      fetchMineIUP("", 1)
    }

    materialSearch.value = ""
    materialPage.value = 1
    materialHasMore.value = true
    fetchMaterial("", 1)
  },
  { immediate: true }
)

/* IUP lookup */
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
      query: { q, page, page_size: 10 },
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

/* Material lookup */
const materialOptions = ref<MaterialOption[]>([])
const materialLoading = ref(false)
const materialSearch = ref("")
const materialPage = ref(1)
const materialHasMore = ref(true)
const materialContentRef = ref<HTMLElement | null>(null)

async function fetchMaterial(q = "", page = 1) {
  if (materialLoading.value) return
  materialLoading.value = true
  try {
    const res: any = await request("/api/master/lookups/material/", {
      method: "GET",
      query: { q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as MaterialOption[]
    const count = Number(res?.count ?? 0)

    if (page === 1) materialOptions.value = items
    else materialOptions.value = [...materialOptions.value, ...items]

    materialPage.value = page
    materialHasMore.value = materialOptions.value.length < count
  } finally {
    materialLoading.value = false
  }
}

const onMaterialSearch = useDebounceFn((q: string) => {
  materialPage.value = 1
  materialHasMore.value = true
  fetchMaterial(q, 1).then(() => {
    if (materialContentRef.value) materialContentRef.value.scrollTop = 0
  })
}, 300)

function onMaterialScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  if (nearBottom && materialHasMore.value && !materialLoading.value) {
    fetchMaterial(materialSearch.value, materialPage.value + 1)
  }
}

const validationOptions = [
  { value: "BCM", label: "BCM" },
  { value: "LCM", label: "LCM" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "REVIEW", label: "REVIEW" },
]

function submit() {
  emit("submit", {
    id: local.value.id,
    iup: local.value.iup,
    details: local.value.details
      .filter((x) =>
        x.type_unit ||
        x.material ||
        x.density_bcm ||
        x.density_lcm ||
        x.bucket_capacity ||
        x.validation ||
        x.description
      )
      .map((x) => ({
        type_unit: x.type_unit?.trim(),
        material: x.material?.trim(),
        density_bcm: x.density_bcm ? Number(x.density_bcm) : null,
        density_lcm: x.density_lcm ? Number(x.density_lcm) : null,
        bucket_capacity: x.bucket_capacity ? Number(x.bucket_capacity) : null,
        validation: x.validation?.trim() || "",
        description: x.description?.trim() || "",
      })),
  })
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

function rowFieldError(index: number, field: string) {
  const key1 = `details.${index}.${field}`
  const key2 = `details[${index}].${field}`
  const e = props.errors?.[key1] ?? props.errors?.[key2]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-if="canChooseIup" class="grid gap-2">
            <label class="text-sm font-medium">IUP</label>
            <Select :model-value="local.iup != null ? String(local.iup) : ''"
              @update:model-value="(v) => (local.iup = v ? Number(v) : null)" :disabled="mineIUPLoading || !canMutate">
              <SelectTrigger class="h-9">
                <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
              </SelectTrigger>

              <SelectContent ref="mineIUPContentRef" class="max-h-80 overflow-auto" @scroll="onMineIUPScroll">
                <SelectGroup>
                  <div class="sticky top-0 z-10 bg-background/95 backdrop-blur p-2 border-b">
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
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Fill Factor Details</h3>
            <Button type="button" variant="outline" @click="addRow">
              Add Row
            </Button>
          </div>

          <div v-for="(row, index) in local.details" :key="index" class="rounded-xl border p-4 space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Type Unit</label>
                <Input v-model="row.type_unit" placeholder="PC 350" />
                <p v-if="rowFieldError(index, 'type_unit')" class="text-sm text-destructive">
                  {{ rowFieldError(index, "type_unit") }}
                </p>
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Material</label>
                <Select v-model="row.material">
                  <SelectTrigger class="h-9">
                    <SelectValue :placeholder="materialLoading ? 'Loading...' : 'Select Material'" />
                  </SelectTrigger>

                  <SelectContent ref="materialContentRef" class="max-h-80 overflow-auto" @scroll="onMaterialScroll">
                    <SelectGroup>
                      <div class="sticky top-0 z-10 bg-background/95 backdrop-blur p-2 border-b">
                        <Input v-model="materialSearch" placeholder="Search Material..." class="h-8"
                          @input="onMaterialSearch(materialSearch)" @keydown.stop @click.stop />
                      </div>

                      <SelectItem v-for="o in materialOptions" :key="String(o.value)" :value="String(o.label)">
                        {{ o.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p v-if="rowFieldError(index, 'material')" class="text-sm text-destructive">
                  {{ rowFieldError(index, "material") }}
                </p>
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Density BCM</label>
                <Input v-model="row.density_bcm" type="number" step="any" placeholder="0.00" />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Density LCM</label>
                <Input v-model="row.density_lcm" type="number" step="any" placeholder="0.00" />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <label class="text-sm font-medium">Bucket Capacity</label>
                <Input v-model="row.bucket_capacity" type="number" step="any" placeholder="0.00" />
              </div>

              <div class="grid gap-2 sm:col-span-11">
                <label class="text-sm font-medium">Description</label>
                <Textarea v-model="row.description" rows="2" placeholder="Description..." />
              </div>

              <div class="flex items-end sm:col-span-1">
                <Button type="button" variant="ghost" class="w-full" :disabled="local.details.length === 1"
                  @click="removeRow(index)">
                  Remove
                </Button>
              </div>
            </div>
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
        <Button :disabled="loading || local.details.length === 0" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>