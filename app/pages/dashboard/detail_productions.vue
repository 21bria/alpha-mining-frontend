<script setup lang="ts">
// import type { number } from 'echarts/core'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
const OreMovement = defineAsyncComponent(() => import('@/modules/dashboard/mining/OreMovement.vue'))
const TopSoilMovement = defineAsyncComponent(() => import('@/modules/dashboard/mining/TopSoilMovement.vue'))
const ObMovement = defineAsyncComponent(() => import('@/modules/dashboard/mining/ObMovement.vue'))
const WasteMovement = defineAsyncComponent(() => import('@/modules/dashboard/mining/WasteMovement.vue'))
const QuarryMovement = defineAsyncComponent(() => import('@/modules/dashboard/mining/QuarryMovement.vue'))
const OthersMovement = defineAsyncComponent(() => import('@/modules/dashboard/mining/OthersMovement.vue'))

const route = useRoute()
const filterType = String(route.query.filter_type || '')

// State untuk grand total
const grandTotal = ref({ lim: 0, sap: 0, total: 0, avg: 0 })
const grandTotalOb = ref({ plan: 0, total: 0,achievement:0, avg: 0 })
const grandTotalTopsoil = ref({ plan: 0, total: 0,achievement:0, avg: 0 })
const grandTotalWaste = ref({ plan: 0, total: 0,achievement:0, avg: 0 })
const grandTotalQuarry= ref({ plan: 0, total: 0,achievement:0, avg: 0 })
const grandTotalOthers= ref({ plan: 0, total: 0,achievement:0, avg: 0 })

// Fungsi untuk update nilai dari child
// function updateGrandTotal(val: { lim: number; sap: number; total: number;avg: number }) {
//     grandTotal.value = val
// }
// function updateTotalOb(val: { plan: number; total: number; achievement:number; avg: number }) {
//     grandTotalOb.value = val
// }
// function updateTotalTopsoil(val: { plan: number; total: number; achievement:number; avg: number }) {
//     grandTotalTopsoil.value = val
// }

// util format
function formatShortNumber(num: number) {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(num)
}
</script>

