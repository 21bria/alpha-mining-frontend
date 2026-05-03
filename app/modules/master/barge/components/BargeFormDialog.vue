<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

type CheckState = boolean | "indeterminate"

type BargePayload = {
  id?: number
  barge_code: string
  barge_name: string
  description?: string | null
  active?: number | null
}

type BargeFormState = {
  id?: number
  barge_code: string
  barge_name: string
  description: string
  active: boolean
}

function normalizeactiveToBool(v: unknown): boolean {
  if (v === 1 || v === "1" || v === true) return true
  if (v === 0 || v === "0" || v === false) return false
  return true
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: BargePayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: BargePayload): void
}>()

const local = ref<BargeFormState>({
  barge_code: '',
  barge_name: '',
  description: '',
  active: true,
})

watch(
  () => props.open,
  (v) => {
    if (!v) return

    local.value = {
      id: props.initial?.id,
      barge_code: props.initial?.barge_code ?? '',
      barge_name: props.initial?.barge_name ?? '',
      description: props.initial?.description ?? '',
      active: normalizeactiveToBool(props.initial?.active),
    }
  },
  { immediate: true }
)

const title = computed(() =>
  props.mode === 'create' ? 'Add Barge' : 'Edit Barge'
)

const close = () => emit('update:open', false)

function onactiveChange(v: CheckState) {
  local.value.active = v === true
}

const submit = () => {
  const barge_code = local.value.barge_code.trim()
  const barge_name = local.value.barge_name.trim()
  const desc = local.value.description.trim()

  emit('submit', {
    id: local.value.id,
    barge_code,
    barge_name,
    description: desc === '' ? null : desc,
    active: local.value.active ? 1 : 0,
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
          <label class="text-sm font-medium">Code</label>
          <Input v-model="local.barge_code" placeholder="e.g. BG-001" />
          <p v-if="fieldError('barge_code')" class="text-sm text-destructive">
            {{ fieldError('barge_code') }}
          </p>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Name</label>
          <Input v-model="local.barge_name" />
          <p v-if="fieldError('barge_name')" class="text-sm text-destructive">
            {{ fieldError('barge_name') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Optional..." />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
        </div>

        <!-- <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="local.active" @update:model-value="onactiveChange" />
            Active
          </label>
        </div> -->
        <p v-if="fieldError('active')" class="text-sm text-destructive">
          {{ fieldError('active') }}
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
        <Button :disabled="loading || !local.barge_code.trim()|| !local.barge_name.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>