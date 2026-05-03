import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type DomeFinishedRow = {
  id: number
  dome: number | null
  dome_code?: string | null
  dome_name?: string | null

  iup?: number | null
  iup_code?: string | null
  iup_name?: string | null

  tonnage_dome: number | null
  status_dome: string | null
  description: string | null
  cek_duplicated?: string | null

  user_id?: number | null
  username?: string | null

  created_at?: string | null
  updated_at?: string | null
}

type ColumnActions = {
  onEdit: (row: DomeFinishedRow) => void
  onDelete: (row: DomeFinishedRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getDomeFinishedColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<DomeFinishedRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<DomeFinishedRow>[] = [
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
      accessorKey: "tonnage_dome",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Tonnage" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.tonnage_dome ?? "-"),
    },

    {
      accessorKey: "status_dome",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.status_dome ?? "-"),
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
      accessorKey: "cek_duplicated",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Duplicate Key" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.cek_duplicated ?? "-"),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created At" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, row.original.created_at ?? "-"),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: { row: { original: DomeFinishedRow } }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<DomeFinishedRow>,
        ]
      : []),
  ]

  return cols
}