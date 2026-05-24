<script setup lang="ts">
import type { DateRange } from "reka-ui"
import type { Ref } from "vue"
import { useNotify } from "@/composables/useNotify"
const notify = useNotify()

import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date"

import { Calendar as CalendarIcon } from "lucide-vue-next"
import { cn } from "@/lib/utils"

const emit = defineEmits<{
  (
    e: "apply",
    payload: {
      date_start: string | null
      date_end: string | null
    }
  ): void
}>()

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
})

/**
 * Default range:
 * Monday -> Sunday (current week)
 */
const today = new Date()

const day = today.getDay()
// Sunday = 0
const diffToMonday = day === 0 ? -6 : 1 - day

const monday = new Date(today)
monday.setDate(today.getDate() + diffToMonday)

const sunday = new Date(monday)
sunday.setDate(monday.getDate() + 6)

const startDate = new CalendarDate(
  monday.getFullYear(),
  monday.getMonth() + 1,
  monday.getDate(),
)

const endDate = new CalendarDate(
  sunday.getFullYear(),
  sunday.getMonth() + 1,
  sunday.getDate(),
)

const value = ref({
  start: startDate,
  end: endDate,
}) as Ref<DateRange>

function applyFilter() {
  if (!validateRange()) return

  emit("apply", {
    date_start: value.value.start
      ? value.value.start.toString()
      : null,

    date_end: value.value.end
      ? value.value.end.toString()
      : null,
  })
}

function validateRange() {
  if (!value.value.start || !value.value.end) {
    notify.error("Period wajib diisi")
    return false
  }

  const start = value.value.start.toDate(getLocalTimeZone())
  const end = value.value.end.toDate(getLocalTimeZone())

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  ) + 1

  if (diffDays !== 7) {
    notify.error("Periode harus tepat 7 hari")
    return false
  }

  return true
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Popover>
      <PopoverTrigger as-child>
        <Button
          id="date"
          variant="outline"
          :class="
            cn(
              'min-w-[260px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )
          "
        >
          <CalendarIcon class="mr-2 h-4 w-4" />

          <template v-if="value.start">
            <template v-if="value.end">
              {{ df.format(value.start.toDate(getLocalTimeZone())) }}
              -
              {{ df.format(value.end.toDate(getLocalTimeZone())) }}
            </template>

            <template v-else>
              {{ df.format(value.start.toDate(getLocalTimeZone())) }}
            </template>
          </template>

          <template v-else>
            Pick a date
          </template>
        </Button>
      </PopoverTrigger>

      <PopoverContent class="w-auto p-0" align="end">
        <RangeCalendar
          v-model="value"
          weekday-format="short"
          :number-of-months="2"
          initial-focus
          :placeholder="value.start"
          @update:start-value="(startDate: any) => value.start = startDate"
        />
      </PopoverContent>
    </Popover>

    <Button @click="applyFilter">
      Filter
    </Button>
  </div>
</template>