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
  overflow: hidden;
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
