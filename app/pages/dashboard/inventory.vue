<script setup lang="ts">
import { ref } from 'vue'
// Ambil query params dari URL
const route = useRoute()
const filterType = String(route.query.filter_type || '')
</script>

<template>
    <div class="w-full flex flex-col gap-4">
        <div class="mb-2">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Detail Inventory</h1>
            <button @click="$router.push('/')" class="text-sm text-blue-500 underline">
                ← Back to Home
            </button>
        </div>

        <main class="flex flex-1 flex-col gap-4 md:gap-6">
            <div class="grid grid-cols-12 gap-6">
                <!-- Kiri -->
                <div class="xl:col-span-6 col-span-12">
                    <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                        <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
                            <CardHeader>
                                <div class="flex items-start justify-between w-full">
                                    <CardTitle>Limonite</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                <DashboardInventoryDetailLimonite :filterType="filterType" />
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
                                        <CardTitle>Saprolite</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                                    <DashboardInventoryDetailSaprolite :filterType="filterType" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
