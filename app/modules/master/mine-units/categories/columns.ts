import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DataTableRowActions from './components/DataTableRowActions.vue'

export type UnitsCategoriesRow = {
  id: number
  category: string
}

type ColumnActions = {
  onEdit: (row: UnitsCategoriesRow) => void
  onDelete: (row: UnitsCategoriesRow) => void
}
type CheckState = boolean | "indeterminate"
export function getUnitsCategoriesColumns(actions: ColumnActions): ColumnDef<UnitsCategoriesRow>[] {
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
      accessorKey: 'category',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Category' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.category),
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
