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

export type FillFactorsPayload = {
  id?: number
  iup?: number | null
  material: number | null
  type_tf: string
  ton?: number | null
  bcm?: number | null
  density?: number | null
  status?: number | null
}

type FillFactorsFormState = {
  id?: number
  iup: number | null
  material: number | null
  type_tf: string
  ton: string
  bcm: string
  density: string
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
  (e: "submit", payload: FillFactorsPayload): void
}>()

const canChooseIup = computed(() =>
  props.role === "SYSTEM" || props.role === "MANAGEMENT"
)

const canMutate = computed(() =>
  props.role !== "GLOBAL_VIEWER"
)

const title = computed(() =>
  props.mode === "create" ? "Add Truck Factors" : "Edit Truck Factors"
)

const local = ref<FillFactorsFormState>({
  id: undefined,
  iup: null,
  material: null,
  type_tf: "",
  ton: "",
  bcm: "",
  density: "",
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

function boolToInt(v: boolean): number {
  return v ? 1 : 0
}

function submit() {
  const payload: FillFactorsPayload = {
    id: local.value.id,
    material: local.value.material,
    type_tf: local.value.type_tf.trim().toUpperCase(),
    ton: toNumberOrNull(local.value.ton),
    bcm: toNumberOrNull(local.value.bcm),
    density: toNumberOrNull(local.value.density),
    status: boolToInt(local.value.status),
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
      type_tf: props.initial?.type_tf ?? "",
      ton: toStringNumber(props.initial?.ton),
      bcm: toStringNumber(props.initial?.bcm),
      density: toStringNumber(props.initial?.density),
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
          <SelectLookup :key="`iup-${props.mode}-${local.id ?? 'new'}`"
            v-model="local.iup" label="IUP"
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
            :depends="{ categories: 'ore' }"
            :selectedLabel="props.initial?.material_name ?? props.initial?.material_code ?? null"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('material')" class="text-sm text-destructive">
            {{ fieldError('material') }}
          </p>
        </div>

        <!-- Ore Class -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">Type Truck</label>
          <Input v-model="local.type_tf" placeholder="e.g. DT20" :disabled="!canMutate" />
          <p v-if="fieldError('type_tf')" class="text-sm text-destructive">
            {{ fieldError('type_tf') }}
          </p>
        </div>

        <!-- Factors -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Bcm</label>
            <Input v-model="local.bcm" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('bcm')" class="text-sm text-destructive">
              {{ fieldError('bcm') }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">density</label>
            <Input v-model="local.density" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('density')" class="text-sm text-destructive">
              {{ fieldError('density') }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium">Ton</label>
            <Input v-model="local.ton" type="number" step="any" :disabled="!canMutate" />
            <p v-if="fieldError('ton')" class="text-sm text-destructive">
              {{ fieldError('ton') }}
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
          !local.type_tf.trim() ||
          !local.material ||
          (canChooseIup && !local.iup)
          " @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>