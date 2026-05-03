<template>
  <Select v-model="internalValue">
    <SelectTrigger class="w-52">
      <SelectValue :placeholder="selectedLabel || 'Select Week'" />
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectLabel>Weeks</SelectLabel>
        <SelectItem
          v-for="week in weeks"
          :key="week.value"
          :value="week.value"
        >
          {{ week.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
defineOptions({ name: 'WeekPicker' })

import { ref, watch, computed } from 'vue'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel
} from '@/components/ui/select'

const props = defineProps<{
  modelValue?: string
  year?: number
  month?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const internalValue = ref<string>(props.modelValue || '')

watch(() => props.modelValue, (val) => {
  internalValue.value = val || ''
})

watch(internalValue, (val) => {
  emit('update:modelValue', val)
})

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short'
  }).format(date)
}

function getISOWeekInfo(date: Date) {
  const target = new Date(date)
  const day = target.getDay() || 7
  target.setDate(target.getDate() + 4 - day)

  const yearStart = new Date(target.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7))

  const isoYear = target.getFullYear()
  return {
    isoYear,
    isoWeek: weekNo
  }
}

function getStartOfISOWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfISOWeek(date: Date) {
  const d = getStartOfISOWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function getWeeksInMonth(year: number, month: number) {
  const items: { value: string; label: string }[] = []
  const seen = new Set<string>()

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  let current = new Date(firstDay)

  while (current <= lastDay) {
    const { isoYear, isoWeek } = getISOWeekInfo(current)
    const value = `${isoYear}-${String(isoWeek).padStart(2, '0')}`

    if (!seen.has(value)) {
      const startWeek = getStartOfISOWeek(current)
      const endWeek = getEndOfISOWeek(current)

      items.push({
        value,
        label: `Week ${isoWeek} (${formatDate(startWeek)} – ${formatDate(endWeek)})`
      })

      seen.add(value)
    }

    current.setDate(current.getDate() + 1)
  }

  return items
}

const weeks = computed(() => {
  if (!props.year || !props.month) return []
  return getWeeksInMonth(props.year, props.month)
})

const selectedLabel = computed(() =>
  weeks.value.find(w => w.value === internalValue.value)?.label
)
</script>