<template>
    <div class="w-full flex flex-col gap-4">
        <div class="mb-2">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Detail Mining</h1>
            <!-- <button @click="$router.push('/productions')" class="text-sm text-blue-500 underline">
                ← Back
            </button> -->
        </div>
        <!-- Tombol Kembali -->
        <main class="flex flex-1 flex-col gap-4 md:gap-6">
            <div class="grid grid-cols-12 gap-6">
                <!-- Kiri: Ore Chart -->
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
                            <CardHeader>
                                <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                                    <div class="flex flex-col gap-1">
                                        <CardTitle>Ore Movements</CardTitle>
                                    </div>
                                    <div
                                        class="flex divide-x divide-gray-300 dark:divide-gray-700 text-sm w-full md:w-auto">
                                        <div class="px-4 py-2">
                                            <p class="text-gray-500 dark:text-gray-400">Limonite</p>
                                            <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                {{ formatShortNumber(grandTotal.lim) }}
                                            </p>
                                        </div>
                                        <div class="px-4 py-2">
                                            <p class="text-gray-500 dark:text-gray-400">Saprolite</p>
                                            <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                {{ formatShortNumber(grandTotal.sap) }}
                                            </p>
                                        </div>
                                        <div class="px-4 py-2">
                                            <p class="text-gray-500 dark:text-gray-400">Totals</p>
                                            <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                {{ formatShortNumber(grandTotal.total) }}
                                            </p>
                                        </div>
                                        <div class="px-4 py-2">
                                            <p class="text-gray-500 dark:text-gray-400">Average</p>
                                            <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                {{ formatShortNumber(grandTotal.avg) }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent class="overflow-hidden overflow-x-auto">
                                <OreMovement :filter-type="filterType"
                                    @update:grandTotal="val => grandTotal = val" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <!-- Kanan: Topsoil Chart  -->
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                            <Card class="h-full w-full overflow-hidden">
                                <CardHeader>
                                    <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                                        <!-- Kiri: Judul + Link -->
                                        <div class="flex flex-col gap-1">
                                            <CardTitle>Topsoil Movements</CardTitle>
                                        </div>
                                        <!-- Kanan: Summary Box tanpa border, hanya garis tengah -->
                                        <div
                                            class="flex divide-x divide-gray-300 dark:divide-gray-700 text-sm w-full md:w-auto">
                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Actual</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                      {{ formatShortNumber(grandTotalTopsoil.total) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Plan</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                  {{ formatShortNumber(grandTotalTopsoil.plan) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Ach</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                      {{ formatShortNumber(grandTotalTopsoil.achievement) }}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <TopSoilMovement :filter-type="filterType"
                                     @update:grandTotalNonOre="val => grandTotalTopsoil = val"
                                     />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                             <Card class="h-full w-full overflow-hidden">
                                <CardHeader>
                                    <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                                        <!-- Kiri: Judul + Link -->
                                        <div class="flex flex-col gap-1">
                                            <CardTitle>OB Movements</CardTitle>
                                        </div>
                                        <!-- Kanan: Summary Box tanpa border, hanya garis tengah -->
                                        <div
                                            class="flex divide-x divide-gray-300 dark:divide-gray-700 text-sm w-full md:w-auto">
                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Actual</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                    {{ formatShortNumber(grandTotalOb.total) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Plan</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                     {{ formatShortNumber(grandTotalOb.plan) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Ach</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                  {{ formatShortNumber(grandTotalOb.achievement) }}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <!-- Daily -->
                                    <ObMovement :filter-type="filterType"
                                    @update:grandTotalNonOre="val => grandTotalOb = val" 
                                     />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                             <Card class="h-full w-full overflow-hidden">
                                <CardHeader>
                                    <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                                        <!-- Kiri: Judul + Link -->
                                        <div class="flex flex-col gap-1">
                                            <CardTitle>Waste Movements</CardTitle>
                                        </div>
                                        <!-- Kanan: Summary Box tanpa border, hanya garis tengah -->
                                        <div
                                            class="flex divide-x divide-gray-300 dark:divide-gray-700 text-sm w-full md:w-auto">
                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Actual</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                   {{ formatShortNumber(grandTotalWaste.total) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Plan</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                   {{ formatShortNumber(grandTotalWaste.plan) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Ach</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                   {{ formatShortNumber(grandTotalWaste.achievement) }}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <WasteMovement :filter-type="filterType"  
                                    @update:grandTotalNonOre="val => grandTotalWaste = val" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                             <Card class="h-full w-full overflow-hidden">
                                <CardHeader>
                                    <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                                        <!-- Kiri: Judul + Link -->
                                        <div class="flex flex-col gap-1">
                                            <CardTitle>Quarry Movements</CardTitle>
                                        </div>
                                        <!-- Kanan: Summary Box tanpa border, hanya garis tengah -->
                                        <div
                                            class="flex divide-x divide-gray-300 dark:divide-gray-700 text-sm w-full md:w-auto">
                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Actual</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                     {{ formatShortNumber(grandTotalQuarry.total) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Plan</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                     {{ formatShortNumber(grandTotalQuarry.plan) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Ach</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                      {{ formatShortNumber(grandTotalQuarry.achievement) }}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <QuarryMovement :filter-type="filterType" 
                                      @update:grandTotalNonOre="val => grandTotalQuarry = val" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                             <Card class="h-full w-full overflow-hidden">
                                <CardHeader>
                                    <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                                        <!-- Kiri: Judul + Link -->
                                        <div class="flex flex-col gap-1">
                                            <CardTitle>Others Movements</CardTitle>
                                        </div>
                                        <!-- Kanan: Summary Box tanpa border, hanya garis tengah -->
                                        <div
                                            class="flex divide-x divide-gray-300 dark:divide-gray-700 text-sm w-full md:w-auto">
                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Actual</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                     {{ formatShortNumber(grandTotalOthers.total) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Plan</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                     {{ formatShortNumber(grandTotalOthers.plan) }}
                                                </p>
                                            </div>

                                            <div class="px-4 py-2">
                                                <p class="text-gray-500 dark:text-gray-400">Ach</p>
                                                <p class="text-lg font-semibold text-gray-800 dark:text-white">
                                                     {{ formatShortNumber(grandTotalOthers.achievement) }}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <OthersMovement :filter-type="filterType" 
                                      @update:grandTotalNonOre="val => grandTotalOthers = val" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>
</template>
<style>
/* global.css */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>