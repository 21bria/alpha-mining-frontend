<script setup lang="ts">
import EditForm from "@/modules/report/bod/components/CreateForm.vue"

const route = useRoute()
const id = computed(() => String(route.params.id || ""))
</script>

<template>
  <div class="flex flex-col gap-4">
    <EditForm
      mode="edit"
      :id="id"
    />
  </div>
</template>