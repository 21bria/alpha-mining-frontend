import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type SellingCodeRow = {
  id: number
  iup: number | null
  iup_code: string | null
  iup_name: string | null
  code: string
  type: string
  description: string | null
  active: number | null
  truck_factors: number | null
  sublot_close: string | null
  group_close: number | null
  ritase_max: number | null
  ni: number | null
  fe: number | null
  mgo: number | null
  sio2: number | null
  user?: number | null
}

type ColumnActions = {
  onEdit: (row: SellingCodeRow) => void
  onDelete: (row: SellingCodeRow) => void
}

type CheckState = boolean | "indeterminate"
export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function fmtStatus(v: number | null | undefined) {
  if (v === null || v === undefined) return "-"
  if (v === 1) return "Active"
  if (v === 0) return "Inactive"
  return String(v)
}

function fmtValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "-"
  return String(v)
}

function textCell(v: string | number | null | undefined, cls = "font-medium") {
  return h("div", { class: cls }, fmtValue(v))
}

export function getSellingCodeColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SellingCodeRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<SellingCodeRow>[] = [
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
      accessorKey: "type",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Type" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.type),
    },
    {
      accessorKey: "code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Code" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.code),
    },
 
    {
      accessorKey: "sublot_close",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SubLot Close" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sublot_close),
    },
    {
      accessorKey: "group_close",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Group Close" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.group_close),
    },
       {
      accessorKey: "truck_factors",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Truck Factors" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.truck_factors),
    },
    {
      accessorKey: "ritase_max",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ritase Max" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.ritase_max),
    },

    {
      accessorKey: "ni",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ni%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.ni),
    },
    {
      accessorKey: "fe",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Fe%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.fe),
    },
    {
      accessorKey: "mgo",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "MgO%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.mgo),
    },
    {
      accessorKey: "sio2",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SiO2%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sio2),
    },

    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }: { column: any }) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }: { row: { original: SellingCodeRow } }) =>
            textCell(row.original.iup_code, "text-muted-foreground"),
        } as ColumnDef<SellingCodeRow>,
      ]
      : []),

    {
      accessorKey: "active",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.active)),
    },

    {
      accessorKey: "description",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground line-clamp-2" },
          fmtValue(row.original.description)
        ),
    },

    ...(canMutate
      ? [
        {
          id: "actions",
          header: () => h("div", { class: "text-right" }, "Actions"),
          cell: ({ row }: { row: { original: SellingCodeRow } }) =>
            h("div", { class: "flex justify-end" }, [
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
            ]),
        } as ColumnDef<SellingCodeRow>,
      ]
      : []),
  ]

  return cols
}