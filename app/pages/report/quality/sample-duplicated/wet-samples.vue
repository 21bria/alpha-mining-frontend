<script setup lang="ts">
import ChartMral from "@/modules/report/quality/sample-duplicated-wet/data-mral/ChartForm.vue"
import ChartRoa from "@/modules/report/quality/sample-duplicated-wet/data-roa/ChartForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
         <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
         Wet sample duplicated
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-muted-foreground">
          List of sample wet duplicated analytics
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">
      <Tabs default-value="chart_roa" class="w-full">
        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="chart_roa">
            Chart roa
          </TabsTrigger>
          <TabsTrigger value="chart_mral">
           Chart mral
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
