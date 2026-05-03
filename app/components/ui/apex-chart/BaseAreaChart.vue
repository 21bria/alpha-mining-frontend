<template>
    <ClientOnly>
        <ApexChart ref="chart" type="area" height="290" :series="series" :options="mergedOptions" />
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
    colors: { type: Array, default: () => [] },
    title: { type: String, }
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
        type: 'area',
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
    stroke: {
        curve: 'smooth',
        width: [1, 1]
    },
    // markers: {
    //     size: [0.1, 0.1, 5],
    //     strokeWidth: 2,
    //     hover: {
    //         sizeOffset: 4
    //     }
    // },

    // Fill untuk area chart
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.5,
            stops: [0, 90, 100]
        }
    },
    labels: [],
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
    yaxis: [
        {
            show: true,
            labels: {
                formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
                style: {
                    colors: isDark.value ? '#e5e7eb' : '#1e293b'
                }
            }
        },
    ],

    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        y: {
            // formatter: (val: number) => val.toLocaleString() //  menampilkan nilai normal seperti "12,000"
            formatter: (val: number) => {
                const fixed = Number(val).toFixed(1)
                return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
        }
    },
    grid: {
        borderColor: isDark.value ? '#334155' : '#e5e7eb',
        strokeDashArray: 2
    },
    legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        labels: {
            colors: legendColor.value
        },
        // markers: {
        //     width: 12,
        //     height: 12,
        //     radius: [2]
        // }
    },
    responsive: [
    {
      breakpoint: 768,
      options: {
        legend: {
          position: 'bottom',
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
