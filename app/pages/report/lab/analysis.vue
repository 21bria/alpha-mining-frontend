<script setup lang="ts">
import ChartMral from "@/modules/report/lab/analysis-tat/ChartMralForm.vue"
import ChartRoa from "@/modules/report/lab/analysis-tat/ChartRoaForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-lg font-bold tracking-tight">
          Lab Performance TAT
        </h2>
        <p class="text-muted-foreground">
          List of lab performance tat analytics
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">
      <Tabs default-value="chart_roa" class="w-full">
        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="chart_roa">
           By Roa
          </TabsTrigger>
          <TabsTrigger value="chart_mral">
           By mral
          </TabsTrigger>
        </TabsList>

        <!-- CONTENT -->
        <TabsContent value="chart_roa">
          <div class="w-full">
            <ChartRoa />
          </div>
        </TabsContent>

        <TabsContent value="chart_mral">
          <div class="w-full">
            <ChartMral />
          </div>
        </TabsContent>
      </Tabs>

    </div>
  </div>
</template>

<style scoped></style>
