<template>
    <ClientOnly>
        <ApexChart ref="chart" type="bar" height="260" :series="series" :options="mergedOptions" />
    </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

const props = defineProps({
    series: {
        type: Array,
        required: true
    },
    categories: { type: Array, default: () => [] },
    colors: { type: Array, default: () => [] },
    title: { type: String, },

})

const chart = ref<ApexCharts | null>(null)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const legendLabelColor = computed(() =>
    isDark.value ? '#e5e7eb' : '#1e293b'
)

// === BASE OPTIONS
const baseOptions = computed<ApexOptions>(() => ({
    chart: {
        type: 'bar',
        background: 'transparent',
    },

    plotOptions: {
        bar: {
            columnWidth: '60%'
        }
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
        width: [0, 0, 3]
    },

    fill: {
        type: 'gradient',
        gradient: {
            inverseColors: false,
            shade: 'light',
            type: "vertical",
            shadeIntensity: 0.7,
            opacityFrom: 0.75,
            opacityTo: 0.25,
            stops: [0, 100, 100, 100]
        }
    },
    dataLabels: {
        enabled: false,
        formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
        offsetY: -15,
        style: {
            fontSize: '10px',
            // colors: ["#8c9097"]
        }
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
        tickAmount: 4
    },
    yaxis:
    {
        labels: {
            formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
            style: {
                colors: isDark.value ? '#e5e7eb' : '#1e293b'
            }
        },
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
            colors: [legendLabelColor.value]
        }
    }

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
