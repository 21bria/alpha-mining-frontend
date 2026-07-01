<template>
  <div class="flex flex-wrap gap-3 items-end">
    <!-- IUP -->
    <div v-if="showIup" class="space-y-1">
      <label class="text-sm font-medium">IUP</label>
      <SelectLookup
        v-model="selectedIup"
        endpoint="/api/master/lookups/mine-iup/"
        label="IUP"
        variant="field"
        label-key="iup_name"
        value-key="id"
        class="w-52"
      />
    </div>

    <!-- Tipe Filter -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Filter Type</label>
      <Select v-model="filterType">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Select Filter Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Filter Type</SelectLabel>
            <SelectItem
              v-for="option in filterOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Material Filter -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Material</label>
      <Select v-model="materialFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Select Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Material</SelectLabel>
            <SelectItem value="HPAL">Limonite</SelectItem>
            <SelectItem value="RKEF">Saprolite</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Dynamic Pickers -->
    <div v-if="showYear" class="space-y-1">
      <label class="text-sm font-medium">Year</label>
      <YearPicker v-model="selectedYear" />
    </div>

    <div v-if="showMonth" class="space-y-1">
      <label class="text-sm font-medium">Month</label>
      <MonthPicker v-model="selectedMonth" />
    </div>

    <!-- Apply Button -->
    <div>
      <Button @click="emitFilters" :disabled="!filterType">
        Filter
      </Button>
    </div>
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
import { Button } from '@/components/ui/button'
import YearPicker from '@/components/filters/YearPicker.vue'
import MonthPicker from '@/components/filters/MonthPicker.vue'
import SelectLookup from '@/components/form/LookupSelect.vue'


type FilterOption = {
  value: string
  label: string
}

const props = defineProps<{
  role?: string
  initial?: {
    iup?: number | string | null
    iup_id?: number | string | null
    iup_name?: string | null
    iup_code?: string | null
  }
}>()

const showIup = computed(() => props.role !== 'SITE_USER')

const filterOptions: FilterOption[] = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
]

type FilterType = typeof filterOptions[number]['value']

function toNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

const filterType = ref<FilterType>('monthly')
const materialFilter = ref<string | undefined>()
const selectedIup = ref<number | null>(
  toNumber(props.initial?.iup_id ?? props.initial?.iup)
)

const selectedYear = ref<number | undefined>(new Date().getFullYear())
const selectedMonth = ref<number | undefined>(new Date().getMonth() + 1)

const showYear = computed(() => ['yearly', 'monthly', 'weekly'].includes(filterType.value))
const showMonth = computed(() => ['monthly', 'weekly'].includes(filterType.value))

watch(filterType, () => {
  if (!['monthly', 'yearly'].includes(filterType.value)) {
    selectedYear.value = undefined
  }
  if (!['monthly'].includes(filterType.value)) {
    selectedMonth.value = undefined
  }
})

const emit = defineEmits<{
  (e: 'apply', payload: {
    type: FilterType
    year?: number
    month?: number
    materialFilter?: string
    iup_id?: number | null
  }): void
}>()

function emitFilters() {
  emit('apply', {
    type: filterType.value,
    year: selectedYear.value,
    month: selectedMonth.value,
    materialFilter: materialFilter.value,
    iup_id: showIup.value ? selectedIup.value : null
  })
}
</script>