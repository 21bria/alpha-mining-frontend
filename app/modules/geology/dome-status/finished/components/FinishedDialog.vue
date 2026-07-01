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
import SelectLookup from "@/components/form/LookupSelect.vue"
import { useApi } from "@/composables/useApi"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

export type DomeFinishedPayload = {
  id?: number
  dome: number | null
  tonnage_dome?: number | null
  status_dome: string
  description?: string | null
}

type DomeFinishedFormState = {
  id?: number
  dome: number | null
  tonnage_dome: string
  status_dome: string
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
  (e: "submit", payload: DomeFinishedPayload): void
}>()

const { request } = useApi()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const title = computed(() =>
  props.mode === "create" ? "Add Dome Close" : "Edit Dome Close"
)

const statusOptions = [
  { value: "Finished", label: "Finished" },
  { value: "Continue", label: "Continue" },
]

const local = ref<DomeFinishedFormState>({
  id: undefined,
  dome: null,
  tonnage_dome: "",
  status_dome: "Finished",
  description: "",
})

const tonnageLoading = ref(false)

function normalizeId(v: any): number | null {
  if (v == null || v === "") return null
  const n = Number(v?.value ?? v?.id ?? v)
  return Number.isFinite(n) ? n : null
}

function toStringNumber(v: any): string {
  return v == null ? "" : String(v)
}

function toNumberOrNull(v: any): number | null {
  if (v === "" || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fieldError(key: string) {
  const e = props.errors?.[key]
  return Array.isArray(e) ? e[0] : e ?? null
}

function close() {
  emit("update:open", false)
}

async function fetchDomeTonnage(domeId: number | null) {
  if (!domeId) {
    local.value.tonnage_dome = ""
    return
  }

  tonnageLoading.value = true
  try {
    const res = await request<any>("/api/geology/ore-productions/tonnage-by-pile/", {
      method: "GET",
      query: { dome_id: domeId },
    })

    local.value.tonnage_dome = String(
      res?.tonnage_dome ?? res?.total_tonnage ?? res?.tonnage ?? 0
    )
  } catch {
    local.value.tonnage_dome = ""
  } finally {
    tonnageLoading.value = false
  }
}

function submit() {
  const payload: DomeFinishedPayload = {
    id: local.value.id,
    dome: local.value.dome,
    tonnage_dome: toNumberOrNull(local.value.tonnage_dome),
    status_dome: local.value.status_dome.trim(),
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
      tonnage_dome: toStringNumber(props.initial?.tonnage_dome),
      status_dome: props.initial?.status_dome ?? "Close",
      description: props.initial?.description ?? "",
    }

    if (local.value.dome) {
      await fetchDomeTonnage(local.value.dome)
    }
  },
  { immediate: true }
)

watch(
  () => local.value.dome,
  async (newDome, oldDome) => {
    if (!props.open) return

    if (!newDome) {
      local.value.tonnage_dome = ""
      return
    }

    if (newDome === oldDome) return

    await fetchDomeTonnage(newDome)
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
          <SelectLookup :key="`dome-${props.mode}-${local.id ?? 'new'}`" v-model="local.dome" label="Dome"
            endpoint="/api/master/lookups/mine-dome/" variant="field" label-key="pile_id" value-key="id"
            :selectedLabel="props.initial?.dome_name ?? props.initial?.dome_code ?? props.initial?.pile_id ?? null"
            :disabled="!canMutate" />
          <p v-if="fieldError('dome')" class="text-sm text-destructive">
            {{ fieldError('dome') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Tonnage Dome</label>
          <Input v-model="local.tonnage_dome" type="number" step="any" :disabled="true"
            placeholder="Auto calculated from ore productions" />
          <p class="text-xs text-muted-foreground">
            {{ tonnageLoading ? "Calculating tonnage..." : "Calculated from ore production by selected dome" }}
          </p>
          <p v-if="fieldError('tonnage_dome')" class="text-sm text-destructive">
            {{ fieldError('tonnage_dome') }}
          </p>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Status</label>
          <Select v-model="local.status_dome" :disabled="!canMutate">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="fieldError('status_dome')" class="text-sm text-destructive">
            {{ fieldError('status_dome') }}
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

        <Button v-if="canMutate" :disabled="loading || !local.dome || !local.status_dome.trim()" @click="submit">
          {{ loading ? "Saving..." : "Save" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>