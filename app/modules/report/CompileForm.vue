<script setup lang="ts">
import { ref, computed } from "vue"
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date"
import { Button } from "@/components/ui/button"
import SelectLookup from "@/components/AsyncLookupSelect.vue"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel
} from "@/components/ui/select"

import { useNotify } from "@/composables/useNotify"
import { useApi } from '@/composables/useApi'

const { buildUrl } = useApi()
const notify = useNotify()

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

const type = ref<"range" | "year">("range")

function toNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}
// IUP
const form = ref({
  iup: toNumber(props.initial?.iup_id ?? props.initial?.iup),
})

// range mode
const dateStart = ref<any>(null)
const dateEnd = ref<any>(null)

// year mode
const selectedYear = ref<string | undefined>(String(new Date().getFullYear()))
const years = computed(() => {
  const current = new Date().getFullYear()
  return [current, current - 1, current - 2].map(String)
})

const canExport = computed(() => {
  if (type.value === "range") {
    return !!(dateStart.value && dateEnd.value && (!showIup.value || form.value.iup))
  }

  if (type.value === "year") {
    return !!(selectedYear.value && (!showIup.value || form.value.iup))
  }

  return false
})

const endpointExcel = "/api/analytics/raw/compile/generate/excel/"
const endpointPdf = "/api/analytics/raw/compile/generate/pdf/"

function toDate(val: any) {
  if (!val) return null

  if (val instanceof Date) return val

  if (typeof val?.toDate === "function") {
    return val.toDate(getLocalTimeZone())
  }

  if (typeof val === "string") {
    return new Date(val)
  }

  return new Date(val.toString())
}

function buildParams() {
  const params = new URLSearchParams()

  // kirim iup jika user bukan SITE_USER
  if (showIup.value) {
    if (!form.value.iup) {
      notify.error("IUP wajib dipilih")
      return null
    }
    params.set("iup_id", String(form.value.iup))
  }

  if (type.value === "range") {
    if (!dateStart.value || !dateEnd.value) {
      notify.error("Start date dan end date wajib diisi")
      return null
    }

    const dsDate = toDate(dateStart.value)
    const deDate = toDate(dateEnd.value)

    if (!dsDate || !deDate || isNaN(dsDate.getTime()) || isNaN(deDate.getTime())) {
      notify.error("Format tanggal tidak valid")
      return null
    }

    if (deDate < dsDate) {
      notify.error("Date end tidak boleh lebih kecil dari date start")
      return null
    }

    const diffDays =
      Math.floor((deDate.getTime() - dsDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (diffDays > 93) {
      notify.error("Maximum only 93 days or 3 month allowed")
      return null
    }

    params.set("mode", "range")
    params.set("date_start", dateStart.value.toString())
    params.set("date_end", dateEnd.value.toString())
  } else if (type.value === "year") {
    params.set("mode", "year")
    params.set("year", String(selectedYear.value))
  }

  return params
}

function exportExcel() {
  const params = buildParams()
  if (!params) return

  const url = buildUrl(endpointExcel, Object.fromEntries(params.entries()))
  window.open(url, '_blank')
}

function exportPdf() {
  const params = buildParams()
  if (!params) return

  params.set('preview', '1')

  const url = buildUrl(endpointPdf, Object.fromEntries(params.entries()))
  window.open(url, '_blank')
}

</script>

<template>
  <div>
    <h3 class="text-lg font-medium">Export Unified Report</h3>
    <p class="text-sm text-muted-foreground mb-4">
      Select export mode (Range or Year)
    </p>
    <Separator class="mb-4" />

    <!-- IUP -->
    <div v-if="showIup" class="mb-4 space-y-2 max-w-sm">
      <label class="text-sm font-medium">IUP</label>
      <SelectLookup
        v-model="form.iup"
        endpoint="/api/master/lookups/mine-iup/"
        label="IUP"
        variant="field"
        label-key="iup_name"
        value-key="id"
        :selectedLabel="props.initial?.iup_name ?? props.initial?.iup_code ?? null"
      />
    </div>

    <!-- Type -->
    <div class="mb-4 space-y-2 max-w-md">
      <label class="font-medium block mb-2">Type</label>
      <Select v-model="type">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Select Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Filter Type</SelectLabel>
            <SelectItem value="range">Range</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Range Mode -->
    <div v-if="type === 'range'" class="flex gap-6 mb-4 flex-wrap">
      <div>
        <label class="font-medium block mb-2">Date Start</label>
        <Calendar
          v-model="dateStart"
          :min-value="new CalendarDate(2000, 1, 1)"
          :max-value="today(getLocalTimeZone())"
        />
      </div>

      <div>
        <label class="font-medium block mb-2">Date End</label>
        <Calendar
          v-model="dateEnd"
          :min-value="new CalendarDate(2000, 1, 1)"
          :max-value="today(getLocalTimeZone())"
        />
      </div>
    </div>

    <!-- Year Mode -->
    <div v-else class="mb-4">
      <label class="font-medium block mb-2">Select Year</label>
      <Select v-model="selectedYear">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Year</SelectLabel>
            <SelectItem v-for="y in years" :key="y" :value="y">
              {{ y }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <Button :disabled="!canExport" @click="exportExcel">
        Export Excel
      </Button>
      <Button :disabled="!canExport" @click="exportPdf">
        Preview PDF
      </Button>
    </div>
  </div>
</template>