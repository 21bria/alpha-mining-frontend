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

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type SampleTypePayload = {
  id?: number
  type_sample: string
  category?: string | null
  description?: string | null
  status?: number | null
}

type SampleTypeFormState = {
  id?: number
  type_sample: string
  category: string
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
  category: "",
  description: "",
  status: "1",
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
    category: local.value.category.trim() || null,
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
      type_sample: props.initial?.type_sample ?? "",
      category: props.initial?.category ?? "",
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
          <Input v-model="local.type_sample" placeholder="Enter sample type" :disabled="!canMutate" />
          <p v-if="fieldError('type_sample')" class="text-sm text-destructive">
            {{ fieldError('type_sample') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Category</label>
          <Input v-model="local.category" placeholder="Enter category" :disabled="!canMutate" />
          <p v-if="fieldError('category')" class="text-sm text-destructive">
            {{ fieldError('category') }}
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

        <Button v-if="canMutate" :disabled="loading || !local.type_sample.trim()" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>