<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

type CheckState = boolean | "indeterminate"

type FactoriesPayload = {
  id?: number
  factory_stock: string
  description?: string | null
  status?: number | null
}

type FactoriesFormState = {
  id?: number
  factory_stock: string
  description: string
  status: boolean
}

function normalizeStatusToBool(v: unknown): boolean {
  if (v === 1 || v === "1" || v === true) return true
  if (v === 0 || v === "0" || v === false) return false
  return true
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: FactoriesPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: FactoriesPayload): void
}>()

const local = ref<FactoriesFormState>({
  factory_stock: '',
  description: '',
  status: true,
})

watch(
  () => props.open,
  (v) => {
    if (!v) return

    local.value = {
      id: props.initial?.id,
      factory_stock: props.initial?.factory_stock ?? '',
      description: props.initial?.description ?? '',
      status: normalizeStatusToBool(props.initial?.status),
    }
  },
  { immediate: true }
)

const title = computed(() =>
  props.mode === 'create' ? 'Add Factories' : 'Edit Factories'
)

const close = () => emit('update:open', false)

function onStatusChange(v: CheckState) {
  local.value.status = v === true
}

const submit = () => {
  const factory_stock = local.value.factory_stock.trim()
  const desc = local.value.description.trim()

  emit('submit', {
    id: local.value.id,
    factory_stock,
    description: desc === '' ? null : desc,
    status: local.value.status ? 1 : 0,
  })
}

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Name</label>
          <Input v-model="local.factory_stock" placeholder="e.g. HNYC" />
          <p v-if="fieldError('factory_stock')" class="text-sm text-destructive">
            {{ fieldError('factory_stock') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Optional..." />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="local.status" @update:model-value="onStatusChange" />
            Active
          </label>
        </div>

        <p v-if="fieldError('status')" class="text-sm text-destructive">
          {{ fieldError('status') }}
        </p>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError('non_field_errors') }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError('detail') }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="loading || !local.factory_stock.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>