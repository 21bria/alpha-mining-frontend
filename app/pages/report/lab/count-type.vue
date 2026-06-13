<script setup lang="ts">
import ChartRange from "@/modules/report/lab/count-type/ChartRangeForm.vue"
import ChartYearly from "@/modules/report/lab/count-type/ChartYearlyForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
         Samples Orders by Type
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          Report and analytics samples orders records efficiently.
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
