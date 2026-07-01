<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
    <div v-if="showIup" class="space-y-1">
      <label class="text-sm font-medium">IUP</label>
      <SelectLookup
        :model-value="form.iup"
        @update:model-value="onIupChange"
        endpoint="/api/master/lookups/mine-iup/"
        label="IUP"
        variant="field"
        label-key="iup_name"
        value-key="id"
        :selected-label="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Start Date</label>
      <DatePicker v-model="form.start_date" :single="true" class="w-full" />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">End Date</label>
      <DatePicker v-model="form.end_date" :single="true" class="w-full" />
    </div>
  </div>

  <div class="mt-3 flex gap-2">
    <Button @click="emitFilters" :disabled="!isValid">
      Filter
    </Button>

    <Button variant="outline" @click="resetFilters">
      Reset
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import DatePicker from "@/components/filters/DatePicker.vue"
import SelectLookup from "@/components/form/LookupSelect.vue"
import { Button } from "@/components/ui/button"
import { useDupFilterStore } from "@/stores/filters/duplicated-filter"

const dupStore = useDupFilterStore()

type LookupValue = string | number | null

const props = defineProps<{
  role?: string
  initial?: {
    iup?: number | string | null
    iup_id?: number | string | null
    iup_name?: string | null
    iup_code?: string | null
    start_date?: string | null
    end_date?: string | null
  }
}>()

const emit = defineEmits<{
  (e: "apply", payload: {
    iup_id?: number | null
    start_date: string
    end_date: string
  }): void
}>()

const showIup = computed(() => props.role !== "SITE_USER")

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null
  const num = Number(val)
  return Number.isNaN(num) ? null : num
}

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const form = ref<{
  iup: number | null
  start_date: string
  end_date: string
}>({
  iup: dupStore.iup_id ?? toNumber(props.initial?.iup_id ?? props.initial?.iup),
  start_date: dupStore.start_date || props.initial?.start_date || todayISO(),
  end_date: dupStore.end_date || props.initial?.end_date || todayISO(),
})

function onIupChange(value: LookupValue) {
  form.value.iup = toNumber(value)
}

const isValid = computed(() => {
  const hasIup = !showIup.value || !!form.value.iup
  const hasStart = !!form.value.start_date
  const hasEnd = !!form.value.end_date
  const validRange =
    hasStart &&
    hasEnd &&
    form.value.start_date <= form.value.end_date

  return hasIup && hasStart && hasEnd && validRange
})

function emitFilters() {
  const payload = {
    iup_id: showIup.value ? form.value.iup : null,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
  }

  dupStore.setFilters(payload)

  emit("apply", {
    iup_id: payload.iup_id,
    start_date: payload.start_date,
    end_date: payload.end_date,
  })
}

function resetFilters() {
  dupStore.reset()

  form.value = {
    iup: dupStore.iup_id,
    start_date: dupStore.start_date,
    end_date: dupStore.end_date,
  }

  emit("apply", {
    iup_id: form.value.iup,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
  })
}

watch(
  () => [dupStore.iup_id, dupStore.start_date, dupStore.end_date],
  () => {
    form.value.iup = dupStore.iup_id
    form.value.start_date = dupStore.start_date
    form.value.end_date = dupStore.end_date
  }
)
</script>