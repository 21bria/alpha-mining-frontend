<script setup lang="ts">
import { ref, watch, computed } from "vue"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

import SelectLookup from "@/components/AsyncLookupSelect.vue"
type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type OreClassPayload = {
  id?: number
  iup?: number | null
  material: number | null
  ore_class: string
  ni_min?: number | null
  ni_max?: number | null
  mgo_min?: number | null
  mgo_max?: number | null
  fe_min?: number | null
  fe_max?: number | null
  status?: boolean | null
}

type OreClassFormState = {
  id?: number
  iup: number | null
  material: number | null
  ore_class: string
  ni_min: string
  ni_max: string
  mgo_min: string
  mgo_max: string
  fe_min: string
  fe_max: string
  status: boolean
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: Record<string, any> | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: OreClassPayload): void
}>()

const canChooseIup = computed(() =>
  props.role === "SYSTEM" || props.role === "MANAGEMENT"
)

const canMutate = computed(() =>
  props.role !== "GLOBAL_VIEWER"
)

const title = computed(() =>
  props.mode === "create" ? "Add Ore Class" : "Edit Ore Class"
)

const local = ref<OreClassFormState>({
  id: undefined,
  iup: null,
  material: null,
  ore_class: "",
  ni_min: "",
  ni_max: "",
  mgo_min: "",
  mgo_max: "",
  fe_min: "",
  fe_max: "",
  status: true,
})

function toNumberOrNull(v: any): number | null {
  if (v === "" || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function toStringNumber(v: any): string {
  return v == null ? "" : String(v)
}

function normalizeId(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v?.value ?? v?.id ?? v)
  return Number.isFinite(n) ? n : null
}

function normalizeStatusToBool(v: any): boolean {
  return !(v === 0 || v === "0" || v === false)
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

function submit() {
  const payload: OreClassPayload = {
    id: local.value.id,
    material: local.value.material,
    ore_class: local.value.ore_class.trim().toUpperCase(),
    ni_min: toNumberOrNull(local.value.ni_min),
    ni_max: toNumberOrNull(local.value.ni_max),
    mgo_min: toNumberOrNull(local.value.mgo_min),
    mgo_max: toNumberOrNull(local.value.mgo_max),
    fe_min: toNumberOrNull(local.value.fe_min),
    fe_max: toNumberOrNull(local.value.fe_max),
    status: local.value.status,
  }

  if (canChooseIup.value) {
    payload.iup = local.value.iup
  }

  emit("submit", payload)
}

watch(
  () => props.open,
  (open) => {
    if (!open) return

    local.value = {
      id: props.initial?.id,
      iup: normalizeId(props.initial?.iup ?? props.initial?.iup_id),
      material: normalizeId(props.initial?.material ?? props.initial?.material_id),
      ore_class: props.initial?.ore_class ?? "",
      ni_min: toStringNumber(props.initial?.ni_min),
      ni_max: toStringNumber(props.initial?.ni_max),
      mgo_min: toStringNumber(props.initial?.mgo_min),
      mgo_max: toStringNumber(props.initial?.mgo_max),
      fe_min: toStringNumber(props.initial?.fe_min),
      fe_max: toStringNumber(props.initial?.fe_max),
      status: normalizeStatusToBool(props.initial?.status),
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <!-- IUP -->
        <div v-if="canChooseIup" class="grid gap-2">
          <label class="text-sm font-medium">IUP</label>
         <SelectLookup
            :key="`iup-${props.mode}-${local.id ?? 'new'}`"
            v-model="local.iup"
            label="IUP"
            endpoint="/api/master/lookups/mine-iup/"
            variant="field"
            label-key="iup_name"
            value-key="id"
            :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('iup')" class="text-sm text-destructive">
            {{ fieldError('iup') }}
          </p>
        </div>

        <!-- Material -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Material</label>
          <SelectLookup
            :key="`material-${props.mode}-${local.id ?? 'new'}`"
            v-model="local.material"
            label="Material"
            endpoint="/api/master/lookups/material/"
            variant="field"
            :selectedLabel="props.initial?.material_name ?? props.initial?.material_code ?? null"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('material')" class="text-sm text-destructive">
            {{ fieldError('material') }}
          </p>
        </div>

        <!-- Ore Class -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Ore Class</label>
          <Input v-model="local.ore_class" placeholder="e.g. LGSO" :disabled="!canMutate" />
          <p v-if="fieldError('ore_class')" class="text-sm text-destructive">
            {{ fieldError('ore_class') }}
          </p>
        </div>

        <!-- Ni -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Ni Min</label>
            <Input v-model="local.ni_min" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('ni_min')" class="text-sm text-destructive">
              {{ fieldError('ni_min') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Ni Max</label>
            <Input v-model="local.ni_max" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('ni_max')" class="text-sm text-destructive">
              {{ fieldError('ni_max') }}
            </p>
          </div>
        </div>

        <!-- MgO -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">MgO Min</label>
            <Input v-model="local.mgo_min" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('mgo_min')" class="text-sm text-destructive">
              {{ fieldError('mgo_min') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">MgO Max</label>
            <Input v-model="local.mgo_max" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('mgo_max')" class="text-sm text-destructive">
              {{ fieldError('mgo_max') }}
            </p>
          </div>
        </div>

        <!-- Fe -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Fe Min</label>
            <Input v-model="local.fe_min" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('fe_min')" class="text-sm text-destructive">
              {{ fieldError('fe_min') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Fe Max</label>
            <Input v-model="local.fe_max" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('fe_max')" class="text-sm text-destructive">
              {{ fieldError('fe_max') }}
            </p>
          </div>
        </div>

        <!-- Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="local.status" @update:model-value="(v) => (local.status = v === true)"
              :disabled="!canMutate" />
            Active
          </label>
        </div>

        <!-- Errors -->
        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError('non_field_errors') }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError('detail') }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          Cancel
        </Button>

        <Button v-if="canMutate" :disabled="loading ||
          !local.ore_class.trim() ||
          !local.material ||
          (canChooseIup && !local.iup)
          " @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>