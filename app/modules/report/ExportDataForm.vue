<template>
  <div>
    <h3 class="text-lg font-medium">Export Unified Report</h3>
    <p class="text-sm text-muted-foreground mb-4">
      Select the export module and period
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

    <!-- Module -->
    <div class="mb-4 space-y-2 max-w-sm">
      <label class="font-medium block mb-2">Module</label>
      <Select v-model="module">
        <SelectTrigger class="w-48">
          <SelectValue placeholder="Select Module" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Module</SelectLabel>
            <SelectItem value="mining">Mining</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="selling">Selling</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Date -->
    <div class="flex gap-6 mb-4 flex-wrap">
      <div v-if="module !== 'inventory'">
        <label class="font-medium block mb-2">Date Start</label>
        <Calendar
          v-model="dateStart"
          :min-value="new CalendarDate(2000, 1, 1)"
          :max-value="today(getLocalTimeZone())"
        />
      </div>

      <div>
        <label class="font-medium block mb-2">
          {{ module === 'inventory' ? 'Date' : 'Date End' }}
        </label>
        <Calendar
          v-model="dateEnd"
          :min-value="new CalendarDate(2000, 1, 1)"
          :max-value="today(getLocalTimeZone())"
        />
      </div>
    </div>

    <!-- Action -->
    <Button :disabled="!canExport" @click="exportExcel">
      Export Excel
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import SelectLookup from "@/components/AsyncLookupSelect.vue"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel
} from "@/components/ui/select"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"

type ModuleOption = "mining" | "quality" | "selling" | "inventory"

const props = defineProps<{
  role?: string
  initial?: {
    iup?: number | string | null
    iup_id?: number | string | null
    iup_name?: string | null
    iup_code?: string | null
  }
}>()

const { buildUrl } = useApi()
const notify = useNotify()

const showIup = computed(() => props.role !== "SITE_USER")

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null
  const n = Number(val)
  return Number.isNaN(n) ? null : n
}

function toJsDate(val: any): Date | null {
  if (!val) return null

  if (val instanceof Date) return val

  if (typeof val?.toDate === "function") {
    return val.toDate(getLocalTimeZone())
  }

  if (typeof val === "string") {
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (typeof val?.toString === "function") {
    const d = new Date(val.toString())
    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

const form = ref<{
  iup: number | null
}>({
  iup: toNumber(props.initial?.iup_id ?? props.initial?.iup),
})

const module = ref<ModuleOption | undefined>(undefined)
const dateStart = ref<any>(null)
const dateEnd = ref<any>(null)

watch(module, (val) => {
  if (val === "inventory") {
    dateStart.value = null
  }
})

const canExport = computed(() => {
  if (!module.value) return false
  if (showIup.value && !form.value.iup) return false

  if (module.value === "inventory") {
    return !!dateEnd.value
  }

  return !!(dateStart.value && dateEnd.value)
})

const endpoint = "/api/analytics/raw/compile/export/data/xlsx/"

function buildParams() {
  if (!module.value) {
    notify.error("Module wajib dipilih")
    return null
  }

  const params = new URLSearchParams()

  params.set("module", module.value)

  if (showIup.value) {
    if (!form.value.iup) {
      notify.error("IUP wajib dipilih")
      return null
    }
    params.set("iup_id", String(form.value.iup))
  }

  if (module.value === "inventory") {
    if (!dateEnd.value) {
      notify.error("Date wajib diisi")
      return null
    }

    params.set("date_end", dateEnd.value.toString())
    return params
  }

  if (!dateStart.value || !dateEnd.value) {
    notify.error("Date start dan date end wajib diisi")
    return null
  }

  const dsDate = toJsDate(dateStart.value)
  const deDate = toJsDate(dateEnd.value)

  if (!dsDate || !deDate) {
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

  params.set("date_start", dateStart.value.toString())
  params.set("date_end", dateEnd.value.toString())

  return params
}

function exportExcel() {
  const params = buildParams()
  if (!params) return

  const url = buildUrl(endpoint, Object.fromEntries(params.entries()))
  window.open(url, "_blank")
}
</script>