<template>
    <ClientOnly>
        <ApexChart ref="chart" type="line" height="300" :series="series" :options="mergedOptions" />
    </ClientOnly>

    <Dialog v-model:open="openDetail">
        <DialogContent class="w-[92vw] max-w-md">
            <DialogHeader>
                <DialogTitle>
                    Grade Detail - {{ selectedDetail?.label || '-' }}
                </DialogTitle>
            </DialogHeader>

            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">Total Ore</div>
                    <div class="font-semibold">{{ fmt(selectedDetail?.total_ore) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">Released</div>
                    <div class="font-semibold">{{ fmt(selectedDetail?.released_ore) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">Ni</div>
                    <div class="font-semibold">{{ grade(selectedDetail?.ni) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">Fe</div>
                    <div class="font-semibold">{{ grade(selectedDetail?.fe) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">MgO</div>
                    <div class="font-semibold">{{ grade(selectedDetail?.mgo) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">SiO₂</div>
                    <div class="font-semibold">{{ grade(selectedDetail?.sio2) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">Co</div>
                    <div class="font-semibold">{{ grade(selectedDetail?.co) }}</div>
                </div>

                <div class="rounded-lg border p-3">
                    <div class="text-muted-foreground">SM</div>
                    <div class="font-semibold">{{ grade(selectedDetail?.sm) }}</div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { ref, computed, watch } from 'vue'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
const openDetail = ref(false)
const selectedDetail = ref<any | null>(null)
const formatNumber = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
    return val.toFixed(1)
}
function fmt(val?: number | null, digits = 2) {
    if (val == null || Number.isNaN(Number(val))) return '0'
    return Number(val).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
    })
}

function grade(val?: number | null) {
    if (val == null || Number.isNaN(Number(val))) return '0.00'
    return Number(val).toFixed(2)
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
    },
    details: {
        type: Array as () => any[],
        default: () => []
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
        events: {
            dataPointSelection: (_event: any, _chartContext: any, config: any) => {
                const idx = config?.dataPointIndex

                if (idx == null || idx < 0 || !props.details?.[idx]) return

                selectedDetail.value = props.details[idx]
                openDetail.value = true
            },

            mounted: (chart: any) => {
                if (chart?.el) {
                    chart.el.style.cursor = 'pointer'
                }
            }
        },

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
    yaxis: [
        {
            show: true,
            labels: {
                // formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
                formatter: formatNumber,
                style: {
                    colors: isDark.value ? '#e5e7eb' : '#1e293b'
                }
            }
        },
        {
            opposite: true,
            show: false,
            labels: {
                // formatter: (val: number) => `${(val / 1000).toFixed(1)}k`,
                formatter: formatNumber,
                style: {
                    colors: isDark.value ? '#e5e7eb' : '#1e293b'
                }
            }
        },
        {
            opposite: true,
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
        custom: function ({ dataPointIndex }: { dataPointIndex: number }) {
            const d = props.details?.[dataPointIndex]
            if (!d) return ''
            return `
            <div style="
                padding:10px 12px;
                min-width:200px;
                font-size:12px;
                color:${isDark.value ? '#eee' : '#222'};
            ">
                <div style="font-weight:700;margin-bottom:6px;">
                ${d.label}
                </div>
                <div>Total: <strong>${fmt(d.total_ore)}</strong></div>
                <div style="
                margin-top:6px;
                border-top:1px solid ${isDark.value ? '#334155' : '#e5e7eb'};
                padding-top:6px;
                ">
                <div>Ni: <strong>${grade(d.ni)}</strong></div>
                </div>

                <div style="margin-top:6px;font-size:11px;opacity:.7;">
                Click for detail →
                </div>
            </div>
            `
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
