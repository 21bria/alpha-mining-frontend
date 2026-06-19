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

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type ProductionConfigPayload = {
  id?: number
  key: string
  value: number | null
  is_active: boolean
}

type ProductionConfigFormState = {
  id?: number
  key: string
  value: string
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
  (e: "submit", payload: ProductionConfigPayload): void
}>()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Configuration" : "Edit Configuration"
)


const local = ref<ProductionConfigFormState>({
  id: undefined,
  key: "",
  value: "",
  is_active: true,
})


function close() {
  emit("update:open", false)
}
function submit() {
  const payload: ProductionConfigPayload = {
    id: local.value.id,
    key: local.value.key.trim(),
    value:
      local.value.value === ""
        ? null
        : Number(local.value.value),
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
    key: props.initial?.key ?? "",
    value: String(props.initial?.value ?? ""),
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

     <div class="grid gap-2">
        <label class="text-sm font-medium">Key</label>
        <Input
          v-model="local.key"
          placeholder="e.g. sample_number_length"
        />
      </div>

      <div class="grid gap-2">
        <label class="text-sm font-medium">Value</label>
        <Input
          v-model="local.value"
          type="number"
          placeholder="e.g. 10"
        />
      </div>

      <div class="flex items-center justify-between rounded-lg border p-4">
        <div>
          <label class="text-sm font-medium">Active</label>
          <p class="text-xs text-muted-foreground">
            Enable this configuration.
          </p>
        </div>

        <Checkbox
          :model-value="local.is_active"
          @update:model-value="(v) => (local.is_active = v === true)"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          Cancel
        </Button>

        <Button v-if="canMutate" :disabled="loading || !local.key.trim()" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>