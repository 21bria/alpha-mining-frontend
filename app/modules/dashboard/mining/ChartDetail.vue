<template>
  <div class="chart-mask">
    <ChartScrollWrapper v-if="isScrollable">
      <component
        :is="chartComponent"
        v-if="chartData"
        :series="chartData.series"
        :categories="chartData.categories"
        :colors="colors"
      />
    </ChartScrollWrapper>

    <component
      v-else
      :is="chartComponent"
      v-if="chartData"
      :series="chartData.series"
      :categories="chartData.categories"
      :colors="colors"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue"
import ChartScrollWrapper from "@/components/ui/apex-chart/ChartScrollWrapper.vue"

type SeriesItem = {
  name: string
  data: number[]
}

interface ChartPoint {
  x: string
  y: number
  goals?: {
    name: string
    value: number
    strokeColor: string
    strokeHeight: number
  }[]
}

interface ChartSeries {
  name: string
  data: (number | ChartPoint)[]
  type?: string
  yAxisIndex?: number
}

interface ChartData {
  categories?: string[]
  series: ChartSeries[]
}

const props = defineProps<{
  filterType: string
  xData: string[]
  series: SeriesItem[]
  totalActual?: number[]
  totalPlan?: number[]
}>()

const isScrollable = computed(() => {
  return !["weekly", "yearly", "all"].includes(props.filterType)
})

const chartComponent = computed(() => {
  return props.filterType === "monthly"
    ? defineAsyncComponent(() => import("@/components/ui/apex-chart/BaseLineArea.vue"))
    : defineAsyncComponent(() => import("@/components/ui/apex-chart/BaseColumnsMarkers.vue"))
})

const colors = computed(() => [
  // '#34d399', 
  // '#f43f5e',
  // "#34d399",
  // "#60a5fa",
  // "#f59e0b",
  // "#a78bfa",
  // "#22d3ee",
  // "#fb7185",
  // "#84cc16",
  // "#f97316",
])

const chartData = computed<ChartData | null>(() => {
  const xData = props.xData ?? []
  const materialSeries = props.series ?? []

  if (!xData.length) return null

  /**
   * Monthly pakai area/line multi series.
   */
  if (props.filterType === "monthly") {
    return {
      categories: xData,
      series: [
        ...materialSeries.map((item) => ({
          name: item.name,
          type: "area",
          yAxisIndex: 0,
          data: item.data ?? [],
        })),
        {
          name: "Plan",
          type: "line",
          yAxisIndex: 1,
          data: props.totalPlan ?? [],
        },
      ],
    }
  }

  /**
   * Daily/weekly/range/yearly/all pakai bar + marker plan.
   * Kalau series cuma 1 material, goals plan tetap tampil.
   */
  return {
    categories: xData,
    series: materialSeries.map((item) => ({
      name: item.name,
      type: "bar",
      data: xData.map((label, index) => ({
        x: label,
        y: item.data?.[index] ?? 0,
        goals: [
          {
            name: "Plan",
            value: props.totalPlan?.[index] ?? 0,
            strokeColor: "#f43f5e",
            strokeHeight: 4,
          },
        ],
      })),
    })),
  }
})
</script>

<style scoped>
.chart-mask {
  width: 100%;
  min-width: 600px;
  overflow-x: hidden;
}

.chart-mask :deep(*) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chart-mask :deep(*::-webkit-scrollbar) {
  display: none;
}
</style>