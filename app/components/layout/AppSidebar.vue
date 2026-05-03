<script setup lang="ts">
import { computed } from "vue"
import type { NavGroup, NavLink, NavSectionTitle } from "~/types/nav"
// import { navMenu as navMenuRaw, navMenuBottom as navMenuBottomRaw } from "~/constants/menus"
import { navMenu as navMenuRaw } from "~/constants/menus"
import { navMenuBottom as navMenuBottomRaw } from "~/constants/menus/bottom"
import { filterNavMenu, filterNavMenuItems } from "@/utils/permissionMenu"
import { useAuthStore } from "@/stores/auth"

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ("children" in item) return resolveComponent("LayoutSidebarNavGroup")
  return resolveComponent("LayoutSidebarNavLink")
}

const auth = useAuthStore()

const userPerms = computed(() => {
  const perms = (auth.user?.permissions ?? []) as string[]
  return new Set<string>(perms)
})

// satu pintu: filter section + auto hide heading kosong
const navMenu = computed(() => filterNavMenu(navMenuRaw, userPerms.value))

// bottom juga difilter (kalau kamu kasih require di menu bawah)
const navMenuBottom = computed(() => filterNavMenuItems(navMenuBottomRaw as any, userPerms.value))

const teams = [{ name: "Alpha Apps.", logo: "i-lucide-square-code", plan: "Mining-Dashboard" }]

const user = computed(() => {
  const profile = auth.user?.profile

  return {
    name: profile?.full_name || auth.user?.full_name || auth.user?.username || 'User',
    email: auth.user?.email || '-',
    avatar: profile?.avatar_url || '',
  }
})

const { sidebar } = useAppSettings()
</script>

<template>
  <Sidebar :collapsible="sidebar?.collapsible" :side="sidebar?.side" :variant="sidebar?.variant">
    <SidebarHeader>
      <LayoutSidebarNavHeader :teams="teams" />
      <Search />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in navMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>

        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in nav.items" :key="index" :item="item" />
      </SidebarGroup>

      <SidebarGroup class="mt-auto">
        <component :is="resolveNavItemComponent(item)" v-for="(item, index) in navMenuBottom" :key="index" :item="item"
          size="sm" />
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <LayoutSidebarNavFooter :user="user" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>