<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type IUPPayload = {
  id?: number
  iup_code: string
  iup_name: string
  center_lat?: number | null
  center_lng?: number | null
  default_zoom?: number | null
}

type IUPFormState = {
  id?: number
  iup_code: string
  iup_name: string
  center_lat: string // UI string biar gampang input
  center_lng: string
  default_zoom: string
}

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: IUPPayload | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'submit', payload: IUPPayload): void
}>()

const local = ref<IUPFormState>({
  iup_code: '',
  iup_name: '',
  center_lat: '',
  center_lng: '',
  default_zoom: '',
})

watch(
  () => props.open,
  (v) => {
    if (!v) return
    local.value = {
      id: props.initial?.id,
      iup_code: props.initial?.iup_code ?? '',
      iup_name: props.initial?.iup_name ?? '',
      center_lat: props.initial?.center_lat == null ? '' : String(props.initial.center_lat),
      center_lng: props.initial?.center_lng == null ? '' : String(props.initial.center_lng),
      default_zoom: props.initial?.default_zoom == null ? '' : String(props.initial.default_zoom),
    }
  },
  { immediate: true }
)

const title = computed(() => (props.mode === 'create' ? 'Add IUP' : 'Edit IUP'))

const close = () => emit('update:open', false)

const toNumberOrNull = (v: string) => {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const submit = () => {
  const iup_code = local.value.iup_code.trim()
  const iup_name = local.value.iup_name.trim()

  emit('submit', {
    id: local.value.id,
    iup_code,
    iup_name,
    center_lat: toNumberOrNull(local.value.center_lat),
    center_lng: toNumberOrNull(local.value.center_lng),
    default_zoom: toNumberOrNull(local.value.default_zoom),
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
          <label class="text-sm font-medium">IUP Code</label>
          <Input v-model="local.iup_code" placeholder="e.g. IUP-001" />
          <p v-if="fieldError('iup_code')" class="text-sm text-destructive">
            {{ fieldError('iup_code') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">IUP Name</label>
          <Input v-model="local.iup_name" placeholder="e.g. PT Kawi Site A" />
          <p v-if="fieldError('iup_name')" class="text-sm text-destructive">
            {{ fieldError('iup_name') }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium">Center Lat</label>
            <Input v-model="local.center_lat" inputmode="decimal" placeholder="-6.2" />
            <p v-if="fieldError('center_lat')" class="text-sm text-destructive">
              {{ fieldError('center_lat') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Center Lng</label>
            <Input v-model="local.center_lng" inputmode="decimal" placeholder="106.8" />
            <p v-if="fieldError('center_lng')" class="text-sm text-destructive">
              {{ fieldError('center_lng') }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Default Zoom</label>
            <Input v-model="local.default_zoom" inputmode="numeric" placeholder="10" />
            <p v-if="fieldError('default_zoom')" class="text-sm text-destructive">
              {{ fieldError('default_zoom') }}
            </p>
          </div>
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
        <Button :disabled="loading || !local.iup_code.trim() || !local.iup_name.trim()" @click="submit">
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>