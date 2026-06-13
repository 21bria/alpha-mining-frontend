<script setup lang="ts">
import SidebarNav from "@/modules/master/sample/SidebarNav.vue"
</script>

<template>
  <div class="pb-16 space-y-6">
    <div class="space-y-0.5">
        <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
          Type & Matehod data
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage type/method records efficiently.
        </p>
    </div>

    <Separator class="my-6" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-2">
        <ClientOnly>
          <SidebarNav />
          <template #fallback>
            <div class="space-y-2">
              <div class="h-9 rounded-md bg-muted/60" />
              <div class="h-9 rounded-md bg-muted/60" />
            </div>
          </template>
        </ClientOnly>
      </div>

      <div class="lg:col-span-9">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
