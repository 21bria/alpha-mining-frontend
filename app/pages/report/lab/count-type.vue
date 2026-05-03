<script setup lang="ts">
import ChartRange from "@/modules/report/lab/count-type/ChartRangeForm.vue"
import ChartYearly from "@/modules/report/lab/count-type/ChartYearlyForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-lg font-bold tracking-tight">
          Sample Orders count by type
        </h2>
        <p class="text-muted-foreground">
          List of sample orders count by type analytics
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">
      <Tabs default-value="chart_yearly" class="w-full">
        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="chart_yearly">
            By type
          </TabsTrigger>
          <TabsTrigger value="chart_range">
           By method
          </TabsTrigger>
        </TabsList>

        <!-- CONTENT -->
        <TabsContent value="chart_yearly">
          <div class="w-full">
            <ChartYearly />
          </div>
        </TabsContent>

        <TabsContent value="chart_range">
          <div class="w-full">
            <ChartRange />
          </div>
        </TabsContent>
      </Tabs>

    </div>
  </div>
</template>

<style scoped></style>
