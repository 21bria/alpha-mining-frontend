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
        :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
        class="w-52"
      />
    </div>

    <!-- Material Filter -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Material</label>
      <Select v-model="material">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Select Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Material</SelectLabel>
            <SelectItem value="all">-- All Materials --</SelectItem>
            <SelectItem value="HPAL">Limonite</SelectItem>
            <SelectItem value="RKEF">Saprolite</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Date Range Picker -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Date Range</label>
      <DatePicker v-model="dateRange" type="range" placeholder="Pick Date Range" />
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/filters/DatePicker.vue"
import SelectLookup from "@/components/AsyncLookupSelect.vue"

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
  if (val === null || val === undefined || val === "") return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

// state utama
const material = ref<string>("all")
const selectedIup = ref<number | null>(
  toNumber(props.initial?.iup_id ?? props.initial?.iup)
)
const dateRange = ref<{ start: string; end: string }>({
  start: "",
  end: ""
})

// enable Apply hanya jika lengkap
const isValid = computed(() => {
  return Boolean(
    dateRange.value.start &&
    dateRange.value.end &&
    (!showIup.value || selectedIup.value)
  )
})

// emit hasil filter
const emit = defineEmits<{
  (e: "apply", payload: {
    typeFilter: string
    startDate: string
    endDate: string
    iup_id?: number | null
  }): void
}>()

function applyFilters() {
  if (!isValid.value) return

  emit("apply", {
    typeFilter: material.value === "all" ? "" : material.value,
    startDate: dateRange.value.start,
    endDate: dateRange.value.end,
    iup_id: showIup.value ? selectedIup.value : null
  })
}
</script>