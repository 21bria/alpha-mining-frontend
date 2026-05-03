<script setup lang="ts">
import { computed } from "vue";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'

import FilterControls from '@/components/filters/FilterMonitoring.vue'
import { useApi } from '@/composables/useApi'
import { useNotify } from "@/composables/useNotify"

const notify = useNotify()
const { request } = useApi()

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery({
      ...extraQuery
    })
  })
}


const fx2 = (v: number | null | undefined) =>
  v ? Number(v).toFixed(2) : "-"

const isLoading = ref(false)
const sampleData = ref<any[]>([])

async function fetchSamples(params: {
  typeFilter?: string
  startDate?: string
  endDate?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    isLoading.value = true

    const json = await getApi('/api/analytics/raw/barging/monitoring/sample/list/', {
      startDate: params.startDate,
      endDate: params.endDate,
      typeFilter: params.typeFilter,
      ...(params.iup_id && {
        iup_id: Array.isArray(params.iup_id)
          ? params.iup_id.join(',')
          : params.iup_id
      })
    })

    sampleData.value = json.data ?? []
  } catch (err) {
    console.error('Fetch Monitoring failed', err)
  } finally {
    isLoading.value = false
  }
}

const mappedSamples = computed(() =>
  sampleData.value.map(row => {
    const samples: any[] = [];

    // Plan / Monitoring / Split
    samples.push(
      { source: "Plan", ni: row.ni_plan, fe: row.fe_plan, co: row.co_plan, mgo: row.mgo_plan, sio2: row.sio2_plan },
      { source: "Monitoring", ni: row.ni_monitoring, fe: row.fe_monitoring, co: row.co_monitoring, mgo: row.mgo_monitoring, sio2: row.sio2_monitoring },
      { source: "Split", ni: row.ni_split, fe: row.fe_split, co: row.co_split, mgo: row.mgo_split, sio2: row.sio2_split }
    );

    // Officials (COA)
    if (row.officials && row.officials.length) {
      row.officials.forEach((o: any) => {
        samples.push({
          source: `COA - ${o.re_assay}`,
          ni: o.ni,
          fe: o.fe,
          co: o.co,
          mgo: o.mgo,
          sio2: o.sio2
        });
      });
    }

    return {
      ...row,
      samples
    };
  })
);
// Summary 
const summaryData = ref<any[]>([])
// ------------------- Grand Total Computed -------------------
const grandTotals = computed(() => {
  const totals = {
    totalOre: 0,
    sumNiInternal: 0,
    sumNiOfficial: 0,
    sumNiDiff: 0,
    sumNiDiffPerc: 0,
    sumFeInternal: 0,
    sumFeOfficial: 0,
    sumFeDiff: 0,
    sumFeDiffPerc: 0,
    sumSMInternal: 0,
    sumSMOfficial: 0,
    sumSMDiff: 0,
    sumSMDiffPerc: 0,
  }

  summaryData.value.forEach(row => {
    totals.totalOre += row.tonnage_official
    totals.sumNiInternal += row.tonnage_official * row.ni_split
    totals.sumNiOfficial += row.tonnage_official * row.ni_official
    totals.sumNiDiff += row.tonnage_official * row.ni_diff
    totals.sumNiDiffPerc += row.tonnage_official * row.ni_diff_perc

    totals.sumFeInternal += row.tonnage_official * row.fe_split
    totals.sumFeOfficial += row.tonnage_official * row.fe_official
    totals.sumFeDiff += row.tonnage_official * row.fe_diff
    totals.sumFeDiffPerc += row.tonnage_official * row.fe_diff_perc

    totals.sumSMInternal += row.tonnage_official * row.sm_split
    totals.sumSMOfficial += row.tonnage_official * row.sm_official
    totals.sumSMDiff += row.tonnage_official * row.sm_diff
    totals.sumSMDiffPerc += row.tonnage_official * row.sm_diff_perc
  })

  // Bagi dengan total ore untuk rata-rata
  if (totals.totalOre > 0) {
    totals.sumNiInternal /= totals.totalOre
    totals.sumNiOfficial /= totals.totalOre
    totals.sumNiDiff /= totals.totalOre
    totals.sumNiDiffPerc /= totals.totalOre
    totals.sumFeInternal /= totals.totalOre
    totals.sumFeOfficial /= totals.totalOre
    totals.sumFeDiff /= totals.totalOre
    totals.sumFeDiffPerc /= totals.totalOre
    totals.sumSMInternal /= totals.totalOre
    totals.sumSMOfficial /= totals.totalOre
    totals.sumSMDiff /= totals.totalOre
    totals.sumSMDiffPerc /= totals.totalOre
  }

  return totals
})

// ------------------- Fetch API -------------------
async function fetchSummary(params: {
  typeFilter?: string
  startDate?: string
  endDate?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    isLoading.value = true

    const json = await getApi('/api/analytics/raw/barging/monitoring/sample/summary/', {
      typeFilter: params.typeFilter,
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.iup_id && {
        iup_id: Array.isArray(params.iup_id)
          ? params.iup_id.join(',')
          : params.iup_id
      })
    })

    summaryData.value = json.data ?? []
  } catch (err) {
    console.error('Fetch Summary failed', err)
  } finally {
    isLoading.value = false
  }
}

