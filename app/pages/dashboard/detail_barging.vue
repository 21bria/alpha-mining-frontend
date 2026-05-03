<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits(['update:limGrade', 'update:sapGrade'])
import DetailsLimonite from '@/modules/dashboard/barging/DetailsLimonite.vue'
import DetailsSaprolite from '@/modules/dashboard/barging/DetailsSaprolite.vue'

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
const filterType = String(route.query.filter_type || '')


</script>

<template>
    <div class="w-full flex flex-col gap-4">
        <div class="mb-2">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Detail Barging</h1>
            <!-- <button @click="$router.push('/barging')" class="text-sm text-blue-500 underline">
                ← Back
            </button> -->
        </div>

        <!-- Tombol Kembali -->
        <main class="flex flex-1 flex-col gap-4 md:gap-6">
            <div class="grid grid-cols-12 gap-6">
                <!-- Kiri -->
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                        <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
                            <CardHeader>
                                <div class="flex items-start justify-between w-full">
                                    <CardTitle>Barging Limonite</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                <DetailsLimonite :filterType="filterType"
                                    @update:limGrade="handleUpdateLimGrade" />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <!-- Kanan -->
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="xl:col-span-12 col-span-12">
                            <Card class="h-full w-full overflow-hidden">
                                <CardHeader>
                                    <div class="flex items-start justify-between w-full">
                                        <CardTitle>Barging Saprolite</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <DetailsSaprolite :filterType="filterType"
                                        @update:limGrade="handleUpdateSapGrade" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
