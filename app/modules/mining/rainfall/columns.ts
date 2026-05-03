import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type RainfallRow = {
  id: string
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
  date: string | null
  point_id?: number | null
  point_name: string | null
  milimeter: string | null
  description: string | null
  user_id: number | null
  user: string | null
}

type ColumnActions = {
  onEdit: (row: RainfallRow) => void
  onDelete: (row: RainfallRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getRainfallColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<RainfallRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<RainfallRow>[] = [
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

    {
      accessorKey: "point_name",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Rainfall Point" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.point_name ?? "-"),
    },

    {
      accessorKey: "milimeter",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Milimeter" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.milimeter ?? "-"),
    },

    {
      accessorKey: "description",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.description ?? "-"),
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
          } as ColumnDef<RainfallRow>,
        ]
      : []),

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: { row: { original: RainfallRow } }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<RainfallRow>,
        ]
      : []),
  ]

  return cols
}