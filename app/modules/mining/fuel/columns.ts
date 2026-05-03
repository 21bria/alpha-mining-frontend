import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"
import { formatDateTime } from "@/utils/formatDate"

export type FuelConsumptionRow = {
  id: number
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null

  date: string | null
  shift: string | null
  unit: string | null
  category: string | null
  hours_metre: number | string | null
  drivers: string | null
  charging_time: string | null
  volume: number | string | null
  storage: string | null
  operator: string | null
  code: string | null

  user_id: number | null
  username: string | null
  created_at: string | null
}

type ColumnActions = {
  onEdit: (row: FuelConsumptionRow) => void
  onDelete: (row: FuelConsumptionRow) => void
}
type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getFuelConsumptionColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<FuelConsumptionRow>[] {

  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<FuelConsumptionRow>[] = [
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
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "date",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.date ?? "-"),
    },
    // {
    //   accessorKey: "shift",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Shift" }),
    //   enableSorting: true,
    //   cell: ({ row }) => h("div", { class: "font-medium" }, row.original.shift ?? "-"),
    // },
    {
      accessorKey: "unit",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Unit" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.unit ?? "-"),
    },
    {
      accessorKey: "category",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Category" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.category ?? "-"),
    },
    {
      accessorKey: "hours_metre",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Hours Metre" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.hours_metre ?? "-"),
    },
    {
      accessorKey: "drivers",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Drivers" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.drivers ?? "-"),
    },
    {
      accessorKey: "charging_time",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Charging Time" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.charging_time ?? "-"),
    },
    {
      accessorKey: "volume",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Volume" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.volume ?? "-"),
    },
    // {
    //   accessorKey: "storage",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Storage" }),
    //   enableSorting: true,
    //   cell: ({ row }) => h("div", { class: "font-medium" }, row.original.storage ?? "-"),
    // },
    {
      accessorKey: "operator",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Operator" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.operator ?? "-"),
    },
    {
      accessorKey: "code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Vendor" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.code ?? "-"),
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
        } as ColumnDef<FuelConsumptionRow>,
      ]
      : []),
    {
      accessorKey: "username",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.username ?? "-"),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created At" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatDateTime(row.original.created_at ?? "-")),
    },

    // kalau nanti mau aktifkan action
    // ...(canMutate
    //   ? [
    //     {
    //       id: "actions",
    //       header: () => h("div", { class: "text-left" }, "Actions"),
    //       cell: ({ row }: { row: { original: FuelConsumptionRow } }) =>
    //         h("div", { class: "flex justify-end" }, [
    //           h(DataTableRowActions, {
    //             row: row.original,
    //             onEdit: actions.onEdit,
    //             onDelete: actions.onDelete,
    //           }),
    //         ]),
    //     } as ColumnDef<FuelConsumptionRow>,
    //   ]
    //   : []),
  ]
  return cols
}