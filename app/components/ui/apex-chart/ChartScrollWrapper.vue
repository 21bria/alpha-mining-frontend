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
  -webkit-overflow-scrolling: touch;
}

.chart-scroll::-webkit-scrollbar {
  height: 4px;
}
@media (max-width: 768px) {
  .chart-scroll {
    overflow-x: auto;
  }

  .chart-inner {
    min-width: 900px;
    /* contoh */
  }
}
</style>
<!-- <style scoped>
.chart-scroll {
  width: 100%;
  max-width: 100%;

  overflow-x: auto;
  overflow-y: hidden;

  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(155,155,155,.35) transparent;
}

/* chrome / safari */
.chart-scroll::-webkit-scrollbar {
  height: 4px;
}

.chart-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.chart-scroll::-webkit-scrollbar-thumb {
  background: rgba(155,155,155,.35);
  border-radius: 999px;
}

.chart-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(155,155,155,.55);
}

/* apex internal */
.chart-scroll :deep(.apexcharts-canvas),
.chart-scroll :deep(.apexcharts-svg),
.chart-scroll :deep(.apexcharts-inner) {
  overflow: hidden !important;
}

.chart-inner {
  min-width: 900px;
}
</style> -->