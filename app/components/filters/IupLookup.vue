<!-- components/filters/IupLookup.vue -->
<template>
  <div class="w-56 space-y-2">
    <label v-if="showLabel" class="text-sm font-medium">
      {{ label }}
    </label>

    <SelectLookup
      v-model="localValue"
      endpoint="/api/master/lookups/mine-iup/"
      :label="label"
      :variant="variant"
      :label-key="labelKey"
      value-key="id"
      :placeholder="placeholder"
      :selectedLabel="resolvedSelectedLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SelectLookup from '@/components/form/LookupSelect.vue'

type LookupVariant = 'field' | 'compact'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  placeholder?: string
  labelKey?: 'iup_code' | 'iup_name'
  variant?: LookupVariant
  selectedLabel?: string | null
  showLabel?: boolean
}>(), {
  label: 'IUP',
  placeholder: 'Select IUP',
  labelKey: 'iup_name',
  variant: 'field',
  selectedLabel: null,
  showLabel: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const localValue = computed<number | null>({
  get: () => props.modelValue ?? null,
  set: (value) => emit('update:modelValue', value)
})

const resolvedSelectedLabel = computed<string | null>(() => {
  return props.selectedLabel || null
})
</script>