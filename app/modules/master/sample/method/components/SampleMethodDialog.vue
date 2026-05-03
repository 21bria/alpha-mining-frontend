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
import SelectLookup from "@/components/AsyncLookupSelect.vue"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type SampleMethodPayload = {
  id?: number
  sample_type: number | null
  sample_method: string
  description?: string | null
  status?: number | null
}

type SampleMethodFormState = {
  id?: number
  sample_type: number | null
  sample_method: string
  description: string
  status: string
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
  (e: "submit", payload: SampleMethodPayload): void
}>()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Sample Method" : "Edit Sample Method"
)

const statusOptions = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
]

const local = ref<SampleMethodFormState>({
  id: undefined,
  sample_type: null,
  sample_method: "",
  description: "",
  status: "1",
})

function normalizeId(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v?.value ?? v?.id ?? v)
  return Number.isFinite(n) ? n : null
}

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
  const payload: SampleMethodPayload = {
    id: local.value.id,
    sample_type: local.value.sample_type,
    sample_method: local.value.sample_method.trim(),
    description: local.value.description.trim() || null,
    status: toNumberOrNull(local.value.status),
  }

  emit("submit", payload)
}

watch(
  () => props.open,
  (open) => {
    if (!open) return

    local.value = {
      id: props.initial?.id,
      sample_type: normalizeId(props.initial?.sample_type ?? props.initial?.sample_type_id),
      sample_method: props.initial?.sample_method ?? "",
      description: props.initial?.description ?? "",
      status: String(props.initial?.status ?? 1),
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
          <SelectLookup :key="`sample-type-${props.mode}-${local.id ?? 'new'}`" v-model="local.sample_type"
            label="Sample Type" endpoint="/api/master/lookups/sample-type/" variant="field" label-key="type_sample"
            value-key="id" :selectedLabel="props.initial?.sample_type_name ?? props.initial?.type_sample ?? null"
            :disabled="!canMutate" />
          <p v-if="fieldError('sample_type')" class="text-sm text-destructive">
            {{ fieldError('sample_type') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Sample Method</label>
          <Input v-model="local.sample_method" placeholder="Enter sample method" :disabled="!canMutate" />
          <p v-if="fieldError('sample_method')" class="text-sm text-destructive">
            {{ fieldError('sample_method') }}
          </p>
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

        <Button v-if="canMutate" :disabled="loading || !local.sample_type || !local.sample_method.trim()"
          @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>