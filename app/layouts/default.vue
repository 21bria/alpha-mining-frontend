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
        <div class="@container/main grow overflow-y-auto hide-scrollbar p-4 lg:p-6">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none; /* IE & Edge */
  scrollbar-width: none; /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}
</style>