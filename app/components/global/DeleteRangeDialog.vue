<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { parseDate } from "@internationalized/date"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"

import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

const props = defineProps<{
  open: boolean
  endpoint: string
  title?: string
  hard?: boolean
  extraFilters?: Record<string, any>
  role?: UserRole
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "deleted"): void
}>()

const { request } = useApi()
const notify = useNotify()

const dateStart = ref("")
const dateEnd = ref("")

const previewCount = ref<number | null>(null)
const checking = ref(false)
const deleting = ref(false)

const canChooseIup = computed(() =>
  props.role === "SYSTEM" || props.role === "MANAGEMENT"
)

const selectedIup = ref<number | null>(null)

const mineIUPOptions = ref<Array<{ value: number; label: string }>>([])
const mineIUPLoading = ref(false)
const mineIUPSearch = ref("")
const mineIUPPage = ref(1)
const mineIUPHasMore = ref(true)
const mineIUPContentRef = ref<HTMLElement | null>(null)

const selectedMineIUPLabel = computed(() => {
  const v = selectedIup.value
  if (v == null) return null
  return mineIUPOptions.value.find((o) => Number(o.value) === Number(v))?.label ?? null
})

const isValid = computed(() => {
  if (!dateStart.value || !dateEnd.value) return false
  if (canChooseIup.value && !selectedIup.value) return false
  return true
})

function close() {
  emit("update:open", false)
}

function resetState() {
  dateStart.value = ""
  dateEnd.value = ""
  previewCount.value = null
  checking.value = false
  deleting.value = false

  if (canChooseIup.value) {
    selectedIup.value = null
    mineIUPSearch.value = ""
    mineIUPPage.value = 1
    mineIUPHasMore.value = true
    mineIUPOptions.value = []
  }
}

function toCalendarDate(value: string) {
  if (!value) return undefined
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

function toISODate(value: any) {
  if (!value) return ""
  const y = String(value.year).padStart(4, "0")
  const m = String(value.month).padStart(2, "0")
  const d = String(value.day).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const startValue = computed({
  get: () => toCalendarDate(dateStart.value),
  set: (v) => {
    dateStart.value = toISODate(v)
  },
})

const endValue = computed({
  get: () => toCalendarDate(dateEnd.value),
  set: (v) => {
    dateEnd.value = toISODate(v)
  },
})

async function fetchMineIUP(q = "", page = 1) {
  if (mineIUPLoading.value) return
  mineIUPLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/mine-iup/", {
      method: "GET",
      query: { q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) mineIUPOptions.value = items
    else mineIUPOptions.value = [...mineIUPOptions.value, ...items]

    mineIUPPage.value = page
    mineIUPHasMore.value = mineIUPOptions.value.length < count
  } catch (e: any) {
    notify.error(e?.message || "Failed to load IUP")
  } finally {
    mineIUPLoading.value = false
  }
}

const onMineIUPSearch = useDebounceFn((q: string) => {
  mineIUPPage.value = 1
  mineIUPHasMore.value = true
  fetchMineIUP(q, 1).then(() => {
    if (mineIUPContentRef.value) {
      mineIUPContentRef.value.scrollTop = 0
    }
  })
}, 300)

function onMineIUPScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el || mineIUPLoading.value || !mineIUPHasMore.value) return

  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
  if (!nearBottom) return

  fetchMineIUP(mineIUPSearch.value, mineIUPPage.value + 1)
}

function buildPayload() {
  return {
    date_start: dateStart.value,
    date_end: dateEnd.value,
    hard: props.hard ?? true,
    ...(props.extraFilters ?? {}),
    ...(canChooseIup.value ? { iup: selectedIup.value } : {}),
  }
}

async function checkData() {
  if (!dateStart.value || !dateEnd.value) {
    notify.error("Please select date range")
    return
  }

  if (canChooseIup.value && !selectedIup.value) {
    notify.error("Please select IUP")
    return
  }

  checking.value = true
  previewCount.value = null

  try {
    const res = await request(`${props.endpoint}preview/`, {
      method: "POST",
      body: buildPayload(),
    })

    previewCount.value = res?.count ?? 0

    if (previewCount.value === 0) {
      notify.info("No data found for selected range")
    }
  } catch (e: any) {
    notify.error(e?.message || "Failed to check data")
  } finally {
    checking.value = false
  }
}

