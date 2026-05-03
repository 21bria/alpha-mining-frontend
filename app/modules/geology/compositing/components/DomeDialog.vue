<script setup lang="ts">
import { ref, watch, computed } from "vue"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import SelectLookup from "@/components/AsyncLookupSelect.vue"
import { useApi } from "@/composables/useApi"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type DomeMergePayload = {
  id?: number
  original_dome: number | null
  dome_second: number | null
  description?: string | null
}

type DomeMergeFormState = {
  id?: number
  original_dome: number | null
  tonnage_primary: string
  dome_second: number | null
  tonnage_second: string
  description: string
}

const props = defineProps<{
  open: boolean
  mode: "create" | "edit"
  role: UserRole
  initial?: Record<string, any> | null
  loading?: boolean
  errors?: Record<string, any> | null
}>()

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "submit", payload: DomeMergePayload): void
}>()

const { request } = useApi()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")
const isEdit = computed(() => props.mode === "edit")

const title = computed(() =>
  isEdit.value ? "View Dome Compositing" : "Add Dome Compositing"
)

const local = ref<DomeMergeFormState>({
  id: undefined,
  original_dome: null,
  tonnage_primary: "",
  dome_second: null,
  tonnage_second: "",
  description: "",
})

const primaryLoading = ref(false)
const secondLoading = ref(false)

function normalizeId(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v?.value ?? v?.id ?? v)
  return Number.isFinite(n) ? n : null
}

function toStringNumber(v: any): string {
  return v == null ? "" : String(v)
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

async function fetchDomeTonnage(
  domeId: number | null,
  target: "primary" | "second"
) {
  if (!domeId) {
    if (target === "primary") local.value.tonnage_primary = ""
    else local.value.tonnage_second = ""
    return
  }

  if (target === "primary") primaryLoading.value = true
  else secondLoading.value = true

  try {
    const res = await request<any>("/api/geology/ore-productions/tonnage-by-pile/", {
      method: "GET",
      query: { dome_id: domeId },
    })

    const tonnage = String(
      res?.tonnage_dome ?? res?.total_tonnage ?? res?.tonnage ?? 0
    )

    if (target === "primary") {
      local.value.tonnage_primary = tonnage
    } else {
      local.value.tonnage_second = tonnage
    }
  } catch {
    if (target === "primary") local.value.tonnage_primary = ""
    else local.value.tonnage_second = ""
  } finally {
    if (target === "primary") primaryLoading.value = false
    else secondLoading.value = false
  }
}

function submit() {
  if (isEdit.value) return

  const payload: DomeMergePayload = {
    id: local.value.id,
    original_dome: local.value.original_dome,
    dome_second: local.value.dome_second,
    description: local.value.description.trim() || null,
  }

  emit("submit", payload)
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    local.value = {
      id: props.initial?.id,
      original_dome: normalizeId(props.initial?.original_dome ?? props.initial?.original_dome_id),
      tonnage_primary: toStringNumber(props.initial?.tonnage_primary),
      dome_second: normalizeId(props.initial?.dome_second ?? props.initial?.dome_second_id),
      tonnage_second: toStringNumber(props.initial?.tonnage_second),
      description: props.initial?.description ?? "",
    }

    if (local.value.original_dome) {
      await fetchDomeTonnage(local.value.original_dome, "primary")
    }

    if (local.value.dome_second) {
      await fetchDomeTonnage(local.value.dome_second, "second")
    }
  },
  { immediate: true }
)

watch(
  () => local.value.original_dome,
  async (newDome, oldDome) => {
    if (!props.open || isEdit.value) return

    if (!newDome) {
      local.value.tonnage_primary = ""
      return
    }

    if (newDome === oldDome) return

    if (local.value.dome_second && newDome === local.value.dome_second) {
      local.value.dome_second = null
      local.value.tonnage_second = ""
      return
    }

    await fetchDomeTonnage(newDome, "primary")
  }
)

watch(
  () => local.value.dome_second,
  async (newDome, oldDome) => {
    if (!props.open || isEdit.value) return

    if (!newDome) {
      local.value.tonnage_second = ""
      return
    }

    if (newDome === oldDome) return

    if (local.value.original_dome && newDome === local.value.original_dome) {
      local.value.dome_second = null
      local.value.tonnage_second = ""
      return
    }

    await fetchDomeTonnage(newDome, "second")
  }
)

const sameDomeSelected = computed(() => {
  return !!local.value.original_dome &&
    !!local.value.dome_second &&
    local.value.original_dome === local.value.dome_second
})

const canSubmit = computed(() => {
  if (!canMutate.value || isEdit.value) return false
  if (!local.value.original_dome || !local.value.dome_second) return false
  if (sameDomeSelected.value) return false
  return true
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Original Dome</label>
          <SelectLookup :key="`original-dome-${props.mode}-${local.id ?? 'new'}`" v-model="local.original_dome"
            label="Original Dome" endpoint="/api/master/lookups/mine-dome/" variant="field" label-key="pile_id"
            value-key="id"
            :selectedLabel="props.initial?.original_dome_name ?? props.initial?.original_dome_code ?? null"
            :disabled="!canMutate || isEdit" />
          <p v-if="fieldError('original_dome')" class="text-sm text-destructive">
            {{ fieldError('original_dome') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Primary Tonnage</label>
          <Input v-model="local.tonnage_primary" type="number" step="any" disabled
            placeholder="Auto calculated from original dome productions" />
          <p class="text-xs text-muted-foreground">
            {{ primaryLoading ? "Calculating tonnage..." : "Calculated from original dome production" }}
          </p>
          <p v-if="fieldError('tonnage_primary')" class="text-sm text-destructive">
            {{ fieldError('tonnage_primary') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Target Dome</label>
          <SelectLookup :key="`target-dome-${props.mode}-${local.id ?? 'new'}`" v-model="local.dome_second"
            label="Target Dome" endpoint="/api/master/lookups/mine-dome/" variant="field" label-key="pile_id"
            value-key="id" :selectedLabel="props.initial?.dome_second_name ?? props.initial?.dome_second_code ?? null"
            :disabled="!canMutate || isEdit" />
          <p v-if="fieldError('dome_second')" class="text-sm text-destructive">
            {{ fieldError('dome_second') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Target Tonnage</label>
          <Input v-model="local.tonnage_second" type="number" step="any" disabled
            placeholder="Auto calculated from target dome productions" />
          <p class="text-xs text-muted-foreground">
            {{ secondLoading ? "Calculating tonnage..." : "Calculated from target dome production" }}
          </p>
          <p v-if="fieldError('tonnage_second')" class="text-sm text-destructive">
            {{ fieldError('tonnage_second') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Description" :disabled="!canMutate || isEdit" />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
        </div>

        <p v-if="sameDomeSelected" class="text-sm text-destructive">
          Original dome dan target dome tidak boleh sama.
        </p>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError('non_field_errors') }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError('detail') }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          {{ isEdit ? "Close" : "Cancel" }}
        </Button>

        <Button v-if="canMutate && !isEdit" :disabled="loading || !canSubmit" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>