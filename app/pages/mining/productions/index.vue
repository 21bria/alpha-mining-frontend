<script setup lang="ts">
import ListForm from "@/modules/mining/productions/ListForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- <div class="grid gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Mining productions 
        </h2>
        <p class="text-muted-foreground">
          Mining production data
        </p>
      </div>
    </div> -->

    <div class="w-full space-y-4">
      <div class="w-full">
        <ListForm />
      </div>
    </div>

  </div>
</template>

<style scoped></style>
