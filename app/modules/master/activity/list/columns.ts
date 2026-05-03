import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type ActivityRow = {
  id: number
  code: string
  name: string
  status: number | null
  status_id?: number | null
  status_name: string | null
  user: number | null
}

type ColumnActions = {
  onEdit: (row: ActivityRow) => void
  onDelete: (row: ActivityRow) => void
}

type CheckState = boolean | "indeterminate"

export function getActivityColumns(
  actions: ColumnActions
): ColumnDef<ActivityRow>[] {
  return [
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
          indeterminate: row.getIsSomeSelected?.(),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Code" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.code ?? "-"),
    },

    {
      accessorKey: "name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Name" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.name ?? "-"),
    },

    {
      accessorKey: "status_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.status_name ?? "-"
        ),
    },

    {
      id: "actions",
      header: () => h("div", { class: "text-right" }, "Actions"),
      cell: ({ row }) =>
        h("div", { class: "flex justify-end" }, [
          h(DataTableRowActions, {
            row: row.original,
            onEdit: actions.onEdit,
            onDelete: actions.onDelete,
          }),
        ]),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}