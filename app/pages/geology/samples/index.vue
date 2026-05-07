
<script setup lang="ts">
import GeologyForm from "@/modules/geology/samples/geology/GeologyForm.vue"
import SellingForm from "@/modules/geology/samples/selling/SellingForm.vue"
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Sample data
        </h2>
        <p class="text-muted-foreground">
         Manage data sample geology and selling.
        </p>
      </div>
    </div>


    <div class="w-full space-y-4">
      <Tabs default-value="geology" class="w-full">
        <!-- TAB -->
        <TabsList class="grid w-[200px] grid-cols-2">
          <TabsTrigger value="geology">
            Geology
          </TabsTrigger>
          <TabsTrigger value="selling">
            Selling
          </TabsTrigger>
        </TabsList>
       <Separator class="my-2" />
        <!-- CONTENT -->
        <TabsContent value="geology">
          <div class="w-full">
            <GeologyForm />
          </div>
        </TabsContent>

        <TabsContent value="selling">
          <div class="w-full">
            <SellingForm />
          </div>
        </TabsContent>

      </Tabs>

    </div>

  </div>
</template>

<style scoped></style>
