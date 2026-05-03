import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"

export type SampleDupRoaRow = {
  release_date: string | null
  nama_material: string | null
  sample_number: string | null
  sample_original: string | null

  ni: number | null
  ni_ori: number | null
  ni_diff: number | null
  ni_rel_diff: number | null
  ni_rel_abs: number | null
  ni_error: number | null

  co: number | null
  co_ori: number | null
  co_diff: number | null
  co_rel_diff: number | null
  co_rel_abs: number | null
  co_error: number | null

  fe: number | null
  fe_ori: number | null
  fe_diff: number | null
  fe_rel_diff: number | null
  fe_rel_abs: number | null
  fe_error: number | null

  mgo: number | null
  mgo_ori: number | null
  mgo_diff: number | null
  mgo_rel_diff: number | null
  mgo_rel_abs: number | null
  mgo_error: number | null

  sio2: number | null
  sio2_ori: number | null
  sio2_diff: number | null
  sio2_rel_diff: number | null
  sio2_rel_abs: number | null
  sio2_error: number | null

  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
}

type ColumnActions = {
  onEdit: (row: SampleDupRoaRow) => void
  onDelete: (row: SampleDupRoaRow) => void
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
  if (Math.abs(value) <= 5) return "text-green-600 font-semibold"
  if (Math.abs(value) <= 10) return "text-yellow-600 font-medium"
  return "text-red-600 font-semibold"
}

function renderRemark(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return h("div", { class: "text-muted-foreground text-xs" }, "-")
  }

  if (Number(value) === 0) {
    return h(
      "div",
      { class: "text-yellow-600 text-xs font-medium" },
      "Error"
    )
  }

  return h(
    "div",
    { class: "text-green-600 text-xs font-semibold" },
    "Good"
  )
}

const analyteColumns = [
  { key: "ni", label: "Ni" },
  { key: "co", label: "Co" },
  { key: "fe", label: "Fe" },
  { key: "mgo", label: "MgO" },
  { key: "sio2", label: "SiO2" },
] as const

type AnalyteKey = typeof analyteColumns[number]["key"]

export function getSampleDupRoaColumns(
  actions: ColumnActions
): ColumnDef<SampleDupRoaRow>[] {
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
          onClick: (e: MouseEvent) => e.stopPropagation(),
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "release_date",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Release Date" }),
      cell: ({ row }) => row.original.release_date ?? "-",
    },
    {
      accessorKey: "nama_material",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Material" }),
      cell: ({ row }) => row.original.nama_material ?? "-",
    },
    {
      accessorKey: "sample_number",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sample [Dup]" }),
      cell: ({ row }) => row.original.sample_number ?? "-",
    },
    {
      accessorKey: "sample_original",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sample [Ori]" }),
      cell: ({ row }) => row.original.sample_original ?? "-",
    },
    {
      accessorKey: "iup_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "IUP" }),
      cell: ({ row }) => row.original.iup_code ?? "-",
    },

    ...analyteColumns.flatMap((col) => {
      const key = col.key as AnalyteKey

      return [
        {
          accessorKey: key,
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: col.label }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h(
              "div",
              { class: getGradeColor(row.original[key]) },
              formatNumber(row.original[key])
            ),
        },
        {
          accessorKey: `${key}_ori`,
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: `${col.label} [Ori]` }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h(
              "div",
              { class: "text-sky-700 dark:text-sky-400 font-medium" },
              formatNumber(
                row.original[`${key}_ori` as keyof SampleDupRoaRow] as
                  | number
                  | null
                  | undefined
              )
            ),
        },
        {
          accessorKey: `${key}_diff`,
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: "Diff" }),
          enableSorting: true,
          cell: ({ row }: any) => {
            const value = row.original[
              `${key}_diff` as keyof SampleDupRoaRow
            ] as number | null | undefined

            return h(
              "div",
              { class: getDiffColor(value) },
              formatNumber(value)
            )
          },
        },
        {
          accessorKey: `${key}_rel_diff`,
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: "Rel [Diff]" }),
          enableSorting: true,
          cell: ({ row }: any) => {
            const value = row.original[
              `${key}_rel_diff` as keyof SampleDupRoaRow
            ] as number | null | undefined

            return h(
              "div",
              { class: getDiffColor(value) },
              formatNumber(value)
            )
          },
        },
        {
          accessorKey: `${key}_rel_abs`,
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: "Rel [Error]" }),
          enableSorting: true,
          cell: ({ row }: any) => {
            const value = row.original[
              `${key}_rel_abs` as keyof SampleDupRoaRow
            ] as number | null | undefined

            return h(
              "div",
              { class: getDiffColor(value) },
              formatNumber(value)
            )
          },
        },
        {
          accessorKey: `${key}_error`,
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: "Remark" }),
          enableSorting: true,
          cell: ({ row }: any) =>
            renderRemark(
              row.original[`${key}_error` as keyof SampleDupRoaRow] as
                | number
                | null
                | undefined
            ),
        },
      ] as ColumnDef<SampleDupRoaRow>[]
    }),
  ]
}