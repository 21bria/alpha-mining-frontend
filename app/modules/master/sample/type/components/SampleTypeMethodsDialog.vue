<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useAsyncData } from "#app"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useApi } from "@/composables/useApi"
import { useNotify } from "@/composables/useNotify"
import SampleMethodFormDialog, { type SampleMethodPayload, } from "@/modules/master/sample/method/components/SampleMethodDialog.vue"
import { formatDateTime } from "@/utils/formatDate"
type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type SampleTypeRow = {
    id: number
    type_sample: string
}

type SampleMethodRow = {
    id?: number
    sample_type_id?: number | null
    sample_type_name?: string | null
    sample_method: string
    description?: string | null
    status?: number | null
    created_at?: string | null
}

const props = defineProps<{
    open: boolean
    sampleType?: SampleTypeRow | null
    role: UserRole
}>()

const emit = defineEmits<{
    (e: "update:open", v: boolean): void
    (e: "changed"): void
}>()

const { request } = useApi()
const notify = useNotify()

const canMutate = computed(() => props.role !== "GLOBAL_VIEWER")

const rows = ref<SampleMethodRow[]>([])
const loading = ref(false)

const formOpen = ref(false)
const formMode = ref<"create" | "edit">("create")
const selectedMethod = ref<SampleMethodRow | null>(null)
const formLoading = ref(false)
const formErrors = ref<Record<string, any> | null>(null)

async function loadMethods() {
    if (!props.sampleType?.id || !props.open) {
        rows.value = []
        return
    }

    loading.value = true
    try {
        const res = await request("/api/master/sample-methods/", {
            method: "GET",
            query: {
                sample_type: props.sampleType.id,
                page_size: 100,
            },
        })

        rows.value = res?.results ?? []
    } finally {
        loading.value = false
    }
}

watch(
    () => [props.open, props.sampleType?.id],
    async () => {
        await loadMethods()
    },
    { immediate: true }
)

function openCreate() {
    selectedMethod.value = {
        sample_type_id: props.sampleType?.id ?? null,
        sample_type_name: props.sampleType?.type_sample ?? null,
        sample_method: "",
        description: "",
        status: 1,
    }
    formErrors.value = null
    formMode.value = "create"
    formOpen.value = true
}

function openEdit(row: SampleMethodRow) {
    selectedMethod.value = row
    formErrors.value = null
    formMode.value = "edit"
    formOpen.value = true
}

async function submitMethod(payload: SampleMethodPayload) {
    formLoading.value = true
    formErrors.value = null

    try {
        const body = {
            ...payload,
            sample_type: props.sampleType?.id ?? payload.sample_type,
        }

        if (formMode.value === "create") {
            await request("/api/master/sample-methods/", {
                method: "POST",
                body,
            })
            notify.success(`Sample method "${body.sample_method}" created`)
        } else {
            await request(`/api/master/sample-methods/${payload.id}/`, {
                method: "PATCH",
                body,
            })
            notify.success(`Sample method "${body.sample_method}" updated`)
        }

        formOpen.value = false
        await loadMethods()
        emit("changed")
    } catch (e: any) {
        formErrors.value = e?.data ?? { detail: e?.message || "Failed to save" }
    } finally {
        formLoading.value = false
    }
}

