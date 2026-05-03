import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type AssayMralRow = {
  id: string
  iup: number | null
  iup_code?: string | null
  iup_name?: string | null
  release_mral_display: string | null
  job_number: string | null
  sample_id: number | null
  ni_display: number | null
  co_display: number | null
  fe2o3_display: number | null
  fe_display: number | null
  mgo_display: number | null
  sio2_display: number | null
  user: string | null
}

type ColumnActions = {
  onEdit: (row: AssayMralRow) => void
  onDelete: (row: AssayMralRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function fmtValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "-"
  return String(v)
}

function textCell(v: string | number | null | undefined, cls = "font-medium") {
  return h("div", { class: cls }, fmtValue(v))
}

export function getAssayMralColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<AssayMralRow>[] {
  
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<AssayMralRow>[] = [
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            table.toggleAllPageRowsSelected(v === true),
          indeterminate: table.getIsSomePageRowsSelected(),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select all",
          disabled: !canMutate,
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) => row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
          disabled: !canMutate,
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "release_mral",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Release" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.release_mral_display),
    },
    {
      accessorKey: "job_number",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Job Number" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.job_number),
    },
    {
      accessorKey: "sample_id",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Sample ID" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sample_id),
    },
    {
      accessorKey: "ni_display",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ni%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.ni_display),
    },
    {
      accessorKey: "fe2o3_display",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Fe2O3%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.fe2o3_display),
    },
    {
      accessorKey: "fe_display",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Fe%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.fe_display),
    },
    {
      accessorKey: "mgo_display",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "MgO%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.mgo_display),
    },
    {
      accessorKey: "sio2_display",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SiO2%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sio2_display),
    },
    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<AssayMralRow>,
      ]
      : []),
    ...(canMutate
      ? [
        {
          id: "actions",
          header: () => h("div", { class: "text-right" }, "Actions"),
          cell: ({ row }: { row: { original: AssayMralRow } }) =>
            h("div", { class: "flex justify-end" }, [
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
            ]),
        } as ColumnDef<AssayMralRow>,
      ]
      : []),
  ]

  return cols
}