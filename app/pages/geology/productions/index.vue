<script setup lang="ts">
import ListForm from "@/modules/geology/productions/list/ListForm.vue"
import ListDetaiForm from "@/modules/geology/productions/details/ListDetaiForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Productions Geology
        </h2>
        <p class="text-muted-foreground">
          Ore production data from geology and quality
        </p>
      </div>
    </div>

    <div class="w-full space-y-4">

      <Tabs default-value="list" class="w-full">

        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="list">
            List ore
          </TabsTrigger>
          <TabsTrigger value="detail">
            Detail ore
          </TabsTrigger>
        </TabsList>

        <!-- CONTENT -->
        <TabsContent value="list">
          <div class="w-full">
            <ListForm />
          </div>
        </TabsContent>

        <TabsContent value="detail">
          <div class="w-full">
            <ListDetaiForm />
          </div>
        </TabsContent>

      </Tabs>

    </div>

  </div>
</template>

<style scoped></style>
