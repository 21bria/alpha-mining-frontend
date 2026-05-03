<script setup lang="ts">
import { computed } from "vue"
import { useNotify } from "@/composables/useNotify"
const notify = useNotify()

type TableRow = {
  description: string
  ni: number | string
  co: number | string
  fe: number | string
  mgo: number | string
  sio2: number | string
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

function formatCell(value: number | string | null | undefined, description?: string) {
  if (value === null || value === undefined || value === "") return "0"

  const num = Number(value)
  if (Number.isNaN(num)) return String(value)

  const desc = (description || "").toLowerCase()

  if (desc.includes("(%)")) {
    return `${num.toFixed(1)}%`
  }

  if (desc.includes("average")) {
    return num.toFixed(3)
  }

  return num.toLocaleString("en-US")
}

function buildClipboardText() {
  if (!rows.value.length) return ""

  const titleText = props.title || props.section?.title || ""

  const headers = ["Description", "Ni", "Co", "Fe", "Mgo", "SiO2"]

  const lines = rows.value.map((row) => {
    return [
      row.description,
      row.ni,
      row.co,
      row.fe,
      row.mgo,
      row.sio2,
    ].join("\t")
  })

  return [
    titleText, // judul ikut ke-copy
    headers.join("\t"),
    ...lines,
  ].join("\n")
}

async function handleCopy() {
  try {
    const text = buildClipboardText() // ini wajib

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
          {{ title || section?.title || "Wet Duplicate Summary" }}
        </h3>
      </div>

      <button @click="handleCopy"
        :disabled="!rows.length"
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
          <th class="px-4 py-2 text-left font-semibold min-w-[160px]">
            Description
          </th>
          <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Ni</th>
          <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Co</th>
          <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Fe</th>
          <th class="px-4 py-2 text-center font-semibold min-w-[90px]">Mgo</th>
          <th class="px-4 py-2 text-center font-semibold min-w-[90px]">SiO2</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, index) in rows" :key="`${row.description}-${index}`"
          class="border-b last:border-b-0 odd:bg-background even:bg-muted/20">
          <td class="px-4 py-2 font-medium">
            {{ row.description }}
          </td>
          <td class="px-4 py-2 text-center">
            {{ formatCell(row.ni, row.description) }}
          </td>
          <td class="px-4 py-2 text-center">
            {{ formatCell(row.co, row.description) }}
          </td>
          <td class="px-4 py-2 text-center">
            {{ formatCell(row.fe, row.description) }}
          </td>
          <td class="px-4 py-2 text-center">
            {{ formatCell(row.mgo, row.description) }}
          </td>
          <td class="px-4 py-2 text-center">
            {{ formatCell(row.sio2, row.description) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  </div>
</template>