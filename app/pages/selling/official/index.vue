<script setup lang="ts">
import ListForm from "@/modules/selling/official/ListForm.vue"
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="grid gap-2">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold">Official Selling</h3>
                    <p class="text-sm text-muted-foreground">Manage data official selling.</p>
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
