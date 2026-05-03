<template>
  <Select v-model="internalValue" @update:modelValue="emit('update:modelValue', parseInt($event))">
    <SelectTrigger class="w-40">
      <SelectValue placeholder="Select Year" />
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectLabel>Years</SelectLabel>
        <SelectItem v-for="year in years" :key="year" :value="String(year)">
          {{ year }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
defineOptions({ name: 'YearPicker' })

import { ref, computed, watch } from 'vue'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select'

// Props dan emit
const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const currentYear = new Date().getFullYear()
const years = computed(() =>
  Array.from({ length: 3 }, (_, i) => currentYear - i)
)

// internalValue sebagai string (karena <Select> pakai string)
const internalValue = ref<string>(String(props.modelValue ?? currentYear))

watch(() => props.modelValue, (val) => {
  const stringVal = String(val)
  if (val !== undefined && stringVal !== internalValue.value) {
    internalValue.value = stringVal
  }
})
</script>
