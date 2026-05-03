import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type weatherRow = {
  id: number
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
  category: string | null
  date: string | null

  shift: string | null
  start_time: string | null
  end_time: string | null
  duration: number | null
  description: number | null

  user_id: number | null
  user: string | null
}

type ColumnActions = {
  onEdit: (row: weatherRow) => void
  onDelete: (row: weatherRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}
export function getweatherColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<weatherRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"
  const cols: ColumnDef<weatherRow>[] = [
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
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date Weather" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.date ?? "-"),
    },
    {
      accessorKey: "shift",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Shift" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.shift ?? "-"),
    },
    {
      accessorKey: "category",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Categories" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.category ?? "-"),
    },

    {
      accessorKey: "start_time",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Start time" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.start_time ?? "-"),
    },
    {
      accessorKey: "end_time",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "End time" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.end_time ?? "-"),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Duration" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.duration ?? "-"),
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
        } as ColumnDef<weatherRow>,
      ]
      : []),
    // ...(canMutate
    //   ? [
    //     {
    //       id: "actions",
    //       header: () => h("div", { class: "text-left" }, "Actions"),
    //       cell: ({ row }: { row: { original: weatherRow } }) =>
    //         h("div", { class: "flex justify-end" }, [
    //           h(DataTableRowActions, {
    //             row: row.original,
    //             onEdit: actions.onEdit,
    //             onDelete: actions.onDelete,
    //           }),
    //         ]),
    //     } as ColumnDef<weatherRow>,
    //   ]
    //   : []),
  ]
  return cols
}