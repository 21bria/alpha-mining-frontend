<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
    search?: string
    loading?: boolean
    placeholder?: string
    actionLabel?: string
    disableSearch?: boolean

    showAdd?: boolean
    showExport?: boolean
    showImport?: boolean
    showBulkDelete?: boolean
    showDownloadTemplate?: boolean
    showSyncData?: boolean

    disableAdd?: boolean
    disableExport?: boolean
    disableImport?: boolean
    disableBulkDelete?: boolean
    disableDownloadTemplate?: boolean
    disableSyncData?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:search', v: string): void
    (e: 'add'): void
    (e: 'import'): void
    (e: 'export'): void
    (e: 'bulk-delete'): void
    (e: 'download-template'): void
    (e: 'sync-data'): void
}>()

const model = computed({
    get: () => props.search ?? '',
    set: (v: string) => emit('update:search', v),
})
</script>

<template>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1">
            <Input v-model="model" :disabled="disableSearch" :placeholder="placeholder ?? 'Search...'"
                class="sm:max-w-sm" />
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button :disabled="loading" size="sm" class="ml-auto h-8 flex">
                    <Icon name="i-radix-icons-mixer-horizontal" class="h-4 w-4" />
                    <span class="hidden sm:inline ml-2">{{ actionLabel ?? 'Actions' }}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuItem v-if="showAdd !== false" :disabled="disableAdd || loading" @select="emit('add')">
                    Add
                </DropdownMenuItem>

                <DropdownMenuSeparator v-if="(showImport !== false) || (showExport !== false)" />

                <DropdownMenuItem v-if="showImport !== false" :disabled="disableImport || loading"
                    @select="emit('import')">
                    Import
                </DropdownMenuItem>

                <DropdownMenuItem v-if="showExport !== false" :disabled="disableExport || loading"
                    @select="emit('export')">
                    Export
                </DropdownMenuItem>

                <DropdownMenuSeparator
                    v-if="(showBulkDelete !== false) || (showDownloadTemplate !== false) || (showSyncData !== false)" />

                <DropdownMenuItem v-if="showBulkDelete !== false" :disabled="disableBulkDelete || loading"
                    @select="emit('bulk-delete')">
                    Bulk Delete
                </DropdownMenuItem>

                <DropdownMenuItem v-if="showDownloadTemplate !== false" :disabled="disableDownloadTemplate || loading"
                    @select="emit('download-template')">
                    Download Template
                </DropdownMenuItem>

                <DropdownMenuItem v-if="showSyncData !== false" :disabled="disableSyncData || loading"
                    @select="emit('sync-data')">
                    Sync Data
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
