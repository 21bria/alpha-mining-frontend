<script setup lang="ts">
import DomeForm from "@/modules/selling/transfers/DomeForm.vue"
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="grid gap-2">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold">Transfer Selling</h3>
                    <p class="text-sm text-muted-foreground">Manage Transfer Selling Dome.</p>
                </div>
            </div>
        </div>

        <div class="w-full space-y-4">
            <div class="w-full">
                <DomeForm />
            </div>
        </div>

    </div>
</template>
