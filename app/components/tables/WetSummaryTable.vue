<script setup lang="ts">
import { computed } from "vue"
import { useNotify } from "@/composables/useNotify"

const notify = useNotify()

type TableRow = {
  description: string
  cks: number | string
  spc: number | string
  pds: number | string
  qaqc: number | string
  spc_qa: number | string
  lis: number | string
  sas: number | string
}

type TableSection = {
  title?: string
  rows?: TableRow[]
}

const props = defineProps<{
  title?: string
  section?: TableSection | null
  loading?: boolean
}>()

const rows = computed<TableRow[]>(() => props.section?.rows ?? [])

function formatCell(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "0"

  const num = Number(value)
  if (Number.isNaN(num)) return String(value)

  return num.toLocaleString("en-US")
}

function buildClipboardText() {
  if (!rows.value.length) return ""

  const titleText = props.title || props.section?.title || ""
  const headers = ["Description", "CKS", "SPC", "PDS", "QAQC", "SPC(QA)", "LIS", "SAS"]

  const lines = rows.value.map((row) =>
    [
      row.description,
      row.cks,
      row.spc,
      row.pds,
      row.qaqc,
      row.spc_qa,
      row.lis,
      row.sas,
    ].join("\t")
  )

  return [titleText, headers.join("\t"), ...lines].join("\n")
}

async function handleCopy() {
  try {
    const text = buildClipboardText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    notify.success("Copied! Paste directly into Excel 👍")
  } catch (err) {
    console.error("Copy failed", err)
    notify.error("Failed to copy table")
  }
}
</script>

<template>
  <div class="rounded-xl border bg-background p-4 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">
          {{ title || section?.title || "Lab Summary Table" }}
        </h3>
      </div>

      <button
        @click="handleCopy"
        :disabled="!rows.length"
        class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
        title="Copy table"
      >
        <Icon name="i-lucide-copy" class="w-4 h-4" />
      </button>
    </div>

    <div v-if="loading" class="rounded-lg border p-6 text-sm text-muted-foreground">
      Loading table data...
    </div>

    <div v-else-if="rows.length === 0" class="rounded-lg border p-6 text-sm text-muted-foreground">
      No data available
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b bg-muted/40">
            <th class="px-4 py-2 text-left font-semibold min-w-[180px]">Description</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">CKS</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">SPC</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">PDS</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">QAQC</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">SPC(QA)</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">LIS</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">SAS</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="`${row.description}-${index}`"
            class="border-b last:border-b-0 odd:bg-background even:bg-muted/20"
          >
            <td class="px-4 py-2 font-medium">{{ row.description }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.cks) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.spc) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.pds) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.qaqc) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.spc_qa) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.lis) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.sas) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>