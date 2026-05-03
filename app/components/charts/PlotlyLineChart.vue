<template>
  <ClientOnly>
    <div ref="chartEl" class="w-full min-h-[350px]"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue"

const props = defineProps<{
  traces: any[]
  layout?: any
  title?: string
  height?: number
}>()

const chartEl = ref<HTMLElement | null>(null)
let Plotly: any = null

async function ensurePlotly() {
  if (!import.meta.client) return null
  if (Plotly) return Plotly

  const mod = await import("plotly.js-dist-min")
  Plotly = mod.default || mod
  return Plotly
}

async function renderChart() {
  if (!import.meta.client) return
  if (!chartEl.value) return

  const plotly = await ensurePlotly()
  if (!plotly) return

  const baseLayout = {
    title: {
      text: props.title ?? "",
      x: 0.5,
      xanchor: "center",
      y: 0.98,
      yanchor: "top",
      font: { size: 16 },
    },
    height: props.height ?? 340,
    margin: { l: 40, r: 20, t: 95, b: 40 },

    legend: {
      orientation: "h",
      x: 0,
      y: 1.13,
      xanchor: "left",
      yanchor: "bottom",
    },

    hoverlabel: {
      font: { size: 10 },
    },

    hovermode: "closest",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(201,201,201,0.05)",
  }

  const finalLayout = {
    ...baseLayout,
    ...(props.layout || {}),
  }

  await plotly.react(
    chartEl.value,
    props.traces ?? [],
    finalLayout,
    { responsive: true }
  )
}

onMounted(() => {
  renderChart()
})

watch(
  () => [props.traces, props.layout, props.title, props.height],
  () => {
    renderChart()
  },
  { deep: true }
)

onBeforeUnmount(async () => {
  if (!import.meta.client) return
  if (!chartEl.value) return

  const plotly = await ensurePlotly()
  if (plotly) {
    plotly.purge(chartEl.value)
  }
})
</script>