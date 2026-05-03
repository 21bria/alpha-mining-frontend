<!-- components/filters/DatePicker.vue -->
<template>
  <div class="flex items-center gap-2">
    <!-- SINGLE DATE -->
    <div v-if="single" class="grid gap-2">
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" class="h-9 min-w-[180px] justify-start text-left font-normal"
            :class="!date ? 'text-muted-foreground' : ''">
            <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
            <span>{{ singleLabel }}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent class="w-auto p-0">
          <Calendar v-model="dateValue" initial-focus @update:model-value="onDateChange" />
        </PopoverContent>
      </Popover>
    </div>

    <!-- RANGE DATE -->
    <div v-else class="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" class="h-9 min-w-[180px] justify-start text-left font-normal"
            :class="!startDate ? 'text-muted-foreground' : ''">
            <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
            <span>{{ startLabel }}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent class="w-auto p-0">
          <Calendar v-model="startValue" initial-focus @update:model-value="onStartChange" />
        </PopoverContent>
      </Popover>

      <span class="text-sm text-muted-foreground">to</span>

      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" class="h-9 min-w-[180px] justify-start text-left font-normal"
            :class="!endDate ? 'text-muted-foreground' : ''">
            <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
            <span>{{ endLabel }}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent class="w-auto p-0">
          <Calendar v-model="endValue" initial-focus @update:model-value="onEndChange" />
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parseDate } from '@internationalized/date'

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

type RangeValue = {
  start: string
  end: string
}

type ModelValue = string | RangeValue

const props = defineProps<{
  modelValue: ModelValue
  single?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ModelValue): void
}>()

const date = ref('')
const startDate = ref('')
const endDate = ref('')

const dateValue = ref<ReturnType<typeof parseDate> | null>(null)
const startValue = ref<ReturnType<typeof parseDate> | null>(null)
const endValue = ref<ReturnType<typeof parseDate> | null>(null)

function isRangeValue(value: ModelValue): value is RangeValue {
  return typeof value === 'object' && value !== null && 'start' in value && 'end' in value
}

function safeParseDate(value: string) {
  try {
    return value ? parseDate(value) : null
  } catch {
    return null
  }
}

function formatDisplay(value: string, fallback: string) {
  if (!value) return fallback

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback

  return parsed.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

watch(
  () => props.modelValue,
  (value) => {
    if (props.single) {
      const singleValue = typeof value === 'string' ? value : ''
      date.value = singleValue
      dateValue.value = safeParseDate(singleValue)
      return
    }

    const rangeValue = isRangeValue(value)
      ? value
      : { start: '', end: '' }

    startDate.value = rangeValue.start || ''
    endDate.value = rangeValue.end || ''

    startValue.value = safeParseDate(startDate.value)
    endValue.value = safeParseDate(endDate.value)
  },
  { immediate: true, deep: true }
)

const singleLabel = computed(() => formatDisplay(date.value, 'Pick a date'))
const startLabel = computed(() => formatDisplay(startDate.value, 'Start date'))
const endLabel = computed(() => formatDisplay(endDate.value, 'End date'))

function onDateChange(value: ReturnType<typeof parseDate> | null) {
  const nextValue = value ? value.toString() : ''
  date.value = nextValue
  dateValue.value = value
  emit('update:modelValue', nextValue)
}

function emitRange() {
  emit('update:modelValue', {
    start: startDate.value,
    end: endDate.value
  })
}

function onStartChange(value: ReturnType<typeof parseDate> | null) {
  const nextValue = value ? value.toString() : ''
  startDate.value = nextValue
  startValue.value = value

  if (endDate.value && nextValue && endDate.value < nextValue) {
    endDate.value = nextValue
    endValue.value = value
  }

  emitRange()
}

function onEndChange(value: ReturnType<typeof parseDate> | null) {
  const nextValue = value ? value.toString() : ''
  endDate.value = nextValue
  endValue.value = value

  if (startDate.value && nextValue && nextValue < startDate.value) {
    startDate.value = nextValue
    startValue.value = value
  }

  emitRange()
}
</script>