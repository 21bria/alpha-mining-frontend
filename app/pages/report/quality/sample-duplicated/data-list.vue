<script setup lang="ts">
import DataMral from "@/modules/report/quality/sample-duplicated/data-mral/ListForm.vue"
import DataRoa from "@/modules/report/quality/sample-duplicated/data-roa/ListForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-lg font-bold tracking-tight">
          Sample Duplicated analytics
        </h2>
        <p class="text-muted-foreground">
          List of sample duplicated analytics
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">
      <Tabs default-value="list_roa" class="w-full">
        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="list_roa">
            Data roa
          </TabsTrigger>
          <TabsTrigger value="list_mral">
           Data mral
          </TabsTrigger>
        </TabsList>

        <!-- CONTENT -->
        <TabsContent value="list_roa">
          <div class="w-full">
            <DataRoa />
          </div>
        </TabsContent>

        <TabsContent value="list_mral">
          <div class="w-full">
            <DataMral />
          </div>
        </TabsContent>
      </Tabs>

    </div>
  </div>
</template>

<style scoped></style>
