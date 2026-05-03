<script setup lang="ts">
import SidebarNav from "@/modules/master/mine-units/SidebarNav.vue"
</script>

<template>
  <div class="pb-16 space-y-6">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Mine Units</h2>
      <p class="text-muted-foreground">Manage Mine categories & units.</p>
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
