<script setup lang="ts">
import { computed } from "vue"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type HmUnitDetailRow = {
    id: string
    start_time: string | null
    end_time: string | null
    duration_min: number | null

    status?: number | null
    status_id?: number | null
    status_name?: string | null

    activity?: number | null
    activity_id?: number | null
    activity_name?: string | null

    location?: string | null
    location_id?: string | null
    location_name?: string | null

    category?: string | null
    description?: string | null

    user_id?: number | null
    username?: string | null
}

type HmUnitDetailData = {
    id: string
    iup?: number | null
    iup_code?: string | null
    iup_name?: string | null

    unit?: string | null
    unit_id?: string | null
    unit_code?: string | null
    unit_model?: string | null
    unit_vendor?: string | null

    date?: string | null
    shift?: string | null

    hm_start?: number | null
    hm_end?: number | null
    hm_total?: number | null

    status?: string | null
    username?: string | null

    details?: HmUnitDetailRow[]
}

const props = defineProps<{
    open: boolean
    loading?: boolean
    data?: HmUnitDetailData | null
}>()

const emit = defineEmits<{
    (e: "update:open", v: boolean): void
}>()

function formatNumber(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(Number(value))) return "-"
    return Number(value).toFixed(digits)
}

function formatDuration(value: number | null | undefined) {
    if (value == null || Number.isNaN(Number(value))) return "0 min"
    return `${Number(value)} min`
}

const totalDurationHours = computed(() => {
    const totalMin =
        props.data?.details?.reduce((sum, row) => sum + Number(row.duration_min || 0), 0) ?? 0
    return totalMin ? (totalMin / 60).toFixed(2) : "0.00"
})
</script>

<template>
    <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
        <DialogContent class="w-[95vw] max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden p-0">
            <div class="flex h-full max-h-[90vh] flex-col">
                <DialogHeader class="border-b px-4 py-3 sm:px-6">
                    <DialogTitle class="text-base sm:text-lg">
                        HM Unit Detail
                    </DialogTitle>
                </DialogHeader>

                <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">
                        Loading detail...
                    </div>

                    <div v-else-if="data" class="space-y-4 sm:space-y-6">
                        <!-- Header summary -->
                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">IUP</div>
                                <div class="font-medium break-words">
                                    {{ data.iup_code || "-" }}
                                </div>
                                <div v-if="data.iup_name" class="mt-1 text-xs text-muted-foreground break-words">
                                    {{ data.iup_name }}
                                </div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">Unit Vendor</div>
                                <div class="font-medium break-words">
                                    {{ data.unit_vendor || "-" }}
                                </div>
                                <div v-if="data.unit_model" class="mt-1 text-xs text-muted-foreground break-words">
                                    {{ data.unit_model }}
                                </div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">Date</div>
                                <div class="font-medium">{{ data.date || "-" }}</div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">Shift</div>
                                <div class="font-medium">{{ data.shift || "-" }}</div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">HM Start</div>
                                <div class="font-medium">{{ formatNumber(data.hm_start) }}</div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">HM End</div>
                                <div class="font-medium">{{ formatNumber(data.hm_end) }}</div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">HM Total</div>
                                <div class="font-semibold text-primary">
                                    {{ formatNumber(data.hm_total) }}
                                </div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">Status</div>
                                <div class="font-medium break-words">{{ data.status || "-" }}</div>
                            </div>
                        </div>

                        <!-- Detail summary -->
                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">Total Detail Rows</div>
                                <div class="font-medium">{{ data.details?.length ?? 0 }}</div>
                            </div>

                            <div class="rounded-lg border p-3">
                                <div class="text-xs text-muted-foreground">Total Duration (Hours)</div>
                                <div class="font-medium">{{ totalDurationHours }}</div>
                            </div>
                        </div>

                        <!-- Desktop table -->
                        <div class="hidden md:block overflow-x-auto rounded-lg border">
                            <table class="w-full min-w-[900px] text-sm">
                                <thead class="bg-muted/50">
                                    <tr>
                                        <th class="px-3 py-2 text-left font-medium">Start</th>
                                        <th class="px-3 py-2 text-left font-medium">End</th>
                                        <th class="px-3 py-2 text-left font-medium">Duration</th>
                                        <th class="px-3 py-2 text-left font-medium">Status</th>
                                        <th class="px-3 py-2 text-left font-medium">Activity</th>
                                        <th class="px-3 py-2 text-left font-medium">Location</th>
                                        <th class="px-3 py-2 text-left font-medium">Category</th>
                                        <th class="px-3 py-2 text-left font-medium">Description</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="row in data.details || []" :key="row.id" class="border-t align-top">
                                        <td class="px-3 py-2">{{ row.start_time || "-" }}</td>
                                        <td class="px-3 py-2">{{ row.end_time || "-" }}</td>
                                        <td class="px-3 py-2">{{ formatDuration(row.duration_min) }}</td>
                                        <td class="px-3 py-2">{{ row.status_name || "-" }}</td>
                                        <td class="px-3 py-2">{{ row.activity_name || "-" }}</td>
                                        <td class="px-3 py-2">{{ row.location_name || "-" }}</td>
                                        <td class="px-3 py-2">{{ row.category || "-" }}</td>
                                        <td class="px-3 py-2">{{ row.description || "-" }}</td>
                                    </tr>

                                    <tr v-if="!data.details?.length">
                                        <td colspan="8" class="px-3 py-6 text-center text-muted-foreground">
                                            No detail data
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile cards -->
                        <div class="grid grid-cols-1 gap-3 md:hidden">
                            <div v-for="(row, index) in data.details || []" :key="row.id"
                                class="rounded-lg border p-4 space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm font-semibold">
                                        Detail #{{ index + 1 }}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {{ formatDuration(row.duration_min) }}
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div class="text-xs text-muted-foreground">Start</div>
                                        <div class="font-medium">{{ row.start_time || "-" }}</div>
                                    </div>

                                    <div>
                                        <div class="text-xs text-muted-foreground">End</div>
                                        <div class="font-medium">{{ row.end_time || "-" }}</div>
                                    </div>

                                    <div class="col-span-2">
                                        <div class="text-xs text-muted-foreground">Status</div>
                                        <div class="font-medium break-words">{{ row.status_name || "-" }}</div>
                                    </div>

                                    <div class="col-span-2">
                                        <div class="text-xs text-muted-foreground">Activity</div>
                                        <div class="font-medium break-words">{{ row.activity_name || "-" }}</div>
                                    </div>

                                    <div class="col-span-2">
                                        <div class="text-xs text-muted-foreground">Location</div>
                                        <div class="font-medium break-words">{{ row.location_name || "-" }}</div>
                                    </div>

                                    <div class="col-span-2">
                                        <div class="text-xs text-muted-foreground">Category</div>
                                        <div class="font-medium break-words">{{ row.category || "-" }}</div>
                                    </div>

                                    <div class="col-span-2">
                                        <div class="text-xs text-muted-foreground">Description</div>
                                        <div class="font-medium break-words">{{ row.description || "-" }}</div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="!data.details?.length"
                                class="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                                No detail data
                            </div>
                        </div>
                    </div>

                    <div v-else class="py-8 text-center text-sm text-muted-foreground">
                        No detail selected
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>