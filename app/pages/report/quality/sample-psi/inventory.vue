<script setup lang="ts">
import ListForm from "@/modules/report/quality/sample-psi/inventory/ListForm.vue"
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="grid gap-2">
            <div class="flex items-center justify-between">
                <div>
                <h2 class="text-2xl font-normal tracking-tight">
                Inventory reconciliation (PSI)
                <span class="text-xl">✨</span>
                </h2>
                <p class="text-sm text-muted-foreground">
                 View inventory psi records efficiently.
                </p>
                </div>
            </div>
        </div>

        <div class="w-full space-y-4">
            <div class="w-full">
                <ListForm />
            </div>
        </div>

    </div>
</template>