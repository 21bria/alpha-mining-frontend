<template>
  <div class="relative min-h-[calc(100vh-56px)] w-full overflow-hidden px-12 pt-8 pb-4 lg:px-14">
    <!-- CONTENT -->
    <div class="relative z-10 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- HEADER + FILTER -->
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-semibold tracking-tight">
              Dashboard
            </h2>
            <p class="text-xs text-muted-foreground">
              Select application menu based on active filter.
            </p>
          </div>

          <FilterControls />
        </div>

        <div class="grid grid-cols-12 gap-5 pt-6">
          <!-- LEFT: APP LAUNCHER -->
          <div class="col-span-12 xl:col-span-7">
            <div
              class="w-full rounded-[1.75rem] border bg-gradient-to-br from-background via-muted/20 to-background px-6 py-5 shadow-sm">
              <div class="flex flex-wrap gap-4">
                <button v-for="item in appMenus" :key="item.key" type="button"
                  class="group relative h-[120px] w-[165px] flex flex-col items-center justify-center gap-2 rounded-[1.4rem] border bg-card/80 p-3 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-primary/50 hover:shadow-lg active:scale-95"
                  @click="openAppMenu(item)">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-[1rem] shadow-md transition-all duration-300 group-hover:scale-110"
                    :class="item.iconClass">
                    <component :is="item.icon" class="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <p class="text-sm font-medium leading-none">
                      {{ item.label }}
                    </p>
                    <p class="mt-0.5 text-[11px] text-muted-foreground">
                      {{ item.description }}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- RIGHT: DASHBOARD INFO CARD -->
          <div class="col-span-12 xl:col-span-5">
            <div
              class="relative h-full min-h-[265px] overflow-hidden rounded-[1.75rem] border bg-gradient-to-br from-slate-950 via-slate-900 to-background p-7 shadow-sm">
              <div class="relative z-10 flex h-full flex-col justify-between gap-6">
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.25em] text-orange-400">
                    Mining ERP Dashboard
                  </p>

                  <h1 class="mt-4 max-w-md text-3xl font-bold leading-tight text-white">
                    Monitor production, quality, inventory, and reports in one workspace.
                  </h1>

                  <p class="mt-4 max-w-lg text-sm leading-6 text-slate-400">
                    Use the active filter to open each module with the same period, IUP,
                    and reporting context.
                  </p>
                </div>
              </div>

              <div class="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/20 blur-3xl" />
              <div class="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BACKGROUND BIG TEXT INSIDE INDEX FRAME -->
    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden">
      <h1 class="translate-y-8 select-none whitespace-nowrap text-center text-[110px] font-extrabold tracking-tight
           text-gray-900/5 dark:text-white/[0.035]
           md:text-[150px] xl:text-[180px]">
        Mine Dashboard
      </h1>

      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import FilterControls from '@/components/filters/FilterControls.vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { cleanQuery } from '@/utils/query'

import {
  FileSliders,
  TrendingUp,
  ChartArea,
  ChartScatter,
  TrendingUpDown,
  Settings2,
  ChartPie,
  ChartNetwork
} from 'lucide-vue-next'

const router = useRouter()
const chartFilter = useChartFilterStore()

type AppMenuItem = {
  key: string
  label: string
  description: string
  path: string
  icon: any
  iconClass: string
}

const appMenus: AppMenuItem[] = [
  {
    key: 'production',
    label: 'Production',
    description: 'Mining production',
    path: '/productions',
    icon: ChartPie,
    iconClass: 'bg-gradient-to-br from-orange-400 to-orange-600'
  },
  {
    key: 'barging',
    label: 'Barging',
    description: 'Barging & selling',
    path: '/barging',
    icon: ChartScatter,
    iconClass: 'bg-gradient-to-br from-sky-400 to-blue-600'
  },
  {
    key: 'quality',
    label: 'Quality',
    description: 'Ore quality',
    path: '/quality',
    icon: ChartNetwork,
    iconClass: 'bg-gradient-to-br from-green-400 to-green-600'
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    description: 'Unit maintenance',
    path: '/maintenance',
    icon: Settings2,
    iconClass: 'bg-gradient-to-br from-violet-400 to-purple-600'
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Stockpile balance',
    path: '/inventory',
    icon: TrendingUp,
    iconClass: 'bg-gradient-to-br from-amber-400 to-yellow-600'
  },
  {
    key: 'compile',
    label: 'Compile',
    description: 'Automatic summaries',
    path: '/report/compile',
    icon: FileSliders,
    iconClass: 'bg-gradient-to-br from-red-400 to-red-600'
  }
]

function buildActiveQuery() {
  const type = chartFilter.type

  const query: Record<string, any> = {
    filter_type: type || undefined,
    iup_id: chartFilter.iup_id || undefined
  }

  if (type === 'daily') {
    query.filter_date = chartFilter.date || undefined
  }

  if (type === 'weekly') {
    query.year = chartFilter.year || undefined
    query.week = chartFilter.week || undefined
  }

  if (type === 'monthly') {
    query.year = chartFilter.year || undefined
    query.month = chartFilter.month?.value || undefined
  }

  if (type === 'yearly') {
    query.year = chartFilter.year || undefined
  }

  if (type === 'range') {
    query.date_start = chartFilter.range?.start || undefined
    query.date_end = chartFilter.range?.end || undefined
  }

  return cleanQuery(query)
}

function openAppMenu(item: AppMenuItem) {
  router.push({
    path: item.path,
    query: buildActiveQuery()
  })
}
</script>

<style scoped>
button {
  transition: all 0.25s ease;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>