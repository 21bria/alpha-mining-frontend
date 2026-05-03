import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type SellingRow = {
  id: number
  iup: number | null
  iup_code?: string | null
  iup_name?: string | null
  date_sample: string
  shift: string
  type_sample: string
  sample_method: string
  material: string
  sampling_area: string
  sampling_point: string
  sampling_desc: string
  batch: string
  increments: number
  sample_id: string
  weight: string
  remark: string
}

type ColumnActions = {
  onEdit: (row: SellingRow) => void
  onDelete: (row: SellingRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getSellingColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SellingRow>[] {

  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<SellingRow>[] = [
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
      accessorKey: 'date_sample',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'date_sample' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.date_sample),
    },
    {
      accessorKey: 'shift',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Shift' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.shift),
    },
    {
      accessorKey: 'type_sample',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.type_sample),
    },
    {
      accessorKey: 'sample_method',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Method' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sample_method),
    },
    {
      accessorKey: 'material',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Material' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.material),
    },
    {
      accessorKey: 'sampling_area',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Discharge' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sampling_area),
    },

    {
      accessorKey: 'sampling_point',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sampling point' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sampling_point),
    },


    {
      accessorKey: 'batch',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Batch' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.batch),
    },

    {
      accessorKey: 'increments',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Incrementc' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.increments),
    },
    {
      accessorKey: 'sample_id',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sample ID' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sample_id),
    },
    {
      accessorKey: 'weight',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Weight' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.weight),
    },
    {
      accessorKey: 'remark',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Remarks' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.remark),
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
        } as ColumnDef<SellingRow>,
      ]
      : []),
    ...(canMutate
      ? [
        {
          id: "actions",
          header: () => h("div", { class: "text-left" }, "Actions"),
          cell: ({ row }: { row: { original: SellingRow } }) =>
            h("div", { class: "flex justify-end" }, [
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
            ]),
        } as ColumnDef<SellingRow>,
      ]
      : []),
  ]
  return cols
}
