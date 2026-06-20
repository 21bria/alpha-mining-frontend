import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type ProductionsRow = {
  id: number
  iup: number | null
  iup_code?: string | null
  iup_name?: string | null
  tgl_production: string
  shift: string
  category: string
  prospect_area: string
  mine_block: string
  nama_material: string
  ore_class: string
  ni_grade: string
  grade_control: string
  unit_truck: string
  stockpile: string
  pile_id: string
  batch_code: string
  increment: number
  ritase: number
  tonnage: number
  batch_status: string
  sample_number: string
  roa_ni: string
  remarks: string
}

type ColumnActions = {
  onEdit: (row: ProductionsRow) => void
  onDelete: (row: ProductionsRow) => void
}
type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getProductionsColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<ProductionsRow>[] {

  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<ProductionsRow>[] = [
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
      accessorKey: 'tgl_production',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.tgl_production),
    },
    {
      accessorKey: 'shift',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Shift' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.shift),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.category),
    },
    {
      accessorKey: 'prospect_area',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Source' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.prospect_area),
    },
    {
      accessorKey: 'mine_block',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Block' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.mine_block),
    },
    {
      accessorKey: 'nama_material',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Material' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.nama_material),
    },
    {
      accessorKey: 'ore_class',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Class' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.ore_class),
    },
    {
      accessorKey: 'ni_grade',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Expect.(Ni%)' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.ni_grade),
    },
    {
      accessorKey: 'grade_control',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Grade Control' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.grade_control),
    },
    {
      accessorKey: 'unit_truck',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Units' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.unit_truck),
    },
    {
      accessorKey: 'stockpile',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Stockpile' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.stockpile),
    },

    {
      accessorKey: 'pile_id',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Dome' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.pile_id),
    },

    {
      accessorKey: 'batch_code',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Batch' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.batch_code),
    },

    {
      accessorKey: 'increment',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Inc.' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.increment),
    },
    {
      accessorKey: 'ritase',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Ritase' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.ritase),
    },
    {
      accessorKey: 'tonnage',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Tonnage' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.tonnage),
    },
    {
      accessorKey: 'batch_status',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Staus' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.batch_status),
    },
    {
      accessorKey: 'sample_number',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sample ID' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sample_number),
    },
    {
      accessorKey: 'roa_ni',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Ni(%)' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.roa_ni),
    },

    {
      accessorKey: 'remarks',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Remarks' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.remarks),
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
        } as ColumnDef<ProductionsRow>,
      ]
      : [])
  ]
  return cols
}
