<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

type MaterialPayload = {
  id?: number
  name: string
  is_ore: boolean
  is_production: boolean
  sale_adjust?: string | null
  description?: string | null
}

type MaterialFormState = {
  id?: number
  name: string
  is_ore: boolean
  is_production: boolean
  sale_adjust: string
  description: string
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
  is_ore: false,
  is_production: true,
  sale_adjust: '',
  description: '',
})
watch(
  () => props.open,
  (v) => {
    if (!v) return
    local.value = {
      id: props.initial?.id,
      name: props.initial?.name ?? '',
      is_ore: props.initial?.is_ore ?? false,
      is_production: props.initial?.is_production ?? true,
      sale_adjust: props.initial?.sale_adjust ?? '',
      description: props.initial?.description ?? '',
    }
  },
  { immediate: true }
)

const title = computed(() => (props.mode === 'create' ? 'Add Material' : 'Edit Material'))

const close = () => emit('update:open', false)

const submit = () => {
  const name = local.value.name.trim()
  const is_ore = local.value.is_ore
  const is_production = local.value.is_production
  const desc = local.value.description.trim()
  const saleAdjust = local.value.sale_adjust.trim()

  emit('submit', {
    id: local.value.id,
    name,
    is_ore: local.value.is_ore,
    is_production: local.value.is_production,
    sale_adjust: saleAdjust === '' ? null : saleAdjust.toUpperCase(),
    description: desc === '' ? null : desc,
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

        <div class="grid gap-3 rounded-lg border p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <label class="text-sm font-medium">Production Material</label>
              <p class="text-xs text-muted-foreground">
                go to production/mining summary.
              </p>
            </div>

            <Checkbox v-model="local.is_production" />
          </div>

          <div class="flex items-center justify-between gap-3">
            <div>
              <label class="text-sm font-medium">Ore Material</label>
              <p class="text-xs text-muted-foreground">
                LIM/SAP to ore, OB/Waste non-ore.
              </p>
            </div>

            <Checkbox v-model="local.is_ore" />
          </div>
          
          <div class="grid gap-2">
            <label class="text-sm font-medium">Sale Adjust</label>
            <Input
              v-model="local.sale_adjust"
              placeholder="e.g. HPAL / RKEF"
            />
            <p class="text-xs text-muted-foreground">
              Used for quality/selling mapping. Example: LIM → HPAL, SAP → RKEF.
            </p>
            <p v-if="fieldError('sale_adjust')" class="text-sm text-destructive">
              {{ fieldError('sale_adjust') }}
            </p>
          </div>
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
        <Button :disabled="loading || !local.name.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
