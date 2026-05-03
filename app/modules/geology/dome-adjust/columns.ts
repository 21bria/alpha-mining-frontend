import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type DomeAdjustmentRow = {
  id: number
  dome: number | null
  dome_code?: string | null
  dome_name?: string | null

  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null

  current_total: number | null
  target_total: number | null
  scale_factor: number | null

  description: string | null

  user?: number | null
  user_id?: number | null
  username?: string | null

  created_at?: string | null
  updated_at?: string | null
}

type ColumnActions = {
  onEdit: (row: DomeAdjustmentRow) => void
  onDelete: (row: DomeAdjustmentRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
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

export function getDomeAdjustmentColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<DomeAdjustmentRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<DomeAdjustmentRow>[] = [
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

    ...(showIup
      ? [
          {
            accessorKey: "iup_code",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "IUP Code" }),
            enableSorting: true,
            cell: ({ row }: any) =>
              h("div", { class: "font-medium" }, row.original.iup_code ?? "-"),
          },
          {
            accessorKey: "iup_name",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "IUP Name" }),
            enableSorting: true,
            cell: ({ row }: any) =>
              h("div", { class: "font-medium" }, row.original.iup_name ?? "-"),
          },
        ]
      : []),

    {
      accessorKey: "dome_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Dome Code" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.dome_code ?? "-"),
    },

    {
      accessorKey: "dome_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Dome Name" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.dome_name ?? "-"),
    },

    {
      accessorKey: "current_total",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Current Total" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium text-right" }, formatNumber(row.original.current_total, 2)),
    },

    {
      accessorKey: "target_total",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Target Total" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium text-right" }, formatNumber(row.original.target_total, 2)),
    },

    {
      accessorKey: "scale_factor",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Scale Factor" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium text-right" }, formatNumber(row.original.scale_factor, 6)),
    },

    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "max-w-[320px] truncate" }, row.original.description ?? "-"),
    },

    {
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.username ?? "-"),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created At" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.created_at ?? "-"),
    },

    {
      accessorKey: "updated_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Updated At" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.updated_at ?? "-"),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: { row: { original: DomeAdjustmentRow } }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<DomeAdjustmentRow>,
        ]
      : []),
  ]

  return cols
}