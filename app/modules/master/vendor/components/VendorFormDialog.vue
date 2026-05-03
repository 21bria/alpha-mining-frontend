<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type VendorPayload = {
  id?: number
  code: string
  vendor_name: string
  description?: string | null
}

type VendorFormState = {
  id?: number
  code: string
  vendor_name: string
  description: string // UI selalu string (Textarea aman)
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: VendorPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: VendorPayload): void
}>()

const local = ref<VendorFormState>({
  code: '',
  vendor_name: '',
  description: '',
})

watch(
  () => props.open,
  (v) => {
    if (!v) return
    local.value = {
      id: props.initial?.id,
      code: props.initial?.code ?? '',
      vendor_name: props.initial?.vendor_name ?? '',
      description: props.initial?.description ?? '', // null -> ''
    }
  },
  { immediate: true }
)

const title = computed(() => (props.mode === 'create' ? 'Add Material' : 'Edit Material'))

const close = () => emit('update:open', false)

const submit = () => {
  const code = local.value.code.trim()
  const vendor_name = local.value.vendor_name.trim()
  const desc = local.value.description.trim()

  emit('submit', {
    id: local.value.id,
    code,
    vendor_name,
    description: desc === '' ? null : desc, // kosong -> null
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
          <Input v-model="local.code" placeholder="e.g. VND-001" />
          <p v-if="fieldError('code')" class="text-sm text-destructive">
            {{ fieldError('code') }}
          </p>
        </div>
      
      <div class="grid gap-2">
        <label class="text-sm font-medium">Vendor Name</label>
        <Input v-model="local.vendor_name" placeholder="e.g. VENDOR A" />
        <p v-if="fieldError('vendor_name')" class="text-sm text-destructive">
          {{ fieldError('vendor_name') }}
        </p>
      </div>

      <div class="grid gap-2">
        <label class="text-sm font-medium">Description</label>
        <Textarea v-model="local.description" placeholder="Optional..." />
        <p v-if="fieldError('description')" class="text-sm text-destructive">
          {{ fieldError('description') }}
        </p>
      </div>

      <!-- general errors -->
      <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
        {{ fieldError('non_field_errors') }}
      </p>
      <p v-if="fieldError('detail')" class="text-sm text-destructive">
        {{ fieldError('detail') }}
      </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="loading || !local.code.trim() || !local.vendor_name.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
