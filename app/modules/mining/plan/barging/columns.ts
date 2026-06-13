import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type planBargingRow = {
  id: number
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
  category: string | null
  date_plan: string | null

  vendors: string | null

  lim: number | null
  sap: number | null
  total: number | null



  user_id: number | null
  user: string | null
}
function formatNumber(value: number | string | null | undefined, digits = 2) {
  if (value === null || value === undefined || value === "") return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
type ColumnActions = {
  onEdit: (row: planBargingRow) => void
  onDelete: (row: planBargingRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}
export function getplanBargingColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<planBargingRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"
  const cols: ColumnDef<planBargingRow>[] = [
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
      accessorKey: "date_plan",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date plan" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.date_plan ?? "-"),
    },
    {
      accessorKey: "category",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Categories" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.category ?? "-"),
    },

    {
      accessorKey: "vendors",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Vendors" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.vendors ?? "-"),
    },
  

    {
      accessorKey: "lim",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "LIM" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.lim) ?? "-"),
    },
    {
      accessorKey: "sap",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SAP" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.sap) ?? "-"),
    },
    {
      accessorKey: "total",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Total" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, formatNumber(row.original.total) ?? "-"),
    },
    {
      accessorKey: "user",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.user ?? "-"),
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
        } as ColumnDef<planBargingRow>,
      ]
      : []),
  ]
  return cols
}