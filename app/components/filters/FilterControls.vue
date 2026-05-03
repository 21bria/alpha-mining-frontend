<template>
  <div class="flex flex-wrap gap-3 items-center">
    <IupLookup v-if="showIup" v-model="selectedIup" label="IUP" label-key="iup_code" />

    <Select v-model="filterType">
      <SelectTrigger class="w-40">
        <SelectValue placeholder="Select Filter Type" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Filter Type</SelectLabel>

          <SelectItem v-for="option in filterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>

    <YearPicker v-if="showYear" v-model="selectedYear" />

    <MonthPicker v-if="showMonth" v-model="selectedMonth" />

    <WeekPicker v-if="showWeek" v-model="selectedWeek" :year="selectedYear" :month="selectedMonth" />

    <DatePicker v-if="filterType === 'range'" v-model="selectedRange" />

    <DatePicker v-if="filterType === 'daily'" v-model="selectedDate" :single="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel
} from '@/components/ui/select'

import IupLookup from '@/components/filters/IupLookup.vue'
import YearPicker from '@/components/filters/YearPicker.vue'
import MonthPicker from '@/components/filters/MonthPicker.vue'
import WeekPicker from '@/components/filters/WeekPicker.vue'
import DatePicker from '@/components/filters/DatePicker.vue'

import { useChartFilterStore } from '~/stores/filters/chart-filter'

type FilterOption = {
  value: FilterType
  label: string
}

type FilterType = 'all' | 'yearly' | 'monthly' | 'weekly' | 'range' | 'daily'

const props = defineProps<{
  role?: string
}>()

const emit = defineEmits<{
  (e: 'apply', payload: {
    type: FilterType
    year: number | undefined
    month: number | undefined
    week: string | undefined
    range: { start: string; end: string }
    date: string
    iup_id: string | null
  }): void
}>()

const chartFilter = useChartFilterStore()

const filterOptions: FilterOption[] = [
  { value: 'all', label: 'All Data' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'range', label: 'Range' },
  { value: 'daily', label: 'Daily' }
]

const filterType = ref<FilterType>('monthly')
const selectedIup = ref<number | null>(null)
const selectedYear = ref<number | undefined>(new Date().getFullYear())
const selectedMonth = ref<number | undefined>(new Date().getMonth() + 1)
const selectedWeek = ref<string | undefined>(undefined)
const selectedRange = ref<{ start: string; end: string }>({
  start: '',
  end: ''
})
const selectedDate = ref<string>('')

const isSyncingFromStore = ref(false)

const showIup = computed(() => props.role !== 'SITE_USER')
const showYear = computed(() => ['yearly', 'monthly', 'weekly'].includes(filterType.value))
const showMonth = computed(() => ['monthly', 'weekly'].includes(filterType.value))
const showWeek = computed(() => filterType.value === 'weekly')

function normalizeMonth(value: any): number | undefined {
  if (!value) return undefined

  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  if (typeof value === 'object') {
    const parsed = Number(value.value ?? value.month ?? value.id)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function emitFilters() {
  const payload = {
    type: filterType.value,
    year: selectedYear.value,
    month: selectedMonth.value,
    week: selectedWeek.value,
    range: selectedRange.value,
    date: selectedDate.value,
    iup_id: selectedIup.value !== null ? String(selectedIup.value) : null
  }

  emit('apply', payload)

  chartFilter.apply(payload)
}

/**
 * Reset field yang tidak dipakai ketika tipe filter berubah.
 */
watch(filterType, () => {
  if (isSyncingFromStore.value) return

  if (!['weekly', 'monthly', 'yearly'].includes(filterType.value)) {
    selectedYear.value = undefined
  }

  if (!['weekly', 'monthly'].includes(filterType.value)) {
    selectedMonth.value = undefined
  }

  if (filterType.value !== 'weekly') {
    selectedWeek.value = undefined
  }

  if (filterType.value !== 'range') {
    selectedRange.value = {
      start: '',
      end: ''
    }
  }

  if (filterType.value !== 'daily') {
    selectedDate.value = ''
  }
})

/**
 * Sync dari store ke local state.
 * Ini penting saat halaman dibuka dari URL:
 * /productions?filter_type=monthly&year=2026&month=2
 */
watch(
  () => ({
    type: chartFilter.type,
    year: chartFilter.year,
    month: chartFilter.month,
    week: chartFilter.week,
    range: chartFilter.range,
    date: chartFilter.date,
    iup_id: chartFilter.iup_id
  }),
  (value) => {
    isSyncingFromStore.value = true

    if (value.type) {
      filterType.value = value.type as FilterType
    }

    selectedYear.value = value.year ?? undefined
    selectedMonth.value = normalizeMonth(value.month)
    selectedWeek.value = value.week ?? undefined

    selectedRange.value = {
      start: value.range?.start || '',
      end: value.range?.end || ''
    }

    selectedDate.value = value.date || ''
    selectedIup.value = value.iup_id ? Number(value.iup_id) : null

    queueMicrotask(() => {
      isSyncingFromStore.value = false
    })
  },
  {
    deep: true,
    immediate: true
  }
)

/**
 * Auto apply setiap user mengubah filter.
 * Ini pengganti tombol Filter yang sudah kamu comment.
 */
watch(
  [
    filterType,
    selectedIup,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedRange,
    selectedDate
  ],
  () => {
    if (isSyncingFromStore.value) return
    emitFilters()
  },
  {
    deep: true
  }
)
</script>