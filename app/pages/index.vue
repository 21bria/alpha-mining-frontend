<template>
  <div class="relative min-h-[calc(100vh-56px)] w-full overflow-hidden px-12 pt-4 pb-4 lg:px-14">
    <!-- CONTENT -->
    <div class="relative z-10 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- HEADER + FILTER -->
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
            Hi, Welcome Back
            <span class="text-xl">👋</span>
          </h2>

          <p class="text-xs text-muted-foreground">
            Access your applications and operational insights from one place.
          </p>
        </div>

          <!-- <FilterControls /> -->
        <FilterControls
          :role="auth.user?.role"
          :fixed-iup="auth.iupAccess?.default_iup?.id"
          @apply="handleApplyFilter"
        />
        </div>

        <div class="grid grid-cols-12 gap-5 pt-6">
          <!-- LEFT: APP LAUNCHER -->
          <div class="col-span-12 xl:col-span-7">
            <!-- <p class="text-xs">
              role: {{ auth.user?.role }}
            </p>
            <pre class="text-xs">
              {{ JSON.stringify(auth.iupAccess, null, 2) }}
            </pre> -->
            <div
              class="w-full rounded-[1.35rem] border bg-gradient-to-br from-background via-muted/20 to-background px-4 py-6 shadow-sm sm:px-6 sm:py-5">
              <div
                class="mx-auto grid max-w-4xl grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-5 justify-items-center">
                <button v-for="item in appMenus" :key="item.key" type="button"
                  class="group flex min-w-0 flex-col items-center justify-start gap-2 p-1 text-center transition-all duration-300 hover:scale-105 active:scale-95"
                  @click="openAppMenu(item)">
                  <div
                    class="flex h-14 w-14 items-center justify-center rounded-[1.35rem] shadow-lg ring-1 ring-white/15 transition-all duration-300 group-hover:scale-110 sm:h-16 sm:w-16 sm:rounded-[1.5rem]"
                    :class="item.iconClass">
                    <component :is="item.icon" class="h-7 w-7 text-white sm:h-8 sm:w-8" />
                  </div>

                  <div class="max-w-full min-w-0">
                    <p class="truncate text-[12px] font-medium leading-tight sm:text-sm">
                      {{ item.label }}
                    </p>
                    <p class="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
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
                    Mining Intelligence Platform
                  </p>

                  <h1 class="mt-4 max-w-md text-3xl font-bold leading-tight text-white">
                    AI-powered monitoring and operational analysis for production, quality, inventory, and reports in one workspace.
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
         Hallo Alpha
      </h1>

      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FilterControls from '@/components/filters/FilterControls.vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { cleanQuery } from '@/utils/query'
import { useAuthStore } from '~/stores/auth'
import { toast } from 'vue-sonner'

const auth = useAuthStore()
const router = useRouter()
const chartFilter = useChartFilterStore()

watch(
  () => auth.iupAccess?.default_iup?.id,
  (iupId) => {
    if (auth.user?.role === 'SITE_USER' && iupId) {
      chartFilter.setIup(iupId)
    }
  },
  { immediate: true }
)

import {
  TrendingUp,
  ChartScatter,
  Settings2,
  ChartPie,
  ChartNetwork,
  MessageCircleCode,
  FileCheck
} from 'lucide-vue-next'



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
  // {
  //   key: 'compile',
  //   label: 'Compile',
  //   description: 'Automatic summaries',
  //   path: '/report/compile',
  //   icon: FileSliders,
  //   iconClass: 'bg-gradient-to-br from-red-400 to-red-600'
  // },
  {
    key: 'management',
    label: 'Report',
    description: 'Report management',
    path: '/management/report',
    icon: FileCheck,
    iconClass: 'bg-gradient-to-br from-red-400 to-red-600'
  },

  {
    key: 'alpha-hallo',
    label: 'Alpha',
    description: 'Alpha assistant',
    path: '/alpha',
    icon: MessageCircleCode,
    iconClass: 'bg-gradient-to-br from-cyan-400 to-cyan-600'
  }
]

function handleApplyFilter(payload: any) {
  chartFilter.apply(payload)
}

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


// function openAppMenu(item: AppMenuItem) {
//   const role = auth.user?.role

//   if (
//     ['SYSTEM','MANAGEMENT', 'GLOBAL_VIEWER'].includes(role || '') &&
//     !chartFilter.iup_id
//   ) {
//     toast.warning('Please select IUP first')
//     return
//   }

//   router.push({
//     path: item.path,
//     query: buildActiveQuery()
//   })
// }
function openAppMenu(item: AppMenuItem) {
  const role = auth.user?.role

  // Alpha sementara private
  if (
    item.key === 'alpha-hallo' &&
    !['SYSTEM', 'MANAGEMENT'].includes(role || '')
  ) {
    toast.warning('Alpha Assistant is currently in management preview.')
    return
  }

  const skipIupRequired = [
    'alpha-hallo'
  ].includes(item.key)

  const needIup =
    !skipIupRequired &&
    ['SYSTEM', 'MANAGEMENT', 'GLOBAL_VIEWER'].includes(role || '') &&
    !chartFilter.iup_id

  if (needIup) {
    toast.warning('Please select IUP first')
    return
  }

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