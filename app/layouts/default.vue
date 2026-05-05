<script setup lang="ts">
import { computed } from "vue"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()

const userPerms = computed(() => {
  const perms = (auth.user?.permissions ?? []) as string[]
  return new Set<string>(perms)
})

</script>

<template>
  <SidebarProvider>
    <LayoutAppSidebar />

    <SidebarInset class="h-screen overflow-hidden">
      <LayoutHeader />

      <div class="flex flex-col flex-1 overflow-hidden">
        <div class="@container/main p-4 lg:p-6 grow">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>

  <!-- GLOBAL TOAST -->
  <!-- <Toaster position="top-right" rich-colors /> -->
</template>

<style scoped></style>
