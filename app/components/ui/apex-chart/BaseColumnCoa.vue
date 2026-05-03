<template>
    <ClientOnly>
        <ApexChart ref="chart" type="line" height="300" :series="series" :options="mergedOptions" />
    </ClientOnly>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'
// Tipe data detail untuk COA Compare Ni
interface DetailItem {
    code_lot: string
    barge_code: string
    tonnage_split: number
    ni_split?: number
    ni_official?: number
    ni_diff?: number
    fe_split?: number
    fe_official?: number
    fe_diff?: number
    mgo_split?: number
    mgo_official?: number
    mgo_diff?: number
    sio2_split?: number
    sio2_official?: number
    sio2_diff?: number
    sm_split?: number
    sm_official?: number
    sm_diff?: number
}

const props = defineProps({
    series: {
        type: Array as () => { name: string; data: number[]; type?: string }[],
        required: true
    },
    categories: { type: Array as () => string[], default: () => [] },
    colors: { type: Array as () => string[], default: () => [] },
    title: { type: String, default: '' },
    details: { type: Array as () => any[], default: () => [] },
    metric: { type: String, default: 'ni' }   // bisa 'ni', 'fe', 'mgo'
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
            columnWidth: '30%'
        }
    },

    stroke: {
        dashArray: 4,
        width: [0, 0, 0, 3]   // 2 bar, 2 line
    },
    markers: {
        size: [0, 0, 5, 5],   // bar no marker, line ada marker
        strokeWidth: 2,
        hover: { sizeOffset: 3 }
    },

    fill: {
        // opacity: [0.46, 0.25, 1],
        type: 'gradient',
        gradient: {
            inverseColors: false,
            shade: 'light',
            type: "vertical",
            opacityFrom: 0.85,
            opacityTo: 0.40,
            stops: [0, 100, 100, 100]
        }
    },
    labels: [],
    dataLabels: {
        enabled: true,
        hideOverflowingLabels: true,
        background: {
            enabled: true,
            borderRadius: 4,
            padding: 4,
            opacity: 0.5,
            dropShadow: {
                enabled: false
            }
        },
        offsetY: -7,
        style: {
            fontSize: '8px',
        }
    },
    xaxis: {
        categories: props.categories,
        labels: {
            rotateAlways: true,
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
                formatter: (val: number) => val.toLocaleString(),
                style: {
                    colors: isDark.value ? '#e5e7eb' : '#1e293b'
                }
            }
        },

    ],

    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        shared: true,
        intersect: false,
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
            if (!props.details || !props.details[dataPointIndex]) return ''
            const detail = props.details[dataPointIndex]

            const m = props.metric.toLowerCase()   // dipakai buat ambil key JSON
            const M = props.metric.toUpperCase()   // dipakai buat label tampil

            return `
            <div style="padding:8px; color:${isDark.value ? '#eee' : '#222'};">
                <strong>${detail.code_lot ?? '-'}</strong><br/>
                <b>Barge:</b> ${detail.barge_code ?? '-'}<br/>
                <b>Tonnage:</b> ${detail.tonnage_split?.toLocaleString() ?? '-'}<br/>
                <b>${M} Internal:</b> ${detail[`${m}_split`]?.toFixed(2) ?? '-'}<br/>
                <b>${M} Official:</b> ${detail[`${m}_official`]?.toFixed(2) ?? '-'}<br/>
                <b>Diff:</b> ${detail[`${m}_diff`]?.toFixed(2) ?? '-'} %
            </div>
            `
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
            // colors: isDark.value ? '#e5e7eb' : '#1e293b'
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
            ? ['#60a5fa', '#ff9343']
            : ['#3b82f6', '#ff9343']
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
