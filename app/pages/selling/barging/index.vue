<script setup lang="ts">
import ListForm from "@/modules/selling/barging/ListForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-2xl font-normal tracking-tight">
          Selling Barging data
          <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage barging records efficiently.
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">
      <div class="w-full">
        <ListForm />
      </div>
    </div>

  </div>
</template>

<style scoped></style>
