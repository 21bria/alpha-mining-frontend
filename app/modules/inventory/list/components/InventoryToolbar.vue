<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { Button } from "@/components/ui/button"

import LookupSelect from "@/components/data-table/LookupSelect.vue"
import AdvancedFiltersDrawer from "@/components/data-table/AdvancedFiltersDrawer.vue"
import { inventoryFilters } from "@/modules/inventory/list/filters"
import type { FilterSchema } from "@/types/table"

type InventoryFilters = {
    iup_id: number | null
    material: string | null
    sampling_area: string | null
    domes: string[]
}

const props = defineProps<{
  filters: InventoryFilters
  loading?: boolean
  canCopy?: boolean
}>()

const emit = defineEmits<{
  (e: "apply", value: InventoryFilters): void
  (e: "reset"): void
  (e: "copy"): void
}>()

const local = ref<InventoryFilters>({
    iup_id: null,
    material: null,
    sampling_area: null,
    domes: [],
})

const advancedOpen = ref(false)

const topFilters = computed(() =>
    inventoryFilters.filter((f) => (f.placement ?? "drawer") === "top")
)

const drawerFilters = computed(() =>
    inventoryFilters.filter((f) => (f.placement ?? "drawer") !== "top")
)

watch(
    () => props.filters,
    (v) => {
        local.value = {
            iup_id: v?.iup_id ?? null,
            material: v?.material ?? null,
            sampling_area: v?.sampling_area ?? null,
            domes: [...(v?.domes ?? [])],
        }
    },
    { immediate: true, deep: true }
)

watch(
    () => local.value.sampling_area,
    () => {
        local.value.domes = []
    }
)

function getDependsObject(filter: FilterSchema) {
    if (!("depends" in filter) || !filter.depends?.length) return undefined

    const out: Record<string, any> = {}

    for (const depKey of filter.depends) {
        const queryKey =
            "queryMap" in filter && filter.queryMap?.[depKey]
                ? filter.queryMap[depKey]
                : depKey

        out[queryKey] = (local.value as any)[depKey]
    }

    return out
}

function isDependsMissing(filter: FilterSchema) {
    if (!("depends" in filter) || !filter.depends?.length) return false

    return filter.depends.some((depKey) => {
        const value = (local.value as any)[depKey]
        if (Array.isArray(value)) return value.length === 0
        return !value
    })
}

function apply() {
    emit("apply", {
        iup_id: local.value.iup_id,
        material: local.value.material,
        sampling_area: local.value.sampling_area,
        domes: [...local.value.domes],
    })
}

function reset() {
    local.value = {
        iup_id: null,
        material: null,
        sampling_area: null,
        domes: [],
    }
    emit("reset")
}

const activeBadges = computed(() => {
    const items: string[] = []

    if (local.value.iup_id) items.push(`${local.value.iup_id}`)
    if (local.value.material) items.push(`Material: ${local.value.material}`)
    if (local.value.sampling_area) items.push(`Stockpile: ${local.value.sampling_area}`)
    local.value.domes.forEach((v) => items.push(`Dome: ${v}`))

    return items
})
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div class="flex flex-wrap items-center gap-2">
                <template v-for="f in topFilters" :key="String('key' in f ? f.key : '')">
                    <LookupSelect v-if="f.kind === 'select' && !f.multiple"
                        v-model="local[f.key as keyof InventoryFilters]" :label="f.label" :endpoint="f.endpoint"
                        :label-key="'labelKey' in f ? f.labelKey : undefined"
                        :value-key="'valueKey' in f ? f.valueKey : undefined"
                        :disabled="props.loading || isDependsMissing(f)" :depends="getDependsObject(f)" />
                </template>

                <AdvancedFiltersDrawer v-if="drawerFilters.length" v-model:open="advancedOpen"
                    v-model:modelValue="local" :filters="drawerFilters" :loading="props.loading"
                    title="Advanced Filters" @apply="apply" @reset="reset" />

                <Button class="h-9" @click="apply">Filter</Button>
                <Button class="h-9" variant="ghost" @click="reset">Reset</Button>
            </div>

            <div class="flex items-center gap-2">
                <button @click="emit('copy')" :disabled="!props.canCopy"
                    class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
                    title="Copy table">
                    <Icon name="i-lucide-copy" class="w-4 h-4" />
                </button>
            </div>

        </div>

        <div v-if="activeBadges.length" class="flex flex-wrap gap-2">
            <span v-for="item in activeBadges" :key="item"
                class="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs">
                {{ item }}
            </span>
        </div>
    </div>
</template>