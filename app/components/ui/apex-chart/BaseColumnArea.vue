<template>
    <ClientOnly>
        <ApexChart ref="chart" type="line" height="260" :series="series" :options="mergedOptions" />
    </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'

const props = defineProps({
    series: {
        type: Array,
        required: true
    },
    categories: {
        type: Array,
        default: () => []
    },
    colors: {
        type: Array,
        default: () => []
    },
    title: {
        type: String,
        // default: 'Monthly Trend Mining'
    }
})


const chart = ref<ApexCharts | null>(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const legendColor = computed(() =>
    isDark.value ? '#e5e7eb' : '#1e293b'
)
// === BASE OPTIONS
const baseOptions = computed<ApexOptions>(() => ({
    chart: {
        type: 'line',
        background: 'transparent',
        zoom: {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true
        },
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: false
            }
        },
        animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 500
        },
        fontFamily: 'Inter, sans-serif'
    },
    title: {
        text: props.title,
        align: 'left',
        style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark.value ? '#e5e7eb' : '#1e293b'
        }
    },
    plotOptions: {
        bar: {
            columnWidth: '50%'
        }
    },

    stroke: {
        curve: 'smooth',
        width: [0, 2]
    },
    markers: {
        size: [4, 0],
        strokeWidth: 2,
        hover: {
            sizeOffset: 2
        }
    },
    
    fill: {
        type: 'gradient',
        gradient: {
            inverseColors: false,
            shade: 'light',
            type: "vertical",
            shadeIntensity:0.7,
            opacityFrom: 0.65,
            opacityTo: 0.25,
             stops: [0, 100, 100, 100]
        }
    },

    dataLabels: {
        enabled: false
    },
    xaxis: {
        categories: props.categories,
        labels: {
            style: {
                colors: isDark.value ? '#e5e7eb' : '#1e293b'
            }
        },
        axisBorder: {
            color: isDark.value ? '#334155' : '#e5e7eb'
        },
        axisTicks: {
            color: isDark.value ? '#334155' : '#e5e7eb'
        },
        //  tickAmount: 4
    },
    yaxis: 
        {
            labels: {
                formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
                style: {
                    colors: isDark.value ? '#e5e7eb' : '#1e293b'
                }
            },
            // axisTicks: { show: true },
            // axisBorder: { show: false },
        },
     
    tooltip: {
        shared: true,
        intersect: false,
        theme: isDark.value ? 'dark' : 'light'
    },
    grid: {
        borderColor: isDark.value ? '#334155' : '#e5e7eb',
        strokeDashArray: 2
    },
    legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        labels: {
            // colors: isDark.value ? '#e5e7eb' : '#1e293b'
            colors:legendColor.value
        },
        // markers: {
        //     width: 12,
        //     height: 12,
        //     radius: 2
        // }
    },
     responsive: [
    {
      breakpoint: 768,
      options: {
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '11px',
          itemMargin: {
            horizontal: 8,
            vertical: 4,
          },
        },
      },
    },
  ],
}))

// === THEME OPTIONS
const getThemeOptions = (): ApexOptions => ({
    theme: {
        mode: isDark.value ? 'dark' : 'light'
    },
    colors: props.colors.length > 0
        ? props.colors
        : isDark.value
            ? ['#60a5fa', '#facc15']
            : ['#3b82f6', '#f59e0b']
})

// === MERGED OPTIONS
const mergedOptions = computed<ApexOptions>(() => ({
    ...baseOptions.value,
    ...getThemeOptions()
}))

// === WATCH THEME CHANGE
watch(isDark, () => {
    if (chart.value?.updateOptions) {
        chart.value.updateOptions(getThemeOptions(), false, true)
    }
})
</script>
