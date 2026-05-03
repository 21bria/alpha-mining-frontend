import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type MineUnitsRow = {
  id: number
  unit_code: string
  unit_vendor: string
  unit_model: string | null
  unit_class: string | null
  brand: string | null

  id_category: number | null
  category_name: string | null

  id_vendor: number | null
  vendor_name: string | null

  supports: string | null
  status: number | null
  description: string | null

  commisioning_date: string | null
  on_hire: string | null
  off_hire: string | null

  active_assignment_id: number | null
  active_iup: number | null
  active_iup_code: string | null
  active_iup_name: string | null
  active_assignment_start_date: string | null
  active_assignment_end_date: string | null

  user?: number | null
  created_at?: string | null
  updated_at?: string | null
}

type ColumnActions = {
  onEdit: (row: MineUnitsRow) => void
  onDelete: (row: MineUnitsRow) => void
}

type CheckState = boolean | "indeterminate"
export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
  showCategory?: boolean
  showVendor?: boolean
}

function fmtStatus(v: number | null | undefined) {
  if (v === null || v === undefined) return "-"
  if (v === 1) return "Active"
  if (v === 0) return "Inactive"
  return String(v)
}

function fmtText(v: string | null | undefined) {
  const s = (v ?? "").trim()
  return s ? s : "-"
}

function fmtDate(v: string | null | undefined) {
  return v ?? "-"
}

export function getMineUnitsColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<MineUnitsRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? true
  const canMutate = role !== "GLOBAL_VIEWER"

  const showCategory = opts.showCategory ?? true
  const showVendor = opts.showVendor ?? true

  const cols: ColumnDef<MineUnitsRow>[] = [
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (v: CheckState) => table.toggleAllPageRowsSelected(v === true),
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
      accessorKey: "unit_vendor",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Unit Code" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, fmtText(row.original.unit_vendor)),
    },
    {
      accessorKey: "unit_model",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Model" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtText(row.original.unit_model)),
    },
    {
      accessorKey: "unit_class",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Class" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtText(row.original.unit_class)),
    },
    {
      accessorKey: "brand",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Brand" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtText(row.original.brand)),
    },

    ...(showCategory
      ? [
          {
            accessorKey: "category_name",
            header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "Category" }),
            enableSorting: false,
            cell: ({ row }: any) =>
              h("div", { class: "text-muted-foreground" }, row.original.category_name ?? "-"),
          } as ColumnDef<MineUnitsRow>,
        ]
      : []),

    ...(showVendor
      ? [
          {
            accessorKey: "vendor_name",
            header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "Vendor" }),
            enableSorting: false,
            cell: ({ row }: any) =>
              h("div", { class: "text-muted-foreground" }, row.original.vendor_name ?? "-"),
          } as ColumnDef<MineUnitsRow>,
        ]
      : []),

    // {
    //   accessorKey: "supports",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Supports" }),
    //   enableSorting: true,
    //   cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtText(row.original.supports)),
    // },

    ...(showIup
      ? [
          {
            accessorKey: "active_iup_code",
            header: ({ column }: any) => h(DataTableColumnHeader, { column, title: "Active IUP" }),
            enableSorting: false,
            cell: ({ row }: any) =>
              h("div", { class: "text-muted-foreground" }, row.original.active_iup_code ?? "-"),
          } as ColumnDef<MineUnitsRow>,
        ]
      : []),

    {
      accessorKey: "commisioning_date",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Commisioning" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtDate(row.original.commisioning_date)),
    },
    {
      accessorKey: "on_hire",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "On Hire" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtDate(row.original.on_hire)),
    },
    {
      accessorKey: "off_hire",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Off Hire" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtDate(row.original.off_hire)),
    },

    {
      accessorKey: "status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.status)),
    },
    {
      accessorKey: "description",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground line-clamp-2" }, row.original.description ?? "-"),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-right" }, "Actions"),
            cell: ({ row }: any) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<MineUnitsRow>,
        ]
      : []),
  ]

  return cols
}