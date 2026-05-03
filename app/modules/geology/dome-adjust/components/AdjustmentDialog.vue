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

export type DomeAdjustmentPayload = {
  id?: number
  dome: number | null
  target_total: number | null
  description?: string | null
}

type DomeAdjustmentFormState = {
  id?: number
  dome: number | null
  current_total: string
  target_total: string
  scale_factor: string
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
  (e: "submit", payload: DomeAdjustmentPayload): void
}>()

const { request } = useApi()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Dome Adjustment" : "Edit Dome Adjustment"
)

const local = ref<DomeAdjustmentFormState>({
  id: undefined,
  dome: null,
  current_total: "",
  target_total: "",
  scale_factor: "",
  description: "",
})

const tonnageLoading = ref(false)

function normalizeId(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v?.value ?? v?.id ?? v)
  return Number.isFinite(n) ? n : null
}

function toStringValue(v: any): string {
  return v == null ? "" : String(v)
}

function toNumberOrNull(v: any): number | null {
  if (v === "" || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function formatScaleFactor(current: string, target: string): string {
  const currentNum = Number(current)
  const targetNum = Number(target)

  if (!Number.isFinite(currentNum) || currentNum <= 0) return ""
  if (!Number.isFinite(targetNum) || targetNum <= 0) return ""

  return (targetNum / currentNum).toFixed(6)
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

async function fetchDomeCurrentTotal(domeId: number | null) {
  if (!domeId) {
    local.value.current_total = ""
    local.value.scale_factor = ""
    return
  }

  tonnageLoading.value = true
  try {
    const res = await request<any>("/api/geology/ore-productions/tonnage-by-pile/", {
      method: "GET",
      query: { dome_id: domeId },
    })

    const total = res?.tonnage_dome ?? res?.total_tonnage ?? res?.tonnage ?? res?.current_total ?? 0
    local.value.current_total = String(total)
    local.value.scale_factor = formatScaleFactor(
      local.value.current_total,
      local.value.target_total
    )
  } catch {
    local.value.current_total = ""
    local.value.scale_factor = ""
  } finally {
    tonnageLoading.value = false
  }
}

function submit() {
  const payload: DomeAdjustmentPayload = {
    id: local.value.id,
    dome: local.value.dome,
    target_total: toNumberOrNull(local.value.target_total),
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
      dome: normalizeId(props.initial?.dome ?? props.initial?.dome_id),
      current_total: toStringValue(props.initial?.current_total),
      target_total: toStringValue(props.initial?.target_total),
      scale_factor: toStringValue(props.initial?.scale_factor),
      description: props.initial?.description ?? "",
    }

    if (local.value.dome) {
      await fetchDomeCurrentTotal(local.value.dome)
    } else {
      local.value.scale_factor = formatScaleFactor(
        local.value.current_total,
        local.value.target_total
      )
    }
  },
  { immediate: true }
)

watch(
  () => local.value.dome,
  async (newDome, oldDome) => {
    if (!props.open) return

    if (!newDome) {
      local.value.current_total = ""
      local.value.scale_factor = ""
      return
    }

    if (newDome === oldDome) return

    await fetchDomeCurrentTotal(newDome)
  }
)

watch(
  () => local.value.target_total,
  () => {
    local.value.scale_factor = formatScaleFactor(
      local.value.current_total,
      local.value.target_total
    )
  }
)

watch(
  () => local.value.current_total,
  () => {
    local.value.scale_factor = formatScaleFactor(
      local.value.current_total,
      local.value.target_total
    )
  }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Dome</label>
          <SelectLookup :key="`dome-adjustment-${props.mode}-${local.id ?? 'new'}`" v-model="local.dome" label="Dome"
            endpoint="/api/master/lookups/mine-dome/" variant="field" label-key="pile_id" value-key="id"
            :selectedLabel="props.initial?.dome_name ?? props.initial?.dome_code ?? props.initial?.pile_id ?? null"
            :disabled="!canMutate" />
          <p v-if="fieldError('dome')" class="text-sm text-destructive">
            {{ fieldError('dome') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Current Total</label>
          <Input v-model="local.current_total" type="number" step="any" :disabled="true"
            placeholder="Auto calculated from ore productions" />
          <p class="text-xs text-muted-foreground">
            {{ tonnageLoading ? "Calculating current total..." : "Calculated from existing dome tonnage" }}
          </p>
          <p v-if="fieldError('current_total')" class="text-sm text-destructive">
            {{ fieldError('current_total') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Target Total</label>
          <Input v-model="local.target_total" type="number" step="any" :disabled="!canMutate"
            placeholder="Input target total" />
          <p v-if="fieldError('target_total')" class="text-sm text-destructive">
            {{ fieldError('target_total') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Scale Factor</label>
          <Input v-model="local.scale_factor" type="number" step="0.000001" :disabled="true"
            placeholder="Auto calculated" />
          <p class="text-xs text-muted-foreground">
            Preview only. Final value will be calculated by backend.
          </p>
          <p v-if="fieldError('scale_factor')" class="text-sm text-destructive">
            {{ fieldError('scale_factor') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="local.description" placeholder="Description" :disabled="!canMutate" />
          <p v-if="fieldError('description')" class="text-sm text-destructive">
            {{ fieldError('description') }}
          </p>
        </div>

        <p v-if="fieldError('non_field_errors')" class="text-sm text-destructive">
          {{ fieldError('non_field_errors') }}
        </p>
        <p v-if="fieldError('detail')" class="text-sm text-destructive">
          {{ fieldError('detail') }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">
          Cancel
        </Button>

        <Button v-if="canMutate" :disabled="loading || !local.dome || !local.target_total" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>