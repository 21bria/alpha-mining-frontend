<script setup lang="ts">
import DomeForm from "@/modules/geology/compositing/DomeForm.vue"
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="grid gap-2">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold">Dome Compositing</h3>
                    <p class="text-sm text-muted-foreground">Manage dome compositing.</p>
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
