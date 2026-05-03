<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type UnitsCategoriesPayload = {
  id?: number
  category: string
}

type UnitsCategoriesFormState = {
  id?: number
  category: string
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: UnitsCategoriesPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: UnitsCategoriesPayload): void
}>()

const local = ref<UnitsCategoriesFormState>({
  category: '',
})

watch(
  () => props.open,
  (v) => {
    if (!v) return
    local.value = {
      id: props.initial?.id,
      category: props.initial?.category ?? '',
    }
  },
  { immediate: true }
)

const title = computed(() => (props.mode === 'create' ? 'Add Categories' : 'Edit Categories'))

const close = () => emit('update:open', false)

const submit = () => {
  const category = local.value.category.trim()
  emit('submit', {
    id: local.value.id,
    category,
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
          <label class="text-sm font-medium">Category</label>
          <Input v-model="local.category" placeholder="e.g. Digger" />
          <p v-if="fieldError('category')" class="text-sm text-destructive">
            {{ fieldError('category') }}
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
        <Button :disabled="loading || !local.category.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
