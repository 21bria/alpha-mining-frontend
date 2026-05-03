import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type SellingBargingRow = {
  id: string

  iup_id: number | null
  iup_code: string | null
  iup_name: string | null

  date_barge_in: string | null
  date_barge_out: string | null
  date_hauling: string | null
  time_hauling: string | null

  shift: string | null
  barge_code: string | null
  stockpile: string | null
  dome: string | null
  material: string | null
  unit_code: string | null

  batch: string | null
  code_lot: string | null
  code_sub: string | null

  ritase: number | null
  tonnage: string | number | null
  ton_barge_load: string | number | null
  ton_barge_unload: string | number | null
  fill_adjust: string | number | null

  sale_adjust: string | null
  sale_dome: string | null
  type_selling: string | null
  status_barging: string | null
  direct: string | null

  factory_stock: string | null
  code_inc: string | null
  code_batch_in: string | null
  code_batch_ex: string | null
  code_batch_pulp: string | null
  surv_order: string | null
  code_fix_batch: string | null
  no_input: string | null
  description: string | null

  user_id: number | null
  username: string | null
  created_at: string | null
}

function fmtValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "-"
  return String(v)
}

function textCell(v: string | number | null | undefined, cls = "font-medium") {
  return h("div", { class: cls }, fmtValue(v))
}

type ColumnActions = {
  onEdit: (row: SellingBargingRow) => void
  onDelete: (row: SellingBargingRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getSellingBargingColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SellingBargingRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<SellingBargingRow>[] = [
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
      accessorKey: "date_barge_in",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Arrival" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.date_barge_in),
    },
    {
      accessorKey: "date_hauling",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date Hauling" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.date_hauling),
    },
    {
      accessorKey: "shift",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Shift" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.shift),
    },
    {
      accessorKey: "barge_code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Barge Code" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.barge_code),
    },
    {
      accessorKey: "stockpile",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Stockpile" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.stockpile),
    },
    {
      accessorKey: "dome",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Dome" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.dome),
    },
    {
      accessorKey: "material",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Materials" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.material),
    },
    {
      accessorKey: "code_lot",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Code Lot" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.code_lot),
    },
    {
      accessorKey: "code_sub",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Sub Lot" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.code_sub),
    },
    {
      accessorKey: "batch",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Group" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.batch),
    },
    {
      accessorKey: "ritase",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ritase" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.ritase),
    },
    {
      accessorKey: "tonnage",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Tonnage" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.tonnage),
    },
    {
      accessorKey: "sale_adjust",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Adjust" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sale_adjust),
    },
    {
      accessorKey: "date_barge_out",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Departure" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.date_barge_out),
    },
    {
      accessorKey: "status_barging",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.status_barging),
    },
    {
      accessorKey: "username",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created By" }),
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
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<SellingBargingRow>,
        // {
        //   accessorKey: "iup_name",
        //   header: ({ column }) =>
        //     h(DataTableColumnHeader, { column, title: "IUP Name" }),
        //   enableSorting: true,
        //   cell: ({ row }) =>
        //     h("div", { class: "text-muted-foreground" }, row.original.iup_name ?? "-"),
        // } as ColumnDef<SellingBargingRow>,
      ]
      : []),
  ]

  return cols
}