async function deleteData() {
  if (!isValid.value) return

  if (!previewCount.value || previewCount.value === 0) {
    notify.error("No data to delete")
    return
  }

  deleting.value = true

  try {
    await request(props.endpoint, {
      method: "POST",
      body: buildPayload(),
    })

    notify.success(`${previewCount.value} data deleted`)
    emit("deleted")
    close()
    resetState()
  } catch (e: any) {
    notify.error(e?.message || "Failed to delete data")
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previewCount.value = null

      if (canChooseIup.value) {
        mineIUPPage.value = 1
        mineIUPHasMore.value = true
        await fetchMineIUP("", 1)
      }
    } else {
      resetState()
    }
  }
)
</script>

<template>
  <Dialog :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ props.title || "Delete Data by Date Range" }}
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div v-if="canChooseIup" class="grid gap-2">
          <label class="text-sm font-medium">IUP</label>

          <Select
            :model-value="selectedIup != null ? String(selectedIup) : ''"
            @update:model-value="(v) => (selectedIup = v ? Number(v) : null)"
            :disabled="mineIUPLoading"
          >
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="mineIUPLoading ? 'Loading...' : 'Select IUP'" />
            </SelectTrigger>

            <SelectContent
              ref="mineIUPContentRef"
              class="max-h-80 overflow-auto"
              @scroll="onMineIUPScroll"
            >
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/95 backdrop-blur p-2 border-b">
                  <Input
                    v-model="mineIUPSearch"
                    placeholder="Search IUP..."
                    class="h-8"
                    @input="onMineIUPSearch(mineIUPSearch)"
                    @keydown.stop
                    @click.stop
                  />
                </div>

                <div
                  v-if="selectedIup != null && selectedMineIUPLabel"
                  class="sticky top-[46px] z-10 bg-background/95 backdrop-blur px-2 py-1 border-b text-xs"
                >
                  Selected:
                  <span class="font-medium">{{ selectedMineIUPLabel }}</span>
                </div>

                <SelectItem
                  v-for="o in mineIUPOptions"
                  :key="String(o.value)"
                  :value="String(o.value)"
                >
                  {{ o.label }}
                </SelectItem>

                <div v-if="mineIUPLoading" class="p-2 text-sm text-muted-foreground">
                  Loading...
                </div>

                <div
                  v-if="!mineIUPLoading && mineIUPOptions.length === 0"
                  class="p-2 text-sm text-muted-foreground"
                >
                  No results
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="canChooseIup && !selectedIup" class="text-xs text-muted-foreground">
            IUP is required for SYSTEM and MANAGEMENT.
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">From Date</label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-9 w-full justify-start text-left font-normal"
                :class="!dateStart && 'text-muted-foreground'"
              >
                <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                <span>{{ dateStart || "Pick start date" }}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent class="w-auto p-0">
              <Calendar v-model="startValue" initial-focus />
            </PopoverContent>
          </Popover>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">To Date</label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-9 w-full justify-start text-left font-normal"
                :class="!dateEnd && 'text-muted-foreground'"
              >
                <Icon name="i-radix-icons-calendar" class="mr-2 h-4 w-4 opacity-50" />
                <span>{{ dateEnd || "Pick end date" }}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent class="w-auto p-0">
              <Calendar v-model="endValue" initial-focus />
            </PopoverContent>
          </Popover>
        </div>

        <div v-if="previewCount !== null" class="rounded-md border p-3">
          <div class="text-sm">
            <span class="font-medium">{{ previewCount }}</span>
            data will be deleted
          </div>
        </div>

        <div class="text-xs text-destructive">
          ⚠ This action cannot be undone.
        </div>
      </div>

      <DialogFooter class="flex gap-2">
        <Button variant="outline" @click="close">
          Cancel
        </Button>

        <Button variant="secondary" :disabled="checking || !isValid" @click="checkData">
          {{ checking ? "Checking..." : "Check Data" }}
        </Button>

        <Button variant="destructive" :disabled="deleting || !previewCount" @click="deleteData">
          {{ deleting ? "Deleting..." : "Delete" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>