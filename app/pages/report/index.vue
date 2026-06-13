<script setup lang="ts">
import { computed, ref } from "vue"
import { reportItems } from "~/constants/menus/report-items"
import { filterNavMenuItems } from "@/utils/permissionMenu"
import { useAuthStore } from "@/stores/auth"
import type { NavLink } from "~/types/nav"

const router = useRouter()
const auth = useAuthStore()

function closeDialog() {
  router.back()
}

const search = ref("")
const activeCategory = ref("All Reports")
const openGroups = ref<string[]>([])

const categories = ["All Reports", "Quality", "Laboratory", "Selling", "Export"]

const userPerms = computed(() => {
  const perms = (auth.user?.permissions ?? []) as string[]
  return new Set<string>(perms)
})

const permittedReportItems = computed(() => {
  return filterNavMenuItems(reportItems as any, userPerms.value)
})

function isNavLink(item: unknown): item is NavLink {
  return !!item && typeof item === "object" && "link" in item
}

const safeReportItems = computed(() => {
  return permittedReportItems.value.map((item: any) => {
    const children =
      "children" in item
        ? item.children.filter(isNavLink)
        : []

    return {
      ...item,
      children,
    }
  })
})

const filteredItems = computed(() => {
  const q = search.value.toLowerCase().trim()

  let items = safeReportItems.value

  if (activeCategory.value !== "All Reports") {
    items = items.filter((item: any) => item.category === activeCategory.value)
  }

  if (!q) return items

  return items.filter((item: any) => {
    const titleMatch = item.title.toLowerCase().includes(q)

    const childMatch = item.children.some((child: NavLink) =>
      child.title.toLowerCase().includes(q)
    )

    return titleMatch || childMatch
  })
})

function toggleGroup(title: string) {
  openGroups.value = openGroups.value.includes(title)
    ? openGroups.value.filter((t) => t !== title)
    : [...openGroups.value, title]
}

function isGroupOpen(title: string) {
  return openGroups.value.includes(title)
}
</script>

<template>
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" @click="closeDialog">
  <div class="max-h-[86vh] w-full max-w-7xl overflow-hidden rounded-[14px] border bg-background shadow-2xl" @click.stop>
    <div class="p-4">
      <!-- Header -->
      <div class="flex flex-col gap-4 border-b pb-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">
              Reports Hub
            </h2>
            <p class="text-sm text-muted-foreground">
              Browse and access all reporting modules
            </p>
          </div>

         <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            @click="closeDialog"
            >
            <Icon name="i-lucide-x" class="h-5 w-5" />
            </button>
        </div>

        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="rounded-full px-4 py-2 text-sm font-semibold transition"
              :class="
                activeCategory === cat
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              "
              @click="activeCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <div class="relative w-full lg:w-[380px]">
            <Icon
              name="i-lucide-search"
              class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              v-model="search"
              placeholder="Search reports"
              class="h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <!-- Content -->
        <div class="max-h-[62vh] overflow-y-auto py-7 pr-2">
          <div class="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <template v-for="item in filteredItems" :key="item.title">
              <!-- Direct Link -->
              <NuxtLink
                v-if="'link' in item && item.link"
                :to="item.link"
                class="group flex items-center gap-4 rounded-2xl p-3 transition hover:bg-muted"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon :name="item.icon || 'i-lucide-file-text'" class="h-6 w-6" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-sm font-normal">
                      {{ item.title }}
                    </p>
                    <span
                      v-if="item.new"
                      class="rounded-full bg-lime-400 px-2 py-0.5 text-xs font-normal text-black"
                    >
                      New
                    </span>
                  </div>
                  <p class="truncate text-sm text-muted-foreground">
                    Open report module
                  </p>
                </div>
              </NuxtLink>

              <!-- Parent With Children -->
             <div
                v-else-if="item.children?.length"
                class="group rounded-2xl p-3 transition hover:bg-muted"
                >
                <button
                    type="button"
                    class="flex w-full items-start gap-4 text-left"
                    @click="toggleGroup(item.title)"
                >
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon :name="item.icon || 'i-lucide-folder'" class="h-6 w-6" />
                    </div>

                    <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                        <p class="truncate text-sm font-normal">
                        {{ item.title }}
                        </p>

                        <Icon
                        name="i-lucide-chevron-right"
                        class="h-5 w-5 text-muted-foreground transition"
                        :class="isGroupOpen(item.title) ? 'rotate-90' : ''"
                        />
                    </div>

                    <p v-if="!isGroupOpen(item.title)" class="mt-1 text-sm text-muted-foreground">
                        {{ item.children.length }} report options
                    </p>
                    </div>
                </button>

                <div
                    v-if="isGroupOpen(item.title)"
                    class="ml-[70px] mt-3 space-y-1 border-l pl-3"
                >
                    <NuxtLink
                    v-for="child in item.children"
                    :key="child.title"
                    :to="child.link"
                    class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                    <Icon :name="child.icon || 'i-lucide-circle'" class="h-3.5 w-3.5" />
                    <span>{{ child.title }}</span>
                    </NuxtLink>
                </div>
                </div>
            </template>
          </div>

          <div
            v-if="!filteredItems.length"
            class="flex h-40 items-center justify-center text-sm text-muted-foreground"
          >
            No reports found.
          </div>
        </div>
    </div>
  </div>
</div>
</template>