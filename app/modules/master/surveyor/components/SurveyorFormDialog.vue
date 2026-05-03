<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

type CheckState = boolean | "indeterminate"

type SurveyorPayload = {
  id?: number
  code_surveyor: string
  name_surveyor: string
  description?: string | null
  status?: number | null
}

type SurveyorFormState = {
  id?: number
  code_surveyor: string
  name_surveyor: string
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
  initial?: SurveyorPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: SurveyorPayload): void
}>()

const local = ref<SurveyorFormState>({
  code_surveyor: '',
  name_surveyor: '',
  description: '',
  status: true,
})

watch(
  () => props.open,
  (v) => {
    if (!v) return

    local.value = {
      id: props.initial?.id,
      code_surveyor: props.initial?.code_surveyor ?? '',
      name_surveyor: props.initial?.code_surveyor ?? '',
      description: props.initial?.description ?? '',
      status: normalizeStatusToBool(props.initial?.status),
    }
  },
  { immediate: true }
)

const title = computed(() =>
  props.mode === 'create' ? 'Add Surveyor' : 'Edit Surveyor'
)

const close = () => emit('update:open', false)

function onStatusChange(v: CheckState) {
  local.value.status = v === true
}

const submit = () => {
  const code_surveyor = local.value.code_surveyor.trim()
  const name_surveyor = local.value.name_surveyor.trim()
  const desc = local.value.description.trim()

  emit('submit', {
    id: local.value.id,
    code_surveyor,
    name_surveyor,
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
          <label class="text-sm font-medium">Code</label>
          <Input v-model="local.code_surveyor" placeholder="e.g. SRV-001" />
          <p v-if="fieldError('code_surveyor')" class="text-sm text-destructive">
            {{ fieldError('code_surveyor') }}
          </p>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Name</label>
          <Input v-model="local.name_surveyor" />
          <p v-if="fieldError('name_surveyor')" class="text-sm text-destructive">
            {{ fieldError('name_surveyor') }}
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
        <Button :disabled="loading || !local.code_surveyor.trim()|| !local.name_surveyor.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>