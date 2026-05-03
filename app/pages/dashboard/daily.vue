<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import OreDetails from "@/modules/dashboard/daily/OreDetails.vue"
import TopSoilDetails from "@/modules/dashboard/daily/TopSoilDetails.vue"
import WasteDetails from "@/modules/dashboard/daily/WasteDetails.vue"
import ObDetails from "@/modules/dashboard/daily/ObDetails.vue"
import QuarryDetails from "@/modules/dashboard/daily/QuarryDetails.vue"
import OthersDetails from "@/modules/dashboard/daily/OthersDetails.vue"

const route = useRoute()
const filterType = String(route.query.filter_type || '')

// State untuk grand total
const grandTotal = ref({ lim: 0, sap: 0, total: 0, avg: 0 })
const grandTotalOb = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })
const grandTotalTopsoil = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })
const grandTotalWaste = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })
const grandTotalQuarry = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })
const grandTotalOthers = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })


// util format
function formatShortNumber(num: number) {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(num)
}
</script>

<template>
    <div class="w-full flex flex-col gap-4">
        <div class="mb-2">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Detail Mining</h1>
            <button @click="$router.push('/dashboard/mining')" class="text-sm text-blue-500 underline">
                ← Back to Daily
            </button>
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
                                        <CardTitle>Ore Details</CardTitle>
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
                            <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                <OreDetails material="ore" @update:grandTotal="val => (grandTotal = val)" />
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
                                            <CardTitle>Topsoil Details</CardTitle>
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
                                    <TopSoilDetails material="top_soil"
                                        @update:grandTotalNonOre="val => (grandTotalTopsoil = val)" />
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
                                            <CardTitle>OB Details</CardTitle>
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
                                    <ObDetails material="ob"
                                        @update:grandTotalNonOre="val => (grandTotalOb = val)" />
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
                                            <CardTitle>Waste Detailss</CardTitle>
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
                                    <WasteDetails material="waste"
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
                                            <CardTitle>Quarry Details</CardTitle>
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
                                    <QuarryDetails material="quarry"
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
                                            <CardTitle>Others Detailss</CardTitle>
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
                                    <OthersDetails material="others"
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
