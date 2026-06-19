<template>
  <div class="chart-scroll">
    <div class="chart-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.chart-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.chart-inner {
  min-width: 900px;
  height: 320px;
  overflow: hidden;
}

.chart-scroll :deep(.apexcharts-canvas),
.chart-scroll :deep(.apexcharts-svg),
.chart-scroll :deep(.apexcharts-inner),
.chart-scroll :deep(.apexcharts-graphical) {
  overflow: visible !important;
}

.chart-scroll :deep(.apexcharts-toolbar) {
  right: 12px !important;
  top: 0 !important;
}

.chart-scroll::-webkit-scrollbar {
  height: 4px;
}
</style>