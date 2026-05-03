<script setup lang="ts">
import { computed } from "vue"
import { useAuthStore } from "@/stores/auth"
import { useRoute } from "vue-router"

const auth = useAuthStore()
const route = useRoute()

type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

// normalize role
const role = computed<UserRole>(() => {
  const r = (auth.user?.role ?? "").toString().trim().toUpperCase()
  if (["SYSTEM", "MANAGEMENT", "GLOBAL_VIEWER", "SITE_USER"].includes(r))
    return r as UserRole
  return "SITE_USER"
})

const items = computed(() => {
  return [
    {
      title: "Close",
      to: "/geology/dome-status/close",
    },
    {
      title: "Finished",
      to: "/geology/dome-status/finished",
    },
  ]
})

const isActive = (to: string) => route.path === to
</script>

<template>
  <nav class="flex flex-row lg:flex-col gap-1">
    <NuxtLink v-for="i in items" :key="i.to" :to="i.to" class="rounded-md px-3 py-2 text-sm whitespace-nowrap" :class="[
      isActive(i.to)
        ? 'bg-muted font-medium'
        : 'hover:bg-muted/60'
    ]">
      {{ i.title }}
    </NuxtLink>
  </nav>
</template>