// By Re-Assay
const summaryReAssay = ref<any[]>([])
// ------------------- Grand Total Computed -------------------
const grandTotalsReAssay = computed(() => {
  const totals = {
    totalOre: 0,
    sumNiInternal: 0,
    sumNiOfficial: 0,
    sumNiDiff: 0,
    sumNiDiffPerc: 0,
    sumFeInternal: 0,
    sumFeOfficial: 0,
    sumFeDiff: 0,
    sumFeDiffPerc: 0,
    sumSMInternal: 0,
    sumSMOfficial: 0,
    sumSMDiff: 0,
    sumSMDiffPerc: 0,
  }

  summaryReAssay.value.forEach(row => {
    totals.totalOre += row.tonnage_official
    totals.sumNiInternal += row.tonnage_official * row.ni_split
    totals.sumNiOfficial += row.tonnage_official * row.ni_official
    totals.sumNiDiff += row.tonnage_official * row.ni_diff
    totals.sumNiDiffPerc += row.tonnage_official * row.ni_diff_perc

    totals.sumFeInternal += row.tonnage_official * row.fe_split
    totals.sumFeOfficial += row.tonnage_official * row.fe_official
    totals.sumFeDiff += row.tonnage_official * row.fe_diff
    totals.sumFeDiffPerc += row.tonnage_official * row.fe_diff_perc

    totals.sumSMInternal += row.tonnage_official * row.sm_split
    totals.sumSMOfficial += row.tonnage_official * row.sm_official
    totals.sumSMDiff += row.tonnage_official * row.sm_diff
    totals.sumSMDiffPerc += row.tonnage_official * row.sm_diff_perc
  })

  // Bagi dengan total ore untuk rata-rata
  if (totals.totalOre > 0) {
    totals.sumNiInternal /= totals.totalOre
    totals.sumNiOfficial /= totals.totalOre
    totals.sumNiDiff /= totals.totalOre
    totals.sumNiDiffPerc /= totals.totalOre
    totals.sumFeInternal /= totals.totalOre
    totals.sumFeOfficial /= totals.totalOre
    totals.sumFeDiff /= totals.totalOre
    totals.sumFeDiffPerc /= totals.totalOre
    totals.sumSMInternal /= totals.totalOre
    totals.sumSMOfficial /= totals.totalOre
    totals.sumSMDiff /= totals.totalOre
    totals.sumSMDiffPerc /= totals.totalOre
  }

  return totals
})

// ------------------- Fetch API -------------------
async function fetchSummaryReAssay(params: {
  typeFilter?: string
  startDate?: string
  endDate?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    isLoading.value = true

    const json = await getApi('/api/analytics/raw/barging/monitoring/sample/summary/re-assay/', {
      typeFilter: params.typeFilter,
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.iup_id && {
        iup_id: Array.isArray(params.iup_id)
          ? params.iup_id.join(',')
          : params.iup_id
      })
    })

    summaryReAssay.value = json.data ?? []
  } catch (err) {
    console.error('Fetch Summary Re-Assay failed', err)
  } finally {
    isLoading.value = false
  }
}
// By Shipment Re-Assay
const summaryShipment = ref<any[]>([])
// ------------------- Grand Total Computed -------------------
const grandTotalShipment = computed(() => {
  const totals = {
    totalOre: 0,
    sumNiInternal: 0,
    sumNiOfficial: 0,
    sumNiDiff: 0,
    sumNiDiffPerc: 0,
    sumFeInternal: 0,
    sumFeOfficial: 0,
    sumFeDiff: 0,
    sumFeDiffPerc: 0,
    sumSMInternal: 0,
    sumSMOfficial: 0,
    sumSMDiff: 0,
    sumSMDiffPerc: 0,
  }

  summaryShipment.value.forEach(row => {
    totals.totalOre += row.tonnage_official
    totals.sumNiInternal += row.tonnage_official * row.ni_split
    totals.sumNiOfficial += row.tonnage_official * row.ni_official
    totals.sumNiDiff += row.tonnage_official * row.ni_diff
    totals.sumNiDiffPerc += row.tonnage_official * row.ni_diff_perc

    totals.sumFeInternal += row.tonnage_official * row.fe_split
    totals.sumFeOfficial += row.tonnage_official * row.fe_official
    totals.sumFeDiff += row.tonnage_official * row.fe_diff
    totals.sumFeDiffPerc += row.tonnage_official * row.fe_diff_perc

    totals.sumSMInternal += row.tonnage_official * row.sm_split
    totals.sumSMOfficial += row.tonnage_official * row.sm_official
    totals.sumSMDiff += row.tonnage_official * row.sm_diff
    totals.sumSMDiffPerc += row.tonnage_official * row.sm_diff_perc
  })

  // Bagi dengan total ore untuk rata-rata
  if (totals.totalOre > 0) {
    totals.sumNiInternal /= totals.totalOre
    totals.sumNiOfficial /= totals.totalOre
    totals.sumNiDiff /= totals.totalOre
    totals.sumNiDiffPerc /= totals.totalOre
    totals.sumFeInternal /= totals.totalOre
    totals.sumFeOfficial /= totals.totalOre
    totals.sumFeDiff /= totals.totalOre
    totals.sumFeDiffPerc /= totals.totalOre
    totals.sumSMInternal /= totals.totalOre
    totals.sumSMOfficial /= totals.totalOre
    totals.sumSMDiff /= totals.totalOre
    totals.sumSMDiffPerc /= totals.totalOre
  }

  return totals
})

// --- Grouping per buyer
const groupedShipment = computed(() => {
  return summaryShipment.value.reduce((acc, row) => {
    const key = row.buyer || "UNKNOWN";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {} as Record<string, any[]>);
});

// --- Helper functions
function subtotal(rows: any[], field: string) {
  return rows.reduce((sum, r) => sum + parseFloat(r[field]), 0);
}

function avg(rows: any[], field: string) {
  const totalOre = subtotal(rows, "tonnage_official");
  if (totalOre === 0) return 0;
  const weighted = rows.reduce((sum, r) => sum + parseFloat(r["tonnage_official"]) * parseFloat(r[field]), 0);
  return weighted / totalOre;
}

// ------------------- Fetch API -------------------
async function fetchSummaryShipment(params: {
  typeFilter?: string
  startDate?: string
  endDate?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    isLoading.value = true

    const json = await getApi('/api/analytics/raw/barging/monitoring/shipment/summary/', {
      typeFilter: params.typeFilter,
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.iup_id && {
        iup_id: Array.isArray(params.iup_id)
          ? params.iup_id.join(',')
          : params.iup_id
      })
    })

    summaryShipment.value = json.data ?? []
  } catch (err) {
    console.error('Fetch Summary Shipment failed', err)
  } finally {
    isLoading.value = false
  }
}

