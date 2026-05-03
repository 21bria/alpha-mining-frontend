import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

export type GeologiesRow = {
  id: number
  name: string
  code: string
  status: string | null
}

type ColumnActions = {
  onEdit: (row: GeologiesRow) => void
  onDelete: (row: GeologiesRow) => void
}
type CheckState = boolean | "indeterminate"
export function getGeologiesColumns(actions: ColumnActions): ColumnDef<GeologiesRow>[] {
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
      accessorKey: 'code',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Code' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.code),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.name),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'text-muted-foreground' }, row.original.status ?? '-'),
    },
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
