<template>
    <ClientOnly>
        <ApexChart ref="chart" type="line" height="300" :series="series" :options="mergedOptions" />
    </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'

const formatNumber = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
    return val.toFixed(1)
}

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
            columnWidth: '60%'
        }
    },

    stroke: {
        // curve: 'smooth',
        width: [0, 0, 3],
        curve: 'straight',
        dashArray: [0, 0, 7]
    },
    markers: {
        size: [0.1, 0.1, 4],
        strokeWidth: 2,
        hover: {
            sizeOffset: 3
        }
    },

    fill: {
        // opacity: [0.60, 0.60, 1],
        type: 'gradient',
        gradient: {
            inverseColors: false,
            shade: 'light',
            type: "vertical",
            opacityFrom: 0.85,
            opacityTo: 0.50,
            stops: [0, 100, 100, 100]
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
    // yaxis: [
    //     {
    //         show: true,
    //         labels: {
    //             // formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
    //             formatter: formatNumber,
    //             style: {
    //                 colors: isDark.value ? '#e5e7eb' : '#1e293b'
    //             }
    //         }
    //     },
    //     {
    //         opposite: true,
    //         show: false,
    //         labels: {
    //             // formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
    //             formatter: formatNumber,
    //             style: {
    //                 colors: isDark.value ? '#e5e7eb' : '#1e293b'
    //             }
    //         }
    //     },
    //     {
    //         opposite: true,
    //         show: true,
    //         labels: {
    //             formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
    //             style: {
    //                 colors: isDark.value ? '#e5e7eb' : '#1e293b'
    //             }
    //         }
    //     },
    // ],
    yaxis: {
        show: true,
        min: 0,
        forceNiceScale: true,
        tickAmount: 6,

        labels: {
            formatter: formatNumber,
            style: {
                colors: isDark.value ? '#e5e7eb' : '#1e293b'
            }
        }
    },
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
        strokeDashArray: 1
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
        //     radius: 2
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
