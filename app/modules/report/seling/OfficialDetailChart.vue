<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { defineAsyncComponent } from 'vue'

// Props
const props = defineProps<{
  metric: string         // "ni" | "fe" | "mgo"
  compare?: any
  details?: any[]
}>()

const chartData = ref<{ categories: string[]; series: any[] } | null>(null)
const detailsData = ref<any[]>([])

// Dynamic chart component
const chartComponent = computed(() =>
  defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnCoa.vue'))
)

const colors = computed(() => {
  switch (props.metric.toLowerCase()) {
    // case 'fe': return ['#f97316', '#fb923c', '#f43f5e']
    // case 'mgo': return ['#10b981', '#34d399', '#f43f5e']
    default: return ['#3b82f6', '#ff9343', '#f43f5e']
  }
})

watch(
  () => [props.compare, props.details],
  () => {
    if (!props.compare) return

    chartData.value = {
      categories: props.compare?.x_data ?? [],
      series: [
        {
          name: `${props.metric.toUpperCase()} Internal`,
          type: 'bar',
          data: props.compare?.[`y_split_${props.metric}`] ?? [],
            yAxisIndex: 0   // Axis utama untuk Internal & Official
        },
        {
          name: `${props.metric.toUpperCase()} Official`,
          type: 'bar',
          data: props.compare?.[`y_official_${props.metric}`] ?? [],
            yAxisIndex: 0   // Axis utama untuk Internal & Official
        },
        // {
        //   name: 'Diff',
        //   type: 'line',
        //   data: props.compare?.[`${props.metric}_diff`] ?? [],
        //     yAxisIndex: 1   // Axis kanan khusus untuk Diff
        // }
      ]
    }

    detailsData.value = props.details ?? []
  },
  { immediate: true }
)
</script>

<template>
    <div class="chart-mask">
  <component
    :is="chartComponent"
    v-if="chartData"
    :series="chartData.series"
    :categories="chartData.categories"
    :colors="colors"
    :details="detailsData"
    :metric="props.metric" 
  />
    </div>

</template>

<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: hidden;
}

</style>
