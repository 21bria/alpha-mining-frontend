import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type DumpingPointRow = {
  id: number
  iup: number | null
  iup_code: string | null
  iup_name: string | null
  dumping_point: string
  description: string | null
  category: string | null
  status: number | null
  user?: number | null
}

type ColumnActions = {
  onEdit: (row: DumpingPointRow) => void
  onDelete: (row: DumpingPointRow) => void
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
function fmtCategory(v: string | null | undefined) {
  const s = (v ?? "").trim()
  return s ? s : "-"
}
export function getDumpingPointColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<DumpingPointRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<DumpingPointRow>[] = [
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
      accessorKey: "dumping_point",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Name" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.dumping_point),
    },

    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }: any) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }: any) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<DumpingPointRow>,
      ]
      : []),

    {
      accessorKey: "category",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Categories" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtCategory(row.original.category)),
    },
    {
      accessorKey: "status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.status)),
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
        } as ColumnDef<DumpingPointRow>,
      ]
      : []),
  ]

  return cols
}