import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"

export type SampleCrmRoaRow = {
  oreas_name: string | null
  ni: number | null
  co: number | null
  fe2o3: number | null
  fe: number | null
  mgo: number | null
  sio2: number | null
  al2o3: number | null

  sample_number: string | null
  sampling_deskripsi: string | null
  sample_id: string | null
  release_date: string | null

  roa_ni: number | null
  roa_co: number | null
  roa_fe2o3: number | null
  roa_fe: number | null
  roa_mgo: number | null
  roa_sio2: number | null
  roa_al2o3: number | null

  diff_ni: number | null
  diff_co: number | null
  diff_fe2o3: number | null
  diff_fe: number | null
  diff_mgo: number | null
  diff_sio2: number | null
  diff_al2o3: number | null

  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
}

type ColumnActions = {
  onEdit: (row: SampleCrmRoaRow) => void
  onDelete: (row: SampleCrmRoaRow) => void
}

type CheckState = boolean | "indeterminate"

function formatNumber(value: number | string | null | undefined, digits = 3) {
  if (value === null || value === undefined || value === "") return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function getGradeColor(value: number | null | undefined) {
  if (value === null || value === undefined) return "text-muted-foreground"
  if (value >= 2) return "text-green-600 font-semibold"
  if (value >= 1) return "text-yellow-600 font-medium"
  return "text-red-600 font-medium"
}

function getDiffColor(value: number | null | undefined) {
  if (value === null || value === undefined) return "text-muted-foreground"
  if (value <= 5) return "text-green-600 font-semibold"
  if (value <= 10) return "text-yellow-600 font-medium"
  return "text-red-600 font-semibold"
}

const analyteColumns = [
  { key: "ni", label: "Ni" },
  { key: "co", label: "Co" },
  { key: "fe2o3", label: "Fe2O3" },
  { key: "fe", label: "Fe" },
  { key: "mgo", label: "MgO" },
  { key: "sio2", label: "SiO2" },
  { key: "al2o3", label: "Al2O3" },
] as const

export function getSampleCrmRoaColumns(
  actions: ColumnActions
): ColumnDef<SampleCrmRoaRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            table.toggleAllPageRowsSelected(v === true),
          indeterminate: table.getIsSomePageRowsSelected(),
          onClick: (e: MouseEvent) => e.stopPropagation(),
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),
        }),
      enableSorting: false,
      size: 40,
    },

    {
      accessorKey: "oreas_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "OREAS" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium whitespace-nowrap" }, row.original.oreas_name ?? "-"),
    },
    {
      accessorKey: "sample_number",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sample No" }),
      cell: ({ row }) => row.original.sample_number ?? "-",
    },
    {
      accessorKey: "sample_id",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "ROA Sample ID" }),
      cell: ({ row }) => row.original.sample_id ?? "-",
    },
    {
      accessorKey: "release_date",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Release Date" }),
      cell: ({ row }) => row.original.release_date ?? "-",
    },
    {
      accessorKey: "iup_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "IUP" }),
      cell: ({ row }) => row.original.iup_code ?? "-",
    },

    ...analyteColumns.map((col) => ({
      accessorKey: col.key,
      header: ({ column }: any) =>
        h(DataTableColumnHeader, { column, title: `CRM ${col.label}` }),
      enableSorting: true,
      cell: ({ row }: any) =>
        h(
          "div",
          { class: getGradeColor(row.original[col.key]) },
          formatNumber(row.original[col.key])
        ),
    })),

    ...analyteColumns.map((col) => ({
      accessorKey: `roa_${col.key}`,
      header: ({ column }: any) =>
        h(DataTableColumnHeader, { column, title: `ROA ${col.label}` }),
      enableSorting: true,
      cell: ({ row }: any) =>
        h(
          "div",
          { class: "text-sky-700 dark:text-sky-400 font-medium" },
          formatNumber(row.original[`roa_${col.key}` as keyof SampleCrmRoaRow] as number | null | undefined)
        ),
    })),

    ...analyteColumns.map((col) => ({
      accessorKey: `diff_${col.key}`,
      header: ({ column }: any) =>
        h(DataTableColumnHeader, { column, title: `Diff ${col.label} (%)` }),
      enableSorting: true,
      cell: ({ row }: any) =>
        h(
          "div",
          { class: getDiffColor(row.original[`diff_${col.key}` as keyof SampleCrmRoaRow] as number | null | undefined) },
          formatNumber(row.original[`diff_${col.key}` as keyof SampleCrmRoaRow] as number | null | undefined)
        ),
    })),
  ]
}