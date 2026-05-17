<template>
  <div class="flex flex-wrap gap-3 items-end">
    <div v-if="showIup" class="space-y-1">
      <label class="text-sm font-medium">IUP</label>
      <SelectLookup
        v-model="selectedIup"
        endpoint="/api/master/lookups/mine-iup/"
        label="IUP"
        variant="field"
        label-key="iup_name"
        value-key="id"
        :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
        class="w-52"
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Date Range</label>
      <DatePicker
        v-model="dateRange"
        type="range"
        placeholder="Pick Date Range"
      />
    </div>

    <div>
      <Button @click="applyFilters" :disabled="!isValid">
        Filter
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/filters/DatePicker.vue"
import SelectLookup from "@/components/AsyncLookupSelect.vue"

function getDayDiff(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  return diff / (1000 * 60 * 60 * 24) + 1
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

const emit = defineEmits<{
  (e: "apply", payload: {
    date_start: string
    date_end: string
    iup_id?: number | null
  }): void
}>()

const showIup = computed(() => props.role !== "SITE_USER")

function toNumber(val: any): number | null {
  if (val === null || val === undefined || val === "") return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

const selectedIup = ref<number | null>(
  toNumber(props.initial?.iup_id ?? props.initial?.iup)
)

const dateRange = ref<{ start: string; end: string }>({
  start: "",
  end: ""
})

const isValid = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return false
  if (showIup.value && !selectedIup.value) return false

  return getDayDiff(dateRange.value.start, dateRange.value.end) <= 31
})

function applyFilters() {
  if (!dateRange.value.start || !dateRange.value.end) return

  if (getDayDiff(dateRange.value.start, dateRange.value.end) > 31) {
    alert("Filter maksimal 1 bulan")
    return
  }

  emit("apply", {
    date_start: dateRange.value.start,
    date_end: dateRange.value.end,
    iup_id: showIup.value ? selectedIup.value : null
  })
}
</script>