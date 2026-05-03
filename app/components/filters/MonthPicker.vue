<template>
  <Select v-model="internalValue" @update:modelValue="emit('update:modelValue', parseInt($event))">
    <SelectTrigger class="w-40">
      <SelectValue placeholder="Select Month" />
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectLabel>Months</SelectLabel>
        <SelectItem v-for="(month, index) in months" :key="index" :value="String(index + 1)">
          {{ month }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
defineOptions({ name: 'MonthPicker' })

import { ref, watch } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Props: pakai number karena kamu ingin emit value angka (1–12)
const props = defineProps<{
  modelValue?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const months: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Nilai internal harus string karena <Select> pakai string
const internalValue = ref<string>(String(props.modelValue ?? new Date().getMonth() + 1))

// Sync prop ke internalValue
watch(() => props.modelValue, (val) => {
  if (val !== undefined && val !== null) {
    const stringVal = String(val)
    if (stringVal !== internalValue.value) {
      internalValue.value = stringVal
    }
  }
})
</script>
