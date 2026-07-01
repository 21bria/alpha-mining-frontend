<template>
 <div class="grid grid-cols-2 gap-3 items-end">

  <!-- IUP -->
  <div v-if="showIup" class="space-y-1">
    <label class="text-sm font-medium">IUP</label>
    <SelectLookup
      v-model="form.iup"
      endpoint="/api/master/lookups/mine-iup/"
      label="IUP"
      variant="field"
      label-key="iup_name"
      value-key="id"
      :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
    />
  </div>

  <!-- Date -->
  <div class="space-y-1">
    <label class="text-sm font-medium">Date</label>
    <DatePicker v-model="selectedDate" :single="true" class="w-full" />
  </div>

</div>

<!-- Button di bawah -->
<div class="mt-3">
  <Button @click="emitFilters" :disabled="!isValid">
    Filter
  </Button>
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DatePicker from '@/components/filters/DatePicker.vue'
import SelectLookup from '@/components/form/LookupSelect.vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  role?: string
  initial?: {
    iup?: number | string | null
    iup_id?: number | string | null
    iup_name?: string | null
    iup_code?: string | null
  }
}>()

const showIup = computed(() => props.role !== "SITE_USER")

function toNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

// IUP
const form = ref<{
  iup: number | null
}>({
  iup: toNumber(props.initial?.iup_id ?? props.initial?.iup),
})

// Date default today
function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const selectedDate = ref<string>(todayISO())

// validasi
const isValid = computed(() => {
  return Boolean(
    selectedDate.value &&
    (!showIup.value || form.value.iup)
  )
})

// emit
const emit = defineEmits<{
  (e: 'apply', payload: { date: string; iup_id?: number | null }): void
}>()

function emitFilters() {
  emit('apply', {
    date: selectedDate.value,
    iup_id: showIup.value ? form.value.iup : null
  })
}
</script>