<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
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
      <label class="text-sm font-medium">CRM Type</label>
      <SelectLookupText
        v-model="form.crm_type"
        endpoint="/api/master/lookups/crm-certificates/"
        label="CRM"
        variant="field"
        value-key="oreas_name"
        label-key="oreas_name"
        :selected-label="props.initial?.crm_type ?? crmStore.crm_type ?? null"
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
import SelectLookup from "@/components/AsyncLookupSelect.vue"
import SelectLookupText from "@/components/AsyncLookupSelectText.vue"
import { Button } from "@/components/ui/button"
import { useCrmFilterStore } from "@/stores/filters/crm-filter"

const crmStore = useCrmFilterStore()

type LookupValue = string | number | null

const props = defineProps<{
  role?: string
  initial?: {
    iup?: number | string | null
    iup_id?: number | string | null
    iup_name?: string | null
    iup_code?: string | null
    crm_type?: string | null
    start_date?: string | null
    end_date?: string | null
  }
}>()

const emit = defineEmits<{
  (e: "apply", payload: {
    iup_id?: number | null
    filterTypeCrm: string | null
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
  crm_type: string | null
  start_date: string
  end_date: string
}>({
  iup: crmStore.iup_id ?? toNumber(props.initial?.iup_id ?? props.initial?.iup),
  crm_type: crmStore.crm_type ?? props.initial?.crm_type ?? null,
  start_date: crmStore.start_date || props.initial?.start_date || todayISO(),
  end_date: crmStore.end_date || props.initial?.end_date || todayISO(),
})

function onIupChange(value: LookupValue) {
  form.value.iup = toNumber(value)
}

const isValid = computed(() => {
  const hasIup = !showIup.value || !!form.value.iup
  const hasCrm = !!form.value.crm_type
  const hasStart = !!form.value.start_date
  const hasEnd = !!form.value.end_date
  const validRange =
    hasStart &&
    hasEnd &&
    form.value.start_date <= form.value.end_date

  return hasIup && hasCrm && hasStart && hasEnd && validRange
})

function emitFilters() {
  const payload = {
    iup_id: showIup.value ? form.value.iup : null,
    crm_type: form.value.crm_type,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
  }

  crmStore.setFilters(payload)

  emit("apply", {
    iup_id: payload.iup_id,
    filterTypeCrm: payload.crm_type,
    start_date: payload.start_date,
    end_date: payload.end_date,
  })
}

function resetFilters() {
  crmStore.reset()

  form.value = {
    iup: crmStore.iup_id,
    crm_type: crmStore.crm_type,
    start_date: crmStore.start_date,
    end_date: crmStore.end_date,
  }

  emit("apply", {
    iup_id: form.value.iup,
    filterTypeCrm: form.value.crm_type,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
  })
}

watch(
  () => [crmStore.iup_id, crmStore.crm_type, crmStore.start_date, crmStore.end_date],
  () => {
    form.value.iup = crmStore.iup_id
    form.value.crm_type = crmStore.crm_type
    form.value.start_date = crmStore.start_date
    form.value.end_date = crmStore.end_date
  }
)
</script>