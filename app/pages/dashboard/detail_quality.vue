<script setup lang="ts">
import { ref } from 'vue'

import OreGradeAccordion from '@/modules/dashboard/geology/OreGradeAccordion.vue'
import DetailsLimonite from '@/modules/dashboard/geology/DetailsLimonite.vue'
import ClassOreLim from '@/modules/dashboard/geology/ClassOreLim.vue'
import DetailsSaprolite from '@/modules/dashboard/geology/DetailsSaprolite.vue'
import ClassOreSap from '@/modules/dashboard/geology/ClassOreSap.vue'

const emit = defineEmits(['update:limGrade', 'update:sapGrade'])

interface GradeOre {
    total_ore: number
    ni: number
    co: number
    al2o3: number
    cr2o3: number
    fe: number
    mgo: number
    sio2: number
    sm: number
    grade: string
}

const limGrade = ref<GradeOre | null>(null) // ← buat ref di induk
const sapGrade = ref<GradeOre | null>(null) // ← buat ref di induk

function handleUpdateLimGrade(data: GradeOre) {
    limGrade.value = data
}

function handleUpdateSapGrade(data: GradeOre) {
    sapGrade.value = data
}

// Ambil query params dari URL
const route = useRoute()
// const filterType = route.query.filter_type || ''
const filterType = String(route.query.filter_type || '')


type OreClassItem = {
    label: string
    percent: number
}
const limClassPercents = ref<OreClassItem[]>([])
const sapClassPercents = ref<OreClassItem[]>([])

</script>

<template>
    <div class="w-full flex flex-col gap-4">
        <div class="mb-2">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Detail Quality</h1>
            <!-- <button @click="$router.push('/')" class="text-sm text-blue-500 underline">
                ← Back to Home
            </button> -->
        </div>

        <!-- Tombol Kembali -->
        <main class="flex flex-1 flex-col gap-4 md:gap-6">
            <!-- Limonite -->
            <div class="grid grid-cols-12 gap-6">
                <!-- Kiri: Quality Chart -->
                <div class="xl:col-span-7 col-span-12">
                    <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                        <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
                            <CardHeader>
                                <div class="flex items-start justify-between w-full">
                                    <CardTitle>Limonite</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                <DetailsLimonite :filterType="filterType"
                                    @update:limGrade="handleUpdateLimGrade" />
                            </CardContent>
                            <CardFooter
                                v-if="['daily', 'range', 'weekly', 'monthly', 'yearly', 'all'].includes(filterType) && limGrade"
                                class="overflow-visible max-w-full">
                                <div class="mx-auto w-full rounded-lg p-0">
                                    <OreGradeAccordion :grade="limGrade" />
                                </div>
                            </CardFooter>

                        </Card>
                    </div>
                </div>

                <!-- Kanan -->
                <div class="xl:col-span-3 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                            <Card class="h-full">
                                <CardHeader>
                                    <!-- <CardTitle>Class Ore</CardTitle> -->
                                </CardHeader>
                                <CardContent class="flex justify-center items-center">
                                    <ClassOreLim :filter-type="filterType" v-model:percents="limClassPercents" />
                                </CardContent>
                                <CardFooter class="flex-col gap-2 text-sm border-t pt-4 mt-2">
                                    <div v-if="Array.isArray(limClassPercents) && limClassPercents.length"
                                        class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 text-center mt-4">
                                        <div v-for="(item, i) in limClassPercents" :key="i" class="p-2">
                                            <p class="text-xs text-gray-500 dark:text-white/50 font-medium">
                                                {{ item.label }}
                                            </p>
                                            <p class="text-sm font-bold text-gray-800 dark:text-white">
                                                {{ item.percent }}%
                                            </p>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Saprolite -->
            <div class="grid grid-cols-12 gap-6">
                <!-- Kiri: Quality Chart -->
                <div class="xl:col-span-7 col-span-12">
                    <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                        <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
                            <CardHeader>
                                <div class="flex items-start justify-between w-full">
                                    <CardTitle>Saprolite</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                <DetailsSaprolite :filterType="filterType"
                                    @update:sapGrade="handleUpdateSapGrade" />
                            </CardContent>
                            <CardFooter
                                v-if="['daily', 'range', 'weekly', 'monthly', 'yearly', 'all'].includes(filterType) && sapGrade"
                                class="overflow-visible max-w-full">
                                <div class="mx-auto w-full rounded-lg p-0">
                                    <OreGradeAccordion :grade="sapGrade" />
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
                <!-- Kanan -->
                <div class="xl:col-span-3 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                            <Card class="h-full">
                                <CardHeader>
                                    <!-- <CardTitle>Class Ore</CardTitle> -->
                                </CardHeader>
                                <CardContent class="flex justify-center items-center">
                                    <ClassOreSap :filter-type="filterType" v-model:percents="sapClassPercents" />
                                </CardContent>
                                <CardFooter class="flex-col gap-2 text-sm border-t pt-4 mt-2">
                                    <div v-if="Array.isArray(sapClassPercents) && sapClassPercents.length"
                                        class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 text-center mt-4">
                                        <div v-for="(item, i) in sapClassPercents" :key="i" class="p-2">
                                            <p class="text-xs text-gray-500 dark:text-white/50 font-medium">
                                                {{ item.label }}
                                            </p>
                                            <p class="text-sm font-bold text-gray-800 dark:text-white">
                                                {{ item.percent }}%
                                            </p>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>
</template>

<style>
.responsive-table-wrapper {
    overflow-x: auto;
    width: 100%;
}

.responsive-table {
    min-width: 600px;
    /* Lebar minimum agar bisa scroll */
    border-collapse: collapse;
    width: 100%;
}

.responsive-table th,
.responsive-table td {
    padding: 8px 12px;
    border: 1px solid #ddd;
    white-space: nowrap;
    /* Supaya isi tidak turun ke bawah */
    text-align: left;
}
</style>