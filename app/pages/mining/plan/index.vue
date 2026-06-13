<script setup lang="ts">
import { computed, ref } from "vue"
import ProductionForm from "@/modules/mining/plan/production/ListForm.vue"
import BargingForm from "@/modules/mining/plan/barging/ListForm.vue"

const activeTab = ref<"production" | "barging">("production")

const tabs = [
  {
    key: "production",
    title: "Plan Production",
    description: "Mining production plan",
    icon: "i-lucide-chart-column",
  },
  {
    key: "barging",
    title: "Plan Barging",
    description: "Barging shipment plan",
    icon: "i-lucide-arrow-up-narrow-wide",
  },
] as const

const activeTitle = computed(() => {
  return tabs.find((tab) => tab.key === activeTab.value)?.title
})

const activeDescription = computed(() => {
  return tabs.find((tab) => tab.key === activeTab.value)?.description
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-2xl font-normal tracking-tight">
        {{ activeTitle }}
        <span class="text-xl">✨</span>
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ activeDescription }}
      </p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <!-- Left Tabs -->
      <aside class="rounded-xl border bg-card p-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition"
          :class="
            activeTab === tab.key
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
          "
          @click="activeTab = tab.key">
          <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon :name="tab.icon" class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">
              {{ tab.title }}
            </p>
            <p class="mt-1 line-clamp-2 text-xs">
              {{ tab.description }}
            </p>
          </div>
        </button>
      </aside>

      <!-- Content -->
      <section class="min-w-0">
        <ProductionForm v-if="activeTab === 'production'" />
        <BargingForm v-else />
      </section>
    </div>
  </div>
</template>