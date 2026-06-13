<script setup lang="ts">
import ListForm from "@/modules/geology/productions/list/ListForm.vue"
import ListDetaiForm from "@/modules/geology/productions/details/ListDetaiForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-normal tracking-tight">
          Productions Geolology data
        <span class="text-xl">✨</span>
        </h2>
        <p class="text-sm text-muted-foreground">
          View and manage geology records efficiently.
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
