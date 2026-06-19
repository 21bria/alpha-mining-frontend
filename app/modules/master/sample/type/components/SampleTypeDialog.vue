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
import { Textarea } from "@/components/ui/textarea"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Checkbox } from "@/components/ui/checkbox"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type SampleTypePayload = {
  id?: number

  type_sample: string
  batch_pattern?: string | null
  description?: string | null
  status?: number | null

  is_production: boolean
  is_geology: boolean
  is_selling: boolean
  is_monitoring: boolean
}

type SampleTypeFormState = {
  id?: number

  type_sample: string
  batch_pattern: string
  description: string
  status: string

  is_production: boolean
  is_geology: boolean
  is_selling: boolean
  is_monitoring: boolean
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
  (e: "submit", payload: SampleTypePayload): void
}>()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Sample Type" : "Edit Sample Type"
)

const statusOptions = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
]

const local = ref<SampleTypeFormState>({
  id: undefined,

  type_sample: "",
  batch_pattern: "",
  description: "",
  status: "1",

  is_production: true,
  is_geology: false,
  is_selling: false,
  is_monitoring: false,
})

function toNumberOrNull(v: any): number | null {
  if (v === "" || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

function submit() {
  const payload: SampleTypePayload = {
  id: local.value.id,

  type_sample: local.value.type_sample.trim(),
  batch_pattern: local.value.batch_pattern.trim() || null,
  description: local.value.description.trim() || null,
  status: toNumberOrNull(local.value.status),

  is_production: local.value.is_production,
  is_geology: local.value.is_geology,
  is_selling: local.value.is_selling,
  is_monitoring: local.value.is_monitoring,
}

  emit("submit", payload)
}

watch(
  () => props.open,
  (open) => {
    if (!open) return

    local.value = {
      id: props.initial?.id,

      type_sample: props.initial?.type_sample ?? "",
      batch_pattern: props.initial?.batch_pattern ?? "",
      description: props.initial?.description ?? "",
      status: String(props.initial?.status ?? 1),

      is_production: props.initial?.is_production ?? true,
      is_geology: props.initial?.is_geology ?? false,
      is_selling: props.initial?.is_selling ?? false,
      is_monitoring: props.initial?.is_monitoring ?? false,
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
          <label class="text-sm font-medium">Sample Type</label>
          <Input v-model="local.type_sample" placeholder="Enter sample type" :disabled="!canMutate" />
          <p v-if="fieldError('type_sample')" class="text-sm text-destructive">
            {{ fieldError('type_sample') }}
          </p>
        </div>

        <div class="grid gap-3 rounded-lg border p-4">
          <label class="text-sm font-semibold">
            Usage
          </label>

          <div class="grid grid-cols-2 gap-4">
           <label class="flex items-center gap-2">
            <Checkbox
              :model-value="local.is_production"
              :disabled="!canMutate"
              @update:model-value="(v) => (local.is_production = v === true)"
            />
            <span>Production</span>
          </label>

          <label class="flex items-center gap-2">
            <Checkbox
              :model-value="local.is_geology"
              :disabled="!canMutate"
              @update:model-value="(v) => (local.is_geology = v === true)"
            />
            <span>Geology</span>
          </label>

          <label class="flex items-center gap-2">
            <Checkbox
              :model-value="local.is_selling"
              :disabled="!canMutate"
              @update:model-value="(v) => (local.is_selling = v === true)"
            />
            <span>Selling</span>
          </label>

          <label class="flex items-center gap-2">
            <Checkbox
              :model-value="local.is_monitoring"
              :disabled="!canMutate"
              @update:model-value="(v) => (local.is_monitoring = v === true)"
            />
            <span>Monitoring</span>
          </label>
          </div>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Status</label>
          <Select v-model="local.status" :disabled="!canMutate">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="fieldError('status')" class="text-sm text-destructive">
            {{ fieldError('status') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">
            Batch Pattern
          </label>

          <Input
            v-model="local.batch_pattern"
            placeholder="{type}{material}{truck}{point}{batch}"
          />

          <p class="text-xs text-muted-foreground">
            Available:
            {type},
            {material},
            {truck},
            {point},
            {batch},
            {increments},
            {lot}
          </p>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Description" :disabled="!canMutate" />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
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

        <Button v-if="canMutate" :disabled="loading || !local.type_sample.trim()" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>