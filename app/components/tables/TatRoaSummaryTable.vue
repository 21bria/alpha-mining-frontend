<script setup lang="ts">
import { computed } from "vue"
import { useNotify } from "@/composables/useNotify"

const notify = useNotify()

type TableRow = {
  description: string
  order: number | string
  on_tat: number | string
  over_tat: number | string
  released: number | string
  pre_released: number | string
  tat: number | string
  limit: number | string
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
  const headers = [
    "Weeks",
    "Order",
    "ON TAT",
    "OVER TAT",
    "Released",
    "Pre-Released",
    "TAT",
    "Limit",
  ]

  const lines = rows.value.map((row) =>
    [
      row.description,
      row.order,
      row.on_tat,
      row.over_tat,
      row.released,
      row.pre_released,
      row.tat,
      row.limit,
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
          {{ title || section?.title || "TAT ROA Summary Table" }}
        </h3>
      </div>

      <button @click="handleCopy" :disabled="!rows.length"
        class="inline-flex items-center justify-center rounded-lg border px-2 py-2 hover:bg-muted disabled:opacity-50"
        title="Copy table">
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
            <th class="px-4 py-2 text-left font-semibold min-w-[140px]">Weeks</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Order</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">ON TAT</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">OVER TAT</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Released</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[110px]">Pre-Released</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">TAT</th>
            <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Limit</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, index) in rows" :key="`${row.description}-${index}`"
            class="border-b last:border-b-0 odd:bg-background even:bg-muted/20">
            <td class="px-4 py-2 font-medium">{{ row.description }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.order) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.on_tat) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.over_tat) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.released) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.pre_released) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.tat) }}</td>
            <td class="px-4 py-2 text-center">{{ formatCell(row.limit) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>