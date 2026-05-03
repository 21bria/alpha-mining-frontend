<script setup lang="ts">
import kpiForm from "@/modules/dashboard/mining/daily/fleetKpi.vue"
import dailyForm from "@/modules/dashboard/mining/daily/productions.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="w-full space-y-4">

      <Tabs default-value="kpi" class="w-full">

        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="kpi">
            Fleet Kpi
          </TabsTrigger>
          <TabsTrigger value="daily">
            Daily Mining
          </TabsTrigger>
        </TabsList>

        <!-- CONTENT -->
        <TabsContent value="kpi">
          <div class="w-full">
            <kpiForm />
          </div>
        </TabsContent>

        <TabsContent value="daily">
          <div class="w-full">
            <dailyForm />
          </div>
        </TabsContent>

      </Tabs>

    </div>

  </div>
</template>

<style scoped></style>
