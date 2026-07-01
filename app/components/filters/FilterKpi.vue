<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end max-w-full">
    <div class="space-y-2 w-full max-w-sm">
      <label class="text-sm font-medium">Vendor</label>

      <SelectLookup
        v-model="vendor"
        endpoint="/api/master/lookups/vendors/"
        label="Vendor"
        variant="field"
        label-key="vendor_name"
        value-key="id"
      />
    </div>

    <div>
      <Button
        size="lg"
        variant="outline"
        class="text-sm"
        @click="applyFilters"
        :disabled="!isValid"
        >
        Filter
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SelectLookup from '@/components/form/LookupSelect.vue'
import { Button } from '@/components/ui/button'

const vendor = ref<number | null>(null)

const isValid = computed(() => Boolean(vendor.value))

const emit = defineEmits<{
  (
    e: 'apply',
    payload: {
      vendor: number | null
    }
  ): void
}>()

function applyFilters() {
  if (!isValid.value) return

  emit('apply', {
    vendor: vendor.value,
  })
}
</script>