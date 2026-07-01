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
import LookupSelect from "@/components/form/LookupSelect.vue"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type QualityConfigPayload = {
  id?: number
  name: string
  adjust_sale: string
  material: number | null
  selling_sample_type: number | null
  monitoring_sample_type: number | null
  is_active: boolean
}

type QualityConfigFormState = {
  id?: number
  name: string
  adjust_sale: string
  material: number | null
  selling_sample_type: number | null
  monitoring_sample_type: number | null
  is_active: boolean
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
  (e: "submit", payload: QualityConfigPayload): void
}>()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Quality Config" : "Edit Quality Config"
)

const local = ref<QualityConfigFormState>({
  id: undefined,
  name: "",
  adjust_sale: "",
  material: null,
  selling_sample_type: null,
  monitoring_sample_type: null,
  is_active: true,
})

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

function submit() {
  const payload: QualityConfigPayload = {
    id: local.value.id,
    name: local.value.name.trim(),
    adjust_sale: local.value.adjust_sale.trim().toUpperCase(),
    material: local.value.material,
    selling_sample_type: local.value.selling_sample_type,
    monitoring_sample_type: local.value.monitoring_sample_type,
    is_active: local.value.is_active,
  }

  emit("submit", payload)
}

watch(
  () => props.open,
  (open) => {
    if (!open) return

    local.value = {
      id: props.initial?.id,
      name: props.initial?.name ?? "",
      adjust_sale: props.initial?.adjust_sale ?? "",
      material: props.initial?.material ?? null,
      selling_sample_type: props.initial?.selling_sample_type ?? null,
      monitoring_sample_type: props.initial?.monitoring_sample_type ?? null,
      is_active: props.initial?.is_active ?? true,
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
        <div class="grid gap-2">
          <label class="text-sm font-medium">Name</label>
          <Input
            v-model="local.name"
            placeholder="e.g. HPAL Quality"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('name')" class="text-sm text-destructive">
            {{ fieldError('name') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Adjust Sale</label>
          <Input
            v-model="local.adjust_sale"
            placeholder="e.g. HPAL / RKEF"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('adjust_sale')" class="text-sm text-destructive">
            {{ fieldError('adjust_sale') }}
          </p>
        </div>

        <div class="grid gap-2">
          <LookupSelect
            v-model="local.material"
            label="Material"
            endpoint="/api/master/lookups/material/"
            value-key="id"
            label-key="name"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('material')" class="text-sm text-destructive">
            {{ fieldError('material') }}
          </p>
        </div>

        <div class="grid gap-2">
          <LookupSelect
            v-model="local.selling_sample_type"
            label="Selling Sample Type"
            endpoint="/api/master/lookups/sample-type/"
            value-key="id"
            label-key="type_sample"
            :query="{ is_selling: true }"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('selling_sample_type')" class="text-sm text-destructive">
            {{ fieldError('selling_sample_type') }}
          </p>
        </div>

        <div class="grid gap-2">
          <LookupSelect
            v-model="local.monitoring_sample_type"
            label="Monitoring Sample Type"
            endpoint="/api/master/lookups/sample-type/"
            value-key="id"
            label-key="type_sample"
            :query="{ is_monitoring: true }"
            :disabled="!canMutate"
          />
          <p v-if="fieldError('monitoring_sample_type')" class="text-sm text-destructive">
            {{ fieldError('monitoring_sample_type') }}
          </p>
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <label class="text-sm font-medium">Active</label>
            <p class="text-xs text-muted-foreground">
              Enable this quality mapping.
            </p>
          </div>

          <Checkbox
            :model-value="local.is_active"
            :disabled="!canMutate"
            @update:model-value="(v) => (local.is_active = v === true)"
          />
        </div>

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

        <Button
          v-if="canMutate"
          :disabled="loading || !local.name.trim() || !local.adjust_sale.trim()"
          @click="submit"
        >
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>