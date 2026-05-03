<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type MaterialPayload = {
  id?: number
  name: string
  categories: string
  description?: string | null
}

type MaterialFormState = {
  id?: number
  name: string
  categories: string
  description: string // UI selalu string (Textarea aman)
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: MaterialPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: MaterialPayload): void
}>()

const local = ref<MaterialFormState>({
  name: '',
  categories: '',
  description: '',
})

watch(
  () => props.open,
  (v) => {
    if (!v) return
    local.value = {
      id: props.initial?.id,
      name: props.initial?.name ?? '',
      categories: props.initial?.categories ?? '',
      description: props.initial?.description ?? '', // null -> ''
    }
  },
  { immediate: true }
)

const title = computed(() => (props.mode === 'create' ? 'Add Material' : 'Edit Material'))

const close = () => emit('update:open', false)

const submit = () => {
  const name = local.value.name.trim()
  const categories = local.value.categories.trim()
  const desc = local.value.description.trim()

  emit('submit', {
    id: local.value.id,
    name,
    categories,
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
          <label class="text-sm font-medium">Name</label>
          <Input v-model="local.name" placeholder="e.g. Waste" />
          <p v-if="fieldError('name')" class="text-sm text-destructive">
            {{ fieldError('name') }}
          </p>
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">Category</label>

          <Select v-model="local.categories">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Ore">Ore</SelectItem>
              <SelectItem value="Non Ore">Non Ore</SelectItem>
            </SelectContent>
          </Select>

          <p v-if="fieldError('categories')" class="text-sm text-destructive">
            {{ fieldError('categories') }}
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
        <Button :disabled="loading || !local.name.trim() ||!local.categories.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
