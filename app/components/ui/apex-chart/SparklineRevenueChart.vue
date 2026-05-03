<template>
    <ClientOnly>
        <ApexChart ref="chart" type="area" height="140" :series="series" :options="mergedOptions" />
    </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import { ref, computed, watch } from 'vue'

const props = defineProps({
    series: {
        type: Array,
        required: true
    },
    colors: {
        type: Array,
        default: () => ['#60a5fa'] // warna biru soft default
    },
    categories: {
        type: Array,
        default: () => []
    },
})

const chart = ref(null)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const mergedOptions = computed(() => ({
    chart: {
        type: 'area',
        height: 140,
        sparkline: { enabled: true },
        animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 500
        },
        background: 'transparent'
    },
    dataLabels: { enabled: false },
    stroke: {
        width: 1.4,
        curve: 'smooth'
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.7,
            stops: [0, 100]
        }
    },
    colors: props.colors,

    xaxis: {
        categories: props.categories,
        labels: {
            show: true,
            style: {
                colors: isDark.value ? '#e5e7eb' : '#1e293b',
            }
        },
        axisBorder: {
            show: false
        },
        axisTicks: {
            show: false
        },
        crosshairs: {
            show: true
        },
        tooltip: {
            enabled: true
        }
    },
    yaxis: {
        show: false
    },
    grid: {
        show: false
    },
    legend: {
        show: false
    },
    tooltip: {
        enabled: true,
        theme: isDark.value ? 'dark' : 'light',
        y: {
            formatter: function (value: number) {
                if (!value || isNaN(value)) return '0';
                return `${(value / 1000).toFixed(2)}k`; // Misalnya 4325 → 4.33k
            },
            title: {
                formatter: function (seriesName: string) {
                    return seriesName; // Menampilkan nama series seperti 'Actual' atau 'Revenue'
                }
            }
        }
    }

}))
</script>