async function removeMethod(row: SampleMethodRow) {
    try {
        await request(`/api/master/sample-methods/${row.id}/`, {
            method: "DELETE",
        })
        notify.success(`Sample method "${row.sample_method}" deleted`)
        await loadMethods()
        emit("changed")
    } catch (e: any) {
        notify.error(e?.data?.detail || e?.message || "Failed to delete")
    }
}
</script>
<template>
    <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
        <DialogContent class="w-[calc(100vw-1rem)] max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
            <div class="flex max-h-[90vh] flex-col">
                <DialogHeader class="shrink-0 border-b px-4 py-4 sm:px-6">
                    <DialogTitle class="text-base sm:text-lg">
                        Sample Methods - {{ sampleType?.type_sample ?? "-" }}
                    </DialogTitle>
                </DialogHeader>

                <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    <div class="space-y-4">
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div class="text-sm text-muted-foreground">
                                Detail child methods for selected sample type.
                            </div>

                            <Button v-if="canMutate" class="w-full sm:w-auto" @click="openCreate">
                                Add Method
                            </Button>
                        </div>

                        <!-- MOBILE CARD VIEW -->
                        <div class="space-y-3 md:hidden">
                            <div v-if="loading" class="rounded-md border p-4 text-center text-sm text-muted-foreground">
                                Loading...
                            </div>

                            <div v-else-if="!rows.length"
                                class="rounded-md border p-4 text-center text-sm text-muted-foreground">
                                No sample methods found.
                            </div>

                            <div v-for="item in rows" v-else :key="item.id" class="rounded-md border p-4 space-y-3">
                                <div>
                                    <div class="text-xs text-muted-foreground">Method</div>
                                    <div class="font-medium break-words">{{ item.sample_method }}</div>
                                </div>

                                <div>
                                    <div class="text-xs text-muted-foreground">Description</div>
                                    <div class="break-words">{{ item.description || "-" }}</div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <div class="text-xs text-muted-foreground">Status</div>
                                        <div>{{ item.status === 1 ? "Active" : "Inactive" }}</div>
                                    </div>

                                    <div>
                                        <div class="text-xs text-muted-foreground">Created</div>
                                        <div class="break-words">{{formatDateTime(item.created_at )|| "-" }}</div>
                                    </div>
                                </div>

                                <div v-if="canMutate" class="flex flex-col gap-2 sm:flex-row">
                                    <Button size="sm" variant="outline" class="w-full" @click="openEdit(item)">
                                        Edit
                                    </Button>
                                    <!-- <Button size="sm" variant="destructive" class="w-full" @click="removeMethod(item)">
                                        Delete
                                    </Button> -->
                                </div>
                            </div>
                        </div>

                        <!-- DESKTOP / TABLET TABLE VIEW -->
                        <div class="hidden md:block rounded-md border overflow-hidden">
                            <div class="w-full overflow-x-auto">
                                <table class="w-full min-w-[720px] text-sm">
                                    <thead class="bg-muted/50">
                                        <tr>
                                            <th class="p-3 text-left whitespace-nowrap">Method</th>
                                            <th class="p-3 text-left whitespace-nowrap">Description</th>
                                            <th class="p-3 text-left whitespace-nowrap">Status</th>
                                            <th class="p-3 text-left whitespace-nowrap">Created</th>
                                            <th class="p-3 text-right whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr v-if="loading">
                                            <td colspan="5" class="p-4 text-center text-muted-foreground">
                                                Loading...
                                            </td>
                                        </tr>

                                        <tr v-else-if="!rows.length">
                                            <td colspan="5" class="p-4 text-center text-muted-foreground">
                                                No sample methods found.
                                            </td>
                                        </tr>

                                        <tr v-for="item in rows" :key="item.id" class="border-t align-top">
                                            <td class="p-3 font-medium whitespace-nowrap">
                                                {{ item.sample_method }}
                                            </td>

                                            <td class="p-3 min-w-[240px]">
                                                <div class="max-w-[320px] break-words">
                                                    {{ item.description || "-" }}
                                                </div>
                                            </td>

                                            <td class="p-3 whitespace-nowrap">
                                                {{ item.status === 1 ? "Active" : "Inactive" }}
                                            </td>

                                            <td class="p-3 whitespace-nowrap">
                                                {{ formatDateTime(item.created_at ) || "-" }}
                                            </td>

                                            <td class="p-3">
                                                <div class="flex justify-end gap-2 whitespace-nowrap">
                                                    <Button v-if="canMutate" size="sm" variant="outline"
                                                        @click="openEdit(item)">
                                                        Edit
                                                    </Button>

                                                    <!-- <Button
                            v-if="canMutate"
                            size="sm"
                            variant="destructive"
                            @click="removeMethod(item)"
                          >
                            Delete
                          </Button> -->
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SampleMethodFormDialog 
                v-model:open="formOpen" 
                :mode="formMode" 
                :role="role"
                :initial="selectedMethod"
                :loading="formLoading" 
                :errors="formErrors || undefined" 
                @submit="submitMethod"
            />
        </DialogContent>
    </Dialog>
</template>