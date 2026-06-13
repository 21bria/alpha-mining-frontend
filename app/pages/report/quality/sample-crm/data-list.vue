<script setup lang="ts">
import DataMral from "@/modules/report/quality/sample-crm/analysis/data-mral/ListForm.vue"
import DataRoa from "@/modules/report/quality/sample-crm/analysis/data-roa/ListForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
         <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
         CRM Analytics data
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          Report and analytics crm records efficiently.
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">

      <Tabs default-value="list" class="w-full">

        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="list">
            Data roa
          </TabsTrigger>
          <TabsTrigger value="detail">
           Data mral
          </TabsTrigger>
        </TabsList>

        <!-- CONTENT -->
        <TabsContent value="list">
          <div class="w-full">
            <DataRoa />
          </div>
        </TabsContent>

        <TabsContent value="detail">
          <div class="w-full">
            <DataMral />
          </div>
        </TabsContent>

      </Tabs>

    </div>

  </div>
</template>

<style scoped></style>
