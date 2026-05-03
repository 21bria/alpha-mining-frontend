import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

export type BargeRow = {
  id: number
  barge_code: string
  barge_name: string
  description: string | null
  active: number | null
  user?: number | null
}

function fmtactive(v: number | null | undefined) {
  if (v === null || v === undefined) return "-"
  if (v === 1) return "Active"
  if (v === 0) return "Inactive"
  return String(v)
}

type ColumnActions = {
  onEdit: (row: BargeRow) => void
  onDelete: (row: BargeRow) => void
}
type CheckState = boolean | "indeterminate"
export function getBargeColumns(actions: ColumnActions): ColumnDef<BargeRow>[] {
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
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
        }),

      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'barge_code',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Code' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.barge_code),
    },
    {
      accessorKey: 'barge_name',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.barge_name),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Description' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.description ?? '-'),
    },
    // {
    //   accessorKey: "active",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "active" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "text-muted-foreground" }, fmtactive(row.original.active)),
    // },

    {
      id: 'actions',
      header: () => h('div', { class: 'text-right' }, 'Actions'),
      cell: ({ row }) =>
        h('div', { class: 'flex justify-end' }, [
          h(DataTableRowActions, {
            row: row.original,
            onEdit: actions.onEdit,
            onDelete: actions.onDelete,
          }),
        ]),
    }
  ]
}
