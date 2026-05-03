import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'

export type CRMCertificateRow = {
  id: number
  oreas_name: string | null
  ni: number | null
  co: number | null
  al2o3: number | null
  cao: number | null
  cr2o3: number | null
  fe2o3: number | null
  fe: number | null
  k2o: number | null
  mgo: number | null
  mno: number | null
  na2o: number | null
  p2o5: number | null
  p: number | null
  sio2: number | null
  tio2: number | null
  s: number | null
  cu: number | null
  zn: number | null
  ci: number | null
  so3: number | null
  loi: number | null
  sm: number | null
  user?: number | null
}

type ColumnActions = {
  onEdit: (row: CRMCertificateRow) => void
  onDelete: (row: CRMCertificateRow) => void
}

type CheckState = boolean | "indeterminate"

function formatNumber(value: number | string | null | undefined, digits = 2) {
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

const gradeColumns = [
  { key: "ni", label: "Ni" },
  { key: "co", label: "Co" },
  { key: "al2o3", label: "Al2O3" },
  { key: "cao", label: "CaO" },
  { key: "cr2o3", label: "Cr2O3" },
  { key: "fe2o3", label: "Fe2O3" },
  { key: "fe", label: "Fe" },
  // { key: "k2o", label: "K2O" },
  { key: "mgo", label: "MgO" },
  { key: "mno", label: "MnO" },
  // { key: "na2o", label: "Na2O" },
  { key: "p2o5", label: "P2O5" },
  // { key: "p", label: "P" },
  { key: "sio2", label: "SiO2" },
  { key: "tio2", label: "TiO2" },
  // { key: "s", label: "S" },
  // { key: "cu", label: "Cu" },
  { key: "zn", label: "Zn" },
  // { key: "ci", label: "Cl" }, // biasanya CI dibaca Chlorine
  { key: "so3", label: "SO3" },
  { key: "loi", label: "LOI" },
  { key: "sm", label: "SM" },
]

export function getCRMCertificateColumns(actions: ColumnActions): ColumnDef<CRMCertificateRow>[] {
  return [
    // checkbox
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

    // oreas name
    {
      accessorKey: "oreas_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "OREAS" }),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.oreas_name ?? "-"),
    },

    // AUTO GENERATE GRADE COLUMNS
    ...gradeColumns.map(col => ({
      accessorKey: col.key,
      header: ({ column }: any) =>
        h(DataTableColumnHeader, { column, title: col.label }),
      enableSorting: true,
      cell: ({ row }: any) =>
        h(
          "div",
          { class: getGradeColor(row.original[col.key]) },
          formatNumber(row.original[col.key])
        ),
    })),
  ]
}