// By Shipment Re-Assay by Month
const summaryByMonth = ref<any[]>([])
// ------------------- Helper functions -------------------
function subtotalMonth(rows: any[], field: string) {
  return rows.reduce((sum, r) => sum + parseFloat(r[field] || 0), 0)
}

function avgMonth(rows: any[], field: string) {
  const totalOre = subtotalMonth(rows, "tonnage_official")
  if (totalOre === 0) return 0
  const weighted = rows.reduce(
    (sum, r) => sum + parseFloat(r["tonnage_official"] || 0) * parseFloat(r[field] || 0),
    0
  )
  return weighted / totalOre
}

// ------------------- Grand Total Computed -------------------
const grandTotaByMonth = computed(() => {
  const totals = {
    totalOre: 0,
    sumNiInternal: 0,
    sumNiOfficial: 0,
    sumNiDiff: 0,
    sumNiDiffPerc: 0,
    sumFeInternal: 0,
    sumFeOfficial: 0,
    sumFeDiff: 0,
    sumFeDiffPerc: 0,
    sumSMInternal: 0,
    sumSMOfficial: 0,
    sumSMDiff: 0,
    sumSMDiffPerc: 0,
  }

  summaryByMonth.value.forEach((row) => {
    const ton = parseFloat(row.tonnage_official || 0)
    totals.totalOre += ton
    totals.sumNiInternal += ton * (parseFloat(row.ni_split) || 0)
    totals.sumNiOfficial += ton * (parseFloat(row.ni_official) || 0)
    totals.sumNiDiff += ton * (parseFloat(row.ni_diff) || 0)
    totals.sumNiDiffPerc += ton * (parseFloat(row.ni_diff_perc) || 0)

    totals.sumFeInternal += ton * (parseFloat(row.fe_split) || 0)
    totals.sumFeOfficial += ton * (parseFloat(row.fe_official) || 0)
    totals.sumFeDiff += ton * (parseFloat(row.fe_diff) || 0)
    totals.sumFeDiffPerc += ton * (parseFloat(row.fe_diff_perc) || 0)

    totals.sumSMInternal += ton * (parseFloat(row.sm_split) || 0)
    totals.sumSMOfficial += ton * (parseFloat(row.sm_official) || 0)
    totals.sumSMDiff += ton * (parseFloat(row.sm_diff) || 0)
    totals.sumSMDiffPerc += ton * (parseFloat(row.sm_diff_perc) || 0)
  })

  // Bagi dengan total ore untuk rata-rata
  if (totals.totalOre > 0) {
    totals.sumNiInternal /= totals.totalOre
    totals.sumNiOfficial /= totals.totalOre
    totals.sumNiDiff /= totals.totalOre
    totals.sumNiDiffPerc /= totals.totalOre
    totals.sumFeInternal /= totals.totalOre
    totals.sumFeOfficial /= totals.totalOre
    totals.sumFeDiff /= totals.totalOre
    totals.sumFeDiffPerc /= totals.totalOre
    totals.sumSMInternal /= totals.totalOre
    totals.sumSMOfficial /= totals.totalOre
    totals.sumSMDiff /= totals.totalOre
    totals.sumSMDiffPerc /= totals.totalOre
  }

  return totals
})

// ------------------- Grouping per bulan -------------------
const groupedMonth = computed(() => {
  return summaryByMonth.value.reduce((acc, row) => {
    const key = row.month_name || "UNKNOWN"
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {} as Record<string, any[]>)
})

// ------------------- Fetch API -------------------
async function fetchSummaryMonth(params: {
  typeFilter?: string
  startDate?: string
  endDate?: string
  iup_id?: number | string | Array<number | string> | null
}) {
  try {
    isLoading.value = true

    const json = await getApi('/api/analytics/raw/barging/monitoring/shipment/summary/by-month/', {
      typeFilter: params.typeFilter,
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.iup_id && {
        iup_id: Array.isArray(params.iup_id)
          ? params.iup_id.join(',')
          : params.iup_id
      })
    })

    summaryByMonth.value = json.data ?? []
  } catch (err) {
    console.error('Fetch Summary By Month failed', err)
  } finally {
    isLoading.value = false
  }
}

// panggil saat user klik Apply
function handleApply(payload: { typeFilter: string; startDate: string; endDate: string }) {
  fetchSamples(payload);
  fetchSummary(payload);
  fetchSummaryReAssay(payload);
  fetchSummaryShipment(payload);
  fetchSummaryMonth(payload);

}

// Copy Monitoring to Clipboard
function buildMonitoringClipboardText() {
  if (!mappedSamples.value.length) return ""

  const headers = [
    "No",
    "Code",
    "Barge Code",
    "Quantity",
    "Sample Source",
    "Ni",
    "Fe",
    "Co",
    "MgO",
    "SiO2",
    "S/M",
  ]

  const rows: any[] = []

  mappedSamples.value.forEach((row: any, i: number) => {
    row.samples.forEach((samp: any, idx: number) => {
      rows.push([
        idx === 0 ? i + 1 : "",
        idx === 0 ? row.code_lot : "",
        idx === 0 ? row.barge_code : "",
        idx === 0 ? row.tonnage_split : "",
        samp.source,
        samp.ni != null ? samp.ni.toFixed(2) : "-",
        samp.fe != null ? samp.fe.toFixed(2) : "-",
        samp.co != null ? samp.co.toFixed(2) : "-",
        samp.mgo != null ? samp.mgo.toFixed(2) : "-",
        samp.sio2 != null ? samp.sio2.toFixed(2) : "-",
        samp.mgo && samp.sio2 ? (samp.sio2 / samp.mgo).toFixed(2) : "-",
      ])
    })
  })

  return [headers, ...rows].map(r => r.join("\t")).join("\n")
}

async function handleCopyMonitoring() {
  try {
    const text = buildMonitoringClipboardText()
    if (!text) return

    await navigator.clipboard.writeText(text)
    notify.success("Copied! Paste directly into Excel 👍")
  } catch (err) {
    console.error("Copy failed", err)
    notify.error("Failed to copy table")
  }
}

// Copy summary to Clipboard
function n2(v: any) {
  const num = Number(v || 0)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

function buildSellingSummaryClipboardText() {
  const header1 = ['', '', '', '', 'Ni', '', '', '', 'Fe', '', '', '', 'S/M', '', '', '']
  const header2 = [
    'No', 'Completed', 'Barge Code', 'Quantity',
    'Internal', 'COA/Surveyor', 'Diff', '%Diff',
    'Internal', 'COA/Surveyor', 'Diff', '%Diff',
    'Internal', 'COA/Surveyor', 'Diff', '%Diff',
  ]

  const buildRows = (rows: any[]) =>
    rows.map((row, i) => [
      i + 1,
      row.date_barge_out,
      row.barge_name,
      row.tonnage_official,
      n2(row.ni_split),
      n2(row.ni_official),
      n2(row.ni_diff),
      n2(row.ni_diff_perc),
      n2(row.fe_split),
      n2(row.fe_official),
      n2(row.fe_diff),
      n2(row.fe_diff_perc),
      n2(row.sm_split),
      n2(row.sm_official),
      n2(row.sm_diff),
      n2(row.sm_diff_perc),
    ])

  const totalRow = (label: string, t: any) => [
    label, '', '',
    t.totalOre,
    n2(t.sumNiInternal),
    n2(t.sumNiOfficial),
    n2(t.sumNiDiff),
    n2(t.sumNiDiffPerc),
    n2(t.sumFeInternal),
    n2(t.sumFeOfficial),
    n2(t.sumFeDiff),
    n2(t.sumFeDiffPerc),
    n2(t.sumSMInternal),
    n2(t.sumSMOfficial),
    n2(t.sumSMDiff),
    n2(t.sumSMDiffPerc),
  ]

  const section1 = [
    ['All Selling Original'],
    header1,
    header2,
    ...buildRows(summaryData.value ?? summaryData),
    totalRow('Grand Total', grandTotals.value ?? grandTotals),
  ]

  const section2 = [
    [],
    ['All Shipment after Re-Assay'],
    header1,
    header2,
    ...buildRows(summaryReAssay.value ?? summaryReAssay),
    totalRow('Grand Total', grandTotalsReAssay.value ?? grandTotalsReAssay),
  ]

  const section3: any[] = [
    [],
    ['Selling By Shipment'],
    header1,
    header2,
  ]

  const grouped = groupedShipment.value ?? groupedShipment

  Object.entries(grouped).forEach(([buyer, group]: any) => {
    section3.push([`Shipment to ${buyer}`])

    group.forEach((row: any, i: number) => {
      section3.push([
        i + 1,
        row.date_barge_out,
        row.barge_name,
        row.tonnage_official,
        n2(row.ni_split),
        n2(row.ni_official),
        n2(row.ni_diff),
        n2(row.ni_diff_perc),
        n2(row.fe_split),
        n2(row.fe_official),
        n2(row.fe_diff),
        n2(row.fe_diff_perc),
        n2(row.sm_split),
        n2(row.sm_official),
        n2(row.sm_diff),
        n2(row.sm_diff_perc),
      ])
    })

    section3.push([
      'Subtotal', '', '',
      subtotal(group, 'tonnage_official'),
      n2(avg(group, 'ni_split')),
      n2(avg(group, 'ni_official')),
      n2(avg(group, 'ni_diff')),
      n2(avg(group, 'ni_diff_perc')),
      n2(avg(group, 'fe_split')),
      n2(avg(group, 'fe_official')),
      n2(avg(group, 'fe_diff')),
      n2(avg(group, 'fe_diff_perc')),
      n2(avg(group, 'sm_split')),
      n2(avg(group, 'sm_official')),
      n2(avg(group, 'sm_diff')),
      n2(avg(group, 'sm_diff_perc')),
    ])
  })

  section3.push(totalRow('Grand Total', grandTotalShipment.value ?? grandTotalShipment))

  return [...section1, ...section2, ...section3]
    .map(r => r.join('\t'))
    .join('\n')
}

async function handleCopySummaryAll() {
  try {
    const text = buildSellingSummaryClipboardText()
    if (!text) return

    await navigator.clipboard.writeText(text)
    notify.success('Copied! Paste directly into Excel 👍')
  } catch (err) {
    console.error('Copy failed', err)
    notify.error('Failed to copy table')
  }
}
// Copy Month to Clipboard
function sellingTypeLabel(v: string) {
  if (v === 'LIS') return 'Limonite'
  if (v === 'SAS') return 'Saprolite'
  return v || ''
}


function buildSummaryMonthClipboardText() {
  const grouped = groupedMonth.value ?? groupedMonth
  const monthEntries = Object.entries(grouped)

  if (!monthEntries.length) return ''

  const header1 = [
    'All Selling', '', '', '', '',
    'Internal', '', '',
    'Surveyor', '', ''
  ]

  const header2 = [
    'Month',
    'Type',
    'Destination',
    'Barge',
    'Quantity',
    'Ni',
    'Fe',
    'S/M',
    'Ni',
    'Fe',
    'S/M',
  ]

  const output: any[] = [
    ['By Month'],
    header1,
    header2,
  ]

  monthEntries.forEach(([month, group]: any) => {
    output.push([`Data : ${month}`])

    group.forEach((row: any, i: number) => {
      output.push([
        i + 1,
        sellingTypeLabel(row.type_selling),
        row.buyer,
        row.total_barge,
        row.tonnage_official,
        n2(row.ni_split),
        n2(row.fe_split),
        n2(row.sm_split),
        n2(row.ni_official),
        n2(row.fe_official),
        n2(row.sm_official),
      ])
    })

    output.push([
      `Total ${month}`,
      '',
      '',
      '',
      subtotalMonth(group, 'tonnage_official'),
      n2(avgMonth(group, 'ni_split')),
      n2(avgMonth(group, 'fe_split')),
      n2(avgMonth(group, 'sm_split')),
      n2(avgMonth(group, 'ni_official')),
      n2(avgMonth(group, 'fe_official')),
      n2(avgMonth(group, 'sm_official')),
    ])
  })
  const gt = grandTotaByMonth.value
  output.push([])
  output.push([
    'Grand Total',
    '',
    '',
    '',
    gt?.totalOre ?? 0,
    n2(gt?.sumNiInternal),
    n2(gt?.sumFeInternal),
    n2(gt?.sumSMInternal),
    n2(gt?.sumNiOfficial),
    n2(gt?.sumFeOfficial),
    n2(gt?.sumSMOfficial),
  ])
  return output.map(r => r.join('\t')).join('\n')
}

async function handleCopySummaryMonth() {
  try {
    const text = buildSummaryMonthClipboardText()
    if (!text) return

    await navigator.clipboard.writeText(text)
    notify.success('Copied! Paste directly into Excel 👍')
  } catch (err) {
    console.error('Copy failed', err)
    notify.error('Failed to copy table')
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Compare Internal vs Official COA
        </h1>
        <p class="text-muted-foreground">
          Here&apos;s a list of your coa for this data!
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <FilterControls @apply="handleApply" />
      </div>
    </div>
    <div class="grid grid-cols-12 gap-6">
      <div class="xl:col-span-12 col-span-12">
        <!-- <Card class="w-full"> -->
        <!-- <CardHeader>
          </CardHeader> -->

        <!-- <CardContent> -->
        <div class="w-full flex flex-col">
          <Tabs default-value="monitoring" class="w-full">

            <!-- TAB HEADER -->
            <TabsList class="inline-flex gap-2">
              <TabsTrigger value="monitoring" class="text-sm w-auto px-4">
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="summary" class="text-sm w-auto px-4">
                Summary
              </TabsTrigger>
              <TabsTrigger value="summary-month" class="text-sm w-auto px-4">
                By Month
              </TabsTrigger>
            </TabsList>

            <!-- TAB CONTENT 1 -->
            <TabsContent value="monitoring" class="w-full mt-4">
              <div class="w-full space-y-3">
                <!-- HEADER -->
                <div class="flex items-center justify-between border-b pb-2 mb-3">
                  <div class="text-base font-semibold">
                    Data Compare Internal vs Official
                  </div>

                  <button @click="handleCopyMonitoring" :disabled="!mappedSamples.length"
                    class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
                    title="Copy table">
                    <Icon name="i-lucide-copy" class="w-4 h-4" />
                  </button>
                </div>

                <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">
                  Loading...
                </div>

                <div v-else>
                  <div class="h-[65vh] overflow-auto rounded-lg border bg-background">
                    <table class="min-w-[1100px] w-full border-separate border-spacing-0 text-sm whitespace-nowrap">

                      <thead class="sticky top-0 z-20 bg-background shadow-sm">
                        <tr>
                          <th class="border-b bg-background px-2 py-2 text-left font-semibold">No</th>
                          <th class="border-b bg-background px-2 py-2 text-left font-semibold">Code</th>
                          <th class="border-b bg-background px-2 py-2 text-left font-semibold">Barge Code</th>
                          <th class="border-b bg-background px-2 py-2 text-left font-semibold">Quantity</th>
                          <th class="border-b bg-background px-2 py-2 text-left font-semibold">Sample source</th>
                          <th class="border-b bg-background px-2 py-2 text-right font-semibold">Ni</th>
                          <th class="border-b bg-background px-2 py-2 text-right font-semibold">Fe</th>
                          <th class="border-b bg-background px-2 py-2 text-right font-semibold">Co</th>
                          <th class="border-b bg-background px-2 py-2 text-right font-semibold">MgO</th>
                          <th class="border-b bg-background px-2 py-2 text-right font-semibold">SiO2</th>
                          <th class="border-b bg-background px-2 py-2 text-right font-semibold">S/M</th>
                        </tr>
                      </thead>

                      <tbody>
                        <template v-for="(row, i) in mappedSamples" :key="row.code_lot">
                          <template v-for="(samp, idx) in row.samples" :key="`${row.code_lot}-${idx}`">
                            <tr
                              class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                              <td v-if="idx === 0" :rowspan="row.samples.length" class="border-b px-2 py-2">
                                {{ Number(i) + 1 }}
                              </td>

                              <td v-if="idx === 0" :rowspan="row.samples.length" class="border-b px-2 py-2">
                                {{ row.code_lot }}
                              </td>

                              <td v-if="idx === 0" :rowspan="row.samples.length" class="border-b px-2 py-2">
                                {{ row.barge_code }}
                              </td>

                              <td v-if="idx === 0" :rowspan="row.samples.length" class="border-b px-2 py-2 text-left">
                                {{ row.tonnage_split.toLocaleString() }}
                              </td>

                              <td class="border-b px-2 py-2">{{ samp.source }}</td>
                              <td class="border-b px-2 py-2 text-right">{{ samp.ni?.toFixed(2) ?? "-" }}</td>
                              <td class="border-b px-2 py-2 text-right">{{ samp.fe?.toFixed(2) ?? "-" }}</td>
                              <td class="border-b px-2 py-2 text-right">{{ samp.co?.toFixed(2) ?? "-" }}</td>
                              <td class="border-b px-2 py-2 text-right">{{ samp.mgo?.toFixed(2) ?? "-" }}</td>
                              <td class="border-b px-2 py-2 text-right">{{ samp.sio2?.toFixed(2) ?? "-" }}</td>
                              <td class="border-b px-2 py-2 text-right">
                                {{ samp.mgo && samp.sio2 ? (samp.sio2 / samp.mgo).toFixed(2) : "-" }}
                              </td>
                            </tr>
                          </template>
                        </template>

                        <tr v-if="!mappedSamples.length">
                          <td colspan="11" class="px-2 py-4 text-center text-gray-400">
                            No data available
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <!-- TAB CONTENT 2 -->
            <TabsContent value="summary" class="w-full mt-4">
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between border-b pb-2 mb-3">
                    <div>
                      <div class="text-base font-semibold">Summary Selling Samples</div>
                      <p class="text-sm text-muted-foreground">
                        This section provides a summary of all selling samples, including monthly totals, internal and
                        surveyor
                        measurements.
                      </p>
                    </div>

                    <button @click="handleCopySummaryAll" :disabled="!summaryData.length && !summaryReAssay.length"
                      class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
                      title="Copy all summary tables">
                      <Icon name="i-lucide-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">Loading...</div>
                  <div v-else class="overflow-auto">
                    <table class="table whitespace-nowrap mb-0 min-w-full ti-custom-table-hover text-sm">
                      <thead>
                        <!-- Row 1: Header utama -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead colspan="4" class="text-center px-1 py-0.3">All Selling Original</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Ni</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Fe</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">S/M</TableHead>
                        </TableRow>

                        <!-- Row 2: Sub-header -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead>No</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead class="text-left">Barge Code</TableHead>
                          <TableHead class="text-right">Quantity</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">COA</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">COA</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">COA</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>
                        </TableRow>
                      </thead>

                      <tbody>
                        <template v-for="(row, i) in summaryData" :key="row.code_lot">
                          <TableRow
                            class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                            <TableCell class="px-1 py-0.7">{{ i + 1 }}</TableCell>
                            <TableCell class="px-1 py-0.7">{{ row.date_barge_out }}</TableCell>
                            <TableCell class="px-1 py-0.7">{{ row.barge_name }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.tonnage_official.toLocaleString() }}
                            </TableCell>

                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_diff_perc.toFixed(2) }}</TableCell>

                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_diff_perc.toFixed(2) }}</TableCell>

                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_diff_perc.toFixed(2) }}</TableCell>
                          </TableRow>
                        </template>
                      </tbody>
                      <tfoot>
                        <tr class="text-sm">
                          <th colspan="3" class="px-1 py-0.7">Grand Total</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.totalOre.toLocaleString() }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumNiInternal.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumNiOfficial.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumNiDiff.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumNiDiffPerc.toFixed(2) }}</th>

                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumFeInternal.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumFeOfficial.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumFeDiff.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumFeDiffPerc.toFixed(2) }}</th>

                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumSMInternal.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumSMOfficial.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumSMDiff.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotals.sumSMDiffPerc.toFixed(2) }}</th>
                        </tr>
                      </tfoot>

                    </table>
                  </div>
                </CardContent>
                <!-- All Shipment after Re- Assay -->
                <CardContent>
                  <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">Loading...</div>
                  <div v-else class="overflow-auto">
                    <table class="table whitespace-nowrap mb-0 min-w-full ti-custom-table-hover text-sm">
                      <thead>
                        <!-- Row 1: Header utama -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead colspan="4" class="text-center px-1 py-0.3">All Shipment after Re-Assay
                          </TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Ni</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Fe</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">S/M</TableHead>
                        </TableRow>

                        <!-- Row 2: Sub-header -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead>No</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead class="text-left">Barge Code</TableHead>
                          <TableHead class="text-right">Quantity</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">Surveyor</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">Surveyor</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">Surveyor</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>
                        </TableRow>
                      </thead>

                      <tbody>
                        <template v-for="(row, i) in summaryReAssay" :key="row.code_lot">
                          <TableRow
                            class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                            <TableCell class="px-1 py-0.7">{{ i + 1 }}</TableCell>
                            <TableCell class="px-1 py-0.7">{{ row.date_barge_out }}</TableCell>
                            <TableCell class="px-1 py-0.7">{{ row.barge_name }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.tonnage_official.toLocaleString() }}
                            </TableCell>

                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.ni_diff_perc.toFixed(2) }}</TableCell>

                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.fe_diff_perc.toFixed(2) }}</TableCell>

                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.7 text-right">{{ row.sm_diff_perc.toFixed(2) }}</TableCell>
                          </TableRow>
                        </template>
                      </tbody>
                      <tfoot>
                        <tr class="text-sm">
                          <th colspan="3" class="px-1 py-0.7">Grand Total</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.totalOre.toLocaleString() }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumNiInternal.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumNiOfficial.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumNiDiff.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumNiDiffPerc.toFixed(2) }}</th>

                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumFeInternal.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumFeOfficial.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumFeDiff.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumFeDiffPerc.toFixed(2) }}</th>

                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumSMInternal.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumSMOfficial.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumSMDiff.toFixed(2) }}</th>
                          <th class="px-1 py-0.7 text-right">{{ grandTotalsReAssay.sumSMDiffPerc.toFixed(2) }}</th>
                        </tr>
                      </tfoot>

                    </table>
                  </div>
                </CardContent>

                <!-- By Shipment after Re-Assay -->
                <CardContent>
                  <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">Loading...</div>
                  <div v-else class="overflow-auto">
                    <table class="table whitespace-nowrap mb-0 min-w-full ti-custom-table-hover text-sm">
                      <thead>
                        <!-- Row 1: Header utama -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Selling By Shipment </TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Ni</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">Fe</TableHead>
                          <TableHead colspan="4" class="text-center px-1 py-0.3">S/M</TableHead>
                        </TableRow>

                        <!-- Row 2: Sub-header -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableHead>No</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead class="text-left">Barge Code</TableHead>
                          <TableHead class="text-right">Quantity</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">Surveyor</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">Surveyor</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>

                          <TableHead class="text-right">Internal</TableHead>
                          <TableHead class="text-right">Surveyor</TableHead>
                          <TableHead class="text-right">Diff</TableHead>
                          <TableHead class="text-right">%Diff</TableHead>
                        </TableRow>
                      </thead>

                      <tbody>
                        <template v-for="(group, buyer) in groupedShipment" :key="buyer">
                          <!-- Header per Buyer -->
                          <TableRow class="font-bold bg-gray-200 dark:bg-gray-700 text-sm">
                            <TableCell colspan="16">Shipment to {{ buyer }}</TableCell>
                          </TableRow>

                          <!-- Rows per buyer -->
                          <TableRow v-for="(row, i) in group" :key="row.code_lot"
                            class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                            <TableCell class="px-1 py-0.5">{{ +i + 1 }}</TableCell>
                            <TableCell class="px-1 py-0.5">{{ row.date_barge_out }}</TableCell>
                            <TableCell class="px-1 py-0.5">{{ row.barge_name }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.tonnage_official.toLocaleString() }}
                            </TableCell>

                            <TableCell class="px-1 py-0.5 text-right">{{ row.ni_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.ni_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.ni_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.ni_diff_perc.toFixed(2) }}</TableCell>

                            <TableCell class="px-1 py-0.5 text-right">{{ row.fe_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.fe_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.fe_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.fe_diff_perc.toFixed(2) }}</TableCell>

                            <TableCell class="px-1 py-0.5 text-right">{{ row.sm_split.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.sm_official.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.sm_diff.toFixed(2) }}</TableCell>
                            <TableCell class="px-1 py-0.5 text-right">{{ row.sm_diff_perc.toFixed(2) }}</TableCell>
                          </TableRow>

                          <!-- Subtotal per buyer -->
                          <TableRow class="font-bold bg-gray-100 dark:bg-gray-800">
                            <TableCell colspan="3" class="text-right">Subtotal</TableCell>
                            <TableCell class="text-right">{{ subtotal(group, 'tonnage_official').toLocaleString() }}
                            </TableCell>

                            <TableCell class="text-right">{{ avg(group, 'ni_split').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'ni_official').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'ni_diff').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'ni_diff_perc').toFixed(2) }}</TableCell>

                            <TableCell class="text-right">{{ avg(group, 'fe_split').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'fe_official').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'fe_diff').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'fe_diff_perc').toFixed(2) }}</TableCell>

                            <TableCell class="text-right">{{ avg(group, 'sm_split').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'sm_official').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'sm_diff').toFixed(2) }}</TableCell>
                            <TableCell class="text-right">{{ avg(group, 'sm_diff_perc').toFixed(2) }}</TableCell>
                          </TableRow>
                        </template>
                      </tbody>

                      <!-- GRAND TOTAL -->
                      <tfoot>
                        <TableRow
                          class="font-bold odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm">
                          <TableCell colspan="3" class="text-right">Grand Total</TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.totalOre.toLocaleString() }}
                          </TableCell>

                          <TableCell class="text-right">{{ grandTotalShipment.sumNiInternal.toFixed(2) }}
                          </TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumNiOfficial.toFixed(2) }}
                          </TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumNiDiff.toFixed(2) }}</TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumNiDiffPerc.toFixed(2) }}
                          </TableCell>

                          <TableCell class="text-right">{{ grandTotalShipment.sumFeInternal.toFixed(2) }}
                          </TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumFeOfficial.toFixed(2) }}
                          </TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumFeDiff.toFixed(2) }}</TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumFeDiffPerc.toFixed(2) }}
                          </TableCell>

                          <TableCell class="text-right">{{ grandTotalShipment.sumSMInternal.toFixed(2) }}
                          </TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumSMOfficial.toFixed(2) }}
                          </TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumSMDiff.toFixed(2) }}</TableCell>
                          <TableCell class="text-right">{{ grandTotalShipment.sumSMDiffPerc.toFixed(2) }}
                          </TableCell>
                        </TableRow>
                      </tfoot>

                    </table>
                  </div>
                </CardContent>

              </Card>
            </TabsContent>

            <!-- TAB CONTENT 3 -->
            <TabsContent value="summary-month" class="w-full mt-4">
              <Card>
                <CardHeader>
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle class="text-base">By Month</CardTitle>
                      <CardDescription class="text-sm">
                        Here you can explore your data month by month. Apply filters to see totals and averages for each
                        month.
                      </CardDescription>
                    </div>

                    <button @click="handleCopySummaryMonth" :disabled="!Object.keys(groupedMonth || {}).length"
                      class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
                      title="Copy table">
                      <Icon name="i-lucide-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div v-if="isLoading" class="py-4 text-center text-sm text-gray-500">Loading...</div>
                  <div v-else class="overflow-auto">
                    <table
                      class="table whitespace-nowrap mb-0 min-w-full ti-custom-table-hover text-sm border border-gray-300 dark:border-gray-600">
                      <thead>
                        <!-- Row 1: Header utama -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm border-b border-gray-300 dark:border-gray-600">
                          <TableHead colspan="5" class="text-center px-1 py-0.5 border-gray-300 dark:border-gray-600">
                            All
                            Selling</TableHead>
                          <TableHead colspan="3" class="text-center px-1 py-0.5 border-gray-300 dark:border-gray-600">
                            Internal</TableHead>
                          <TableHead colspan="3" class="text-center px-1 py-0.5">Surveyor</TableHead>
                        </TableRow>

                        <!-- Row 2: Sub-header -->
                        <TableRow
                          class="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800/20 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 text-sm border-b border-gray-300 dark:border-gray-600">
                          <TableHead class="border-gray-300 dark:border-gray-600">Month</TableHead>
                          <TableHead class="border-gray-300 dark:border-gray-600">Type</TableHead>
                          <TableHead class=" border-gray-300 dark:border-gray-600">Destination</TableHead>
                          <TableHead class="text-left  border-gray-300 dark:border-gray-600">Barge</TableHead>
                          <TableHead class="text-right border-gray-300 dark:border-gray-600">Quantity
                          </TableHead>

                          <TableHead class="text-right border-gray-300 dark:border-gray-600">Ni</TableHead>
                          <TableHead class="text-right border-gray-300 dark:border-gray-600">Fe</TableHead>
                          <TableHead class="text-right border-gray-300 dark:border-gray-600">S/M</TableHead>

                          <TableHead class="text-right border-gray-300 dark:border-gray-600">Ni</TableHead>
                          <TableHead class="text-right border-gray-300 dark:border-gray-600">Fe</TableHead>
                          <TableHead class="text-right">S/M</TableHead>
                        </TableRow>
                      </thead>

                      <tbody>
                        <template v-for="(group, month) in groupedMonth" :key="month">
                          <!-- Header per Month -->
                          <tr
                            class="font-bold bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                            <td colspan="12">Data : {{ month }}</td>
                          </tr>

                          <!-- Rows -->
                          <tr v-for="(row, i) in group" :key="row.code_lot"
                            class="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                            <td class="border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{ +i + 1 }}</td>
                            <td class="border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.type_selling === 'LIS' ?
                                'Limonite' : row.type_selling === 'SAS' ? 'Saprolite' : row.type_selling }}</td>
                            <td class="border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{ row.buyer }}
                            </td>
                            <td class="border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.total_barge }}</td>
                            <td class="text-right border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.tonnage_official.toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</td>
                            <td class="text-right border-r border-gray-200 dark:border-gray-600 px-1 py-0.5 ">{{
                              row.ni_split.toFixed(2) }}</td>
                            <td class="text-right border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.fe_split.toFixed(2) }}</td>
                            <td class="text-right border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.sm_split.toFixed(2) }}</td>
                            <td class="text-right border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.ni_official.toFixed(2) }}</td>
                            <td class="text-right border-r border-gray-200 dark:border-gray-600 px-1 py-0.5">{{
                              row.fe_official.toFixed(2) }}</td>
                            <td class="text-right px-1 py-0.5">{{ row.sm_official.toFixed(2) }}</td>
                          </tr>

                          <!-- Subtotal per month -->
                          <tr
                            class="font-bold bg-gray-50 dark:bg-gray-800 border-t border-b border-gray-300 dark:border-gray-600">
                            <td colspan="4">Total {{ month }}</td>
                            <td class="text-right px-1 py-0.5">{{ subtotalMonth(group,
                              'tonnage_official').toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</td>
                            <td class="text-right px-1 py-0.5">{{ avgMonth(group, 'ni_split').toFixed(2) }}</td>
                            <td class="text-right px-1 py-0.5">{{ avgMonth(group, 'fe_split').toFixed(2) }}</td>
                            <td class="text-right px-1 py-0.5">{{ avgMonth(group, 'sm_split').toFixed(2) }}</td>
                            <td class="text-right px-1 py-0.5">{{ avgMonth(group, 'ni_official').toFixed(2) }}</td>
                            <td class="text-right px-1 py-0.5">{{ avgMonth(group, 'fe_official').toFixed(2) }}</td>
                            <td class="text-right px-1 py-0.5">{{ avgMonth(group, 'sm_official').toFixed(2) }}</td>
                          </tr>
                        </template>
                      </tbody>

                      <tfoot>
                        <tr
                          class="font-bold bg-gray-200 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
                          <td colspan="4">Grand Total</td>
                          <td class="text-right">{{ grandTotaByMonth.totalOre.toLocaleString('en-US',
                            { maximumFractionDigits: 2 }) }}
                          </td>
                          <td class="text-right px-1 py-0.5">{{ grandTotaByMonth.sumNiInternal.toFixed(2) }}</td>
                          <td class="text-right px-1 py-0.5">{{ grandTotaByMonth.sumFeInternal.toFixed(2) }}</td>
                          <td class="text-right px-1 py-0.5">{{ grandTotaByMonth.sumSMInternal.toFixed(2) }}</td>
                          <td class="text-right px-1 py-0.5">{{ grandTotaByMonth.sumNiOfficial.toFixed(2) }}</td>
                          <td class="text-right px-1 py-0.5">{{ grandTotaByMonth.sumFeOfficial.toFixed(2) }}</td>
                          <td class="text-right px-1 py-0.5">{{ grandTotaByMonth.sumSMOfficial.toFixed(2) }}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <!-- </CardContent>
        </Card> -->
      </div>
    </div>

  </div>
</template>

<style scoped></style>
