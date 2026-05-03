import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type SellingBargingTemporaryRow = {
  id: string

  iup_id: number | null
  iup_code: string | null
  iup_name: string | null

  date_hauling: string | null
  time_hauling: string | null
  shift: string | null

  dome: string | null
  stockpile: string | null
  material: string | null

  unit_code: string | null
  tonnage: string | number | null

  code_lot: string | null
  code_inc: string | number | null
  code_sub: string | null

  barge_code: string | number | null
  type_selling: string | null
  no_urut: string | number | null

  sale_adjust: string | null
  description: string | null

  user_id: number | null
  username: string | null
  created_at: string | null
}

function fmtValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "-"
  return String(v)
}

function textCell(
  v: string | number | null | undefined,
  cls = "font-medium"
) {
  return h("div", { class: cls }, fmtValue(v))
}

type ColumnActions = {
  onEdit: (row: SellingBargingTemporaryRow) => void
  onDelete: (row: SellingBargingTemporaryRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getSellingBargingTemporaryColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SellingBargingTemporaryRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<SellingBargingTemporaryRow>[] = [
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
      accessorKey: "date_hauling",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Date Hauling" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.date_hauling),
    },
    {
      accessorKey: "time_hauling",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Time" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.time_hauling),
    },
    {
      accessorKey: "shift",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Shift" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.shift),
    },
    {
      accessorKey: "dome",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Dome" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.dome),
    },
    // {
    //   accessorKey: "stockpile",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Stockpile" }),
    //   enableSorting: true,
    //   cell: ({ row }) => textCell(row.original.stockpile),
    // },
    {
      accessorKey: "material",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Materials" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.material),
    },
    {
      accessorKey: "unit_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Truck" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.unit_code),
    },
    {
      accessorKey: "tonnage",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tonnage" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.tonnage),
    },
    {
      accessorKey: "code_lot",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Code Lot" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.code_lot),
    },
    {
      accessorKey: "code_inc",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Inc" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.code_inc),
    },
    {
      accessorKey: "code_sub",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sub Lot" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.code_sub),
    },
    {
      accessorKey: "barge_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Barge Code" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.barge_code),
    },
    {
      accessorKey: "type_selling",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Type" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.type_selling),
    },
    {
      accessorKey: "no_urut",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sort" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.no_urut),
    },
    {
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.username),
    },

    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }) =>
            h(
              "div",
              { class: "text-muted-foreground" },
              row.original.iup_code ?? "-"
            ),
        } as ColumnDef<SellingBargingTemporaryRow>,
        // {
        //   accessorKey: "iup_name",
        //   header: ({ column }) =>
        //     h(DataTableColumnHeader, { column, title: "IUP Name" }),
        //   enableSorting: true,
        //   cell: ({ row }) =>
        //     h(
        //       "div",
        //       { class: "text-muted-foreground" },
        //       row.original.iup_name ?? "-"
        //     ),
        // } as ColumnDef<SellingBargingTemporaryRow>,
      ]
      : []),
    ...(canMutate
      ? [
        {
          id: "actions",
          header: () => h("div", { class: "text-left" }, "Actions"),
          cell: ({ row }: { row: { original: SellingBargingTemporaryRow } }) =>
            h("div", { class: "flex justify-end" }, [
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
            ]),
        } as ColumnDef<SellingBargingTemporaryRow>,
      ]
      : []),

  ]

  return cols
}