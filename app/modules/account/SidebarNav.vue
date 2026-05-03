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

// settings hanya SYSTEM
const canSystemSettings = computed(() =>
  auth.meLoaded && role.value === "SYSTEM"
)

const items = computed(() => {
  const disabled = !canSystemSettings.value

  return [
    {
      title: "Groups",
      to: "/account/settings/groups",
      disabled,
      disabledReason: disabled ? "no_access" : null,
    },
    {
      title: "Users",
      to: "/account/settings/users",
      disabled,
      disabledReason: disabled ? "no_access" : null,
    },
    {
      title: "Permissions",
      to: "/account/settings/permissions",
      disabled,
      disabledReason: disabled ? "no_access" : null,
    },
  ]
})

const isActive = (to: string) => route.path === to
</script>

<template>

  <nav class="flex flex-row lg:flex-col gap-1">
    <NuxtLink v-for="i in items" :key="i.to" :to="i.disabled ? route.path : i.to"
      class="rounded-md px-3 py-2 text-sm whitespace-nowrap" :class="[
        isActive(i.to) ? 'bg-muted font-medium' : 'hover:bg-muted/60',
        i.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      ]">
      {{ i.title }}

      <span v-if="i.disabledReason === 'soon'" class="ml-2 text-xs text-muted-foreground">
        (soon)
      </span>

      <span v-else-if="i.disabledReason === 'no_access'" class="ml-2 text-xs text-muted-foreground">
        (no access)
      </span>
    </NuxtLink>
    <!-- <div class="px-3 py-2 text-xs text-muted-foreground">
      role: {{ auth.user?.role }} | meLoaded: {{ auth.meLoaded }}
    </div> -->
  </nav>
</template>