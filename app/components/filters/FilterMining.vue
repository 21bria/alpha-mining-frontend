<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end max-w-full">
    <!-- IUP -->
    <div v-if="showIup" class="space-y-2 w-full max-w-sm">
      <label class="text-sm font-medium">IUP</label>
      <SelectLookup v-model="form.iup" endpoint="/api/master/lookups/mine-iup/" label="IUP" variant="field"
        label-key="iup_name" value-key="id"
        :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null" />
    </div>

    <!-- Date Range -->
    <div class="space-y-2 ">
      <label class="text-sm font-medium">Date Range</label>
      <DatePicker v-model="dateRange" type="range" placeholder="Pick Date Range" />
    </div>

    <!-- Vendor -->
    <div class="space-y-2 w-full max-w-sm">
      <label class="text-sm font-medium">Vendor</label>
      <SelectLookup v-model="vendor" endpoint="/api/master/lookups/vendors/" label="Vendor" variant="field"
        label-key="vendor_name" value-key="id" />
    </div>

    <!-- Action -->
    <div>
      <Button size="lg" variant="outline" class="text-sm" @click="applyFilters" :disabled="!isValid">
        Filter
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import DatePicker from "@/components/filters/DatePicker.vue"
import SelectLookup from "@/components/form/LookupSelect.vue"
import { Button } from "@/components/ui/button"

const props = defineProps<{
  role?: string
  initial?: {
    iup?: number | string | null
    iup_id?: number | string | null
    iup_name?: string | null
    iup_code?: string | null
    vendor?: string | null
    vendor_code?: string | null
    vendor_name?: string | null
  }
}>()

const showIup = computed(() => props.role !== "SITE_USER")

function toNumber(val: any): number | null {
  if (val === null || val === undefined || val === "") return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

// IUP
const form = ref<{
  iup: number | null
}>({
  iup: toNumber(props.initial?.iup_id ?? props.initial?.iup),
})

// Date
const dateRange = ref<{ start: string; end: string }>({
  start: "",
  end: "",
})

// Vendor
const vendor = ref<number | null>(null)
// const vendor = ref<number | null>(
//   props.initial?.vendor_id ? Number(props.initial.vendor_id) : null
// )
const selectedCategories = ref<string[]>([])

const isValid = computed(() => {
  return Boolean(
    (!showIup.value || form.value.iup) &&
    dateRange.value.start &&
    dateRange.value.end &&
    vendor.value
  )
})

const emit = defineEmits<{
  (
    e: "apply",
    payload: {
      iup_id?: number | null
      startDate: string
      endDate: string
      vendor: number | null
      categories: string[]
    }
  ): void
}>()

function applyFilters() {
  if (!isValid.value) return

  emit("apply", {
    iup_id: showIup.value ? form.value.iup : null,
    startDate: dateRange.value.start,
    endDate: dateRange.value.end,
    vendor: vendor.value,
    categories: selectedCategories.value,
  })
}
</script>