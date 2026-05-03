<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApi } from "@/composables/useApi"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"

const { request } = useApi()

export type ActivityPayload = {
  id?: number
  code: string
  name: string
  status_id: number | null
}

type ActivityInitial = {
  id?: number
  code?: string | null
  name?: string | null
  status?: number | null
  status_id?: number | null
  status_name?: string | null
}

type ActivityFormState = {
  id?: number
  code: string
  name: string
  status_id: number | null
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  initial?: ActivityInitial | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: ActivityPayload): void
}>()

const local = ref<ActivityFormState>({
  code: "",
  name: "",
  status_id: null,
})

const title = computed(() =>
  props.mode === "create" ? "Add Activity" : "Edit Activity"
)

const close = () => emit("update:open", false)

const submit = () => {
  emit("submit", {
    id: local.value.id,
    code: local.value.code.trim(),
    name: local.value.name.trim(),
    status_id: local.value.status_id,
  })
}

const fieldError = (key: string) => {
  const e = props.errors?.[key]
  if (!e) return null
  return Array.isArray(e) ? e[0] : String(e)
}

/* =========================
   Activity Category Lookup
========================= */

const activityCategoryOptions = ref<Array<{ value: number; label: string }>>([])
const activityCategoryLoading = ref(false)
const activityCategorySearch = ref("")
const activityCategoryPage = ref(1)
const activityCategoryHasMore = ref(true)
const activityCategoryContentRef = ref<HTMLElement | null>(null)

function normalizeStatusId(v: any): number | null {
  if (v == null) return null
  if (typeof v === "number") return v
  if (typeof v === "string" && v !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === "object") {
    const n = Number(v.value ?? v.id ?? null)
    return Number.isFinite(n) ? n : null
  }
  return null
}

async function fetchActivityCategories(q = "", page = 1) {
  if (activityCategoryLoading.value) return
  activityCategoryLoading.value = true

  try {
    const res: any = await request("/api/master/lookups/activity-categories/", {
      method: "GET",
      query: { search: q, page, page_size: 10 },
    })

    const items = (res?.results ?? []) as Array<{ value: number; label: string }>
    const count = Number(res?.count ?? 0)

    if (page === 1) {
      activityCategoryOptions.value = items
    } else {
      activityCategoryOptions.value = [
        ...activityCategoryOptions.value,
        ...items,
      ]
    }

    activityCategoryPage.value = page
    activityCategoryHasMore.value =
      activityCategoryOptions.value.length < count
  } finally {
    activityCategoryLoading.value = false
  }
}

const onActivityCategorySearch = useDebounceFn((q: string) => {
  activityCategoryPage.value = 1
  activityCategoryHasMore.value = true
  fetchActivityCategories(q, 1).then(() => {
    if (activityCategoryContentRef.value) {
      activityCategoryContentRef.value.scrollTop = 0
    }
  })
}, 300)

const selectedActivityCategoryLabel = computed(() => {
  const v = local.value.status_id
  if (v == null) return null
  return (
    activityCategoryOptions.value.find(
      (x) => Number(x.value) === Number(v)
    )?.label ?? null
  )
})

function onActivityCategoryScroll(e: Event) {
  const el = e.target as HTMLElement
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40

  if (
    nearBottom &&
    activityCategoryHasMore.value &&
    !activityCategoryLoading.value
  ) {
    fetchActivityCategories(
      activityCategorySearch.value,
      activityCategoryPage.value + 1
    )
  }
}

/* =========================
   Init on open
========================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) return

    const statusId = normalizeStatusId(
      props.initial?.status_id ?? props.initial?.status
    )

    local.value = {
      id: props.initial?.id,
      code: props.initial?.code ?? "",
      name: props.initial?.name ?? "",
      status_id: statusId,
    }

    activityCategorySearch.value = ""
    activityCategoryPage.value = 1
    activityCategoryHasMore.value = true

    await fetchActivityCategories("", 1)

    if (
      statusId != null &&
      !activityCategoryOptions.value.some(
        (x) => Number(x.value) === Number(statusId)
      )
    ) {
      const label =
        props.initial?.status_name ??
        `Category #${statusId}`

      activityCategoryOptions.value = [
        { value: statusId, label },
        ...activityCategoryOptions.value,
      ]
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Code</label>
          <Input v-model="local.code" placeholder="e.g. ACT-001" />
          <p v-if="fieldError('code')" class="text-sm text-destructive">
            {{ fieldError("code") }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Name</label>
          <Input v-model="local.name" placeholder="e.g. Loading Ore" />
          <p v-if="fieldError('name')" class="text-sm text-destructive">
            {{ fieldError("name") }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Status / Category</label>

          <Select :model-value="local.status_id != null ? String(local.status_id) : ''"
            @update:model-value="(v) => (local.status_id = v ? Number(v) : null)" :disabled="activityCategoryLoading">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="activityCategoryLoading ? 'Loading...' : 'Select Category'" />
            </SelectTrigger>

            <SelectContent ref="activityCategoryContentRef" class="max-h-80 overflow-auto"
              @scroll="onActivityCategoryScroll">
              <SelectGroup>
                <div class="sticky top-0 z-10 bg-background/30 backdrop-blur p-2 border-b">
                  <Input v-model="activityCategorySearch" placeholder="Search category..." class="h-8"
                    @input="onActivityCategorySearch(activityCategorySearch)" @keydown.stop @click.stop />
                </div>

                <div v-if="local.status_id != null && selectedActivityCategoryLabel"
                  class="sticky top-[46px] z-10 bg-background/30 backdrop-blur px-2 py-1 border-b text-xs">
                  Selected:
                  <span class="font-medium">{{ selectedActivityCategoryLabel }}</span>
                </div>

                <SelectItem v-for="o in activityCategoryOptions" :key="String(o.value)" :value="String(o.value)">
                  {{ o.label }}
                </SelectItem>

                <div v-if="activityCategoryLoading" class="p-2 text-sm text-muted-foreground">
                  Loading...
                </div>

                <div v-if="!activityCategoryLoading && activityCategoryOptions.length === 0"
                  class="p-2 text-sm text-muted-foreground">
                  No results
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <p v-if="fieldError('status_id')" class="text-sm text-destructive">
            {{ fieldError("status_id") }}
          </p>

          <p v-if="fieldError('status')" class="text-sm text-destructive">
            {{ fieldError("status") }}
          </p>
        </div>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError("non_field_errors") }}
        </p>

        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError("detail") }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="loading || !local.code.trim() || !local.name.trim() || !local.status_id" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>