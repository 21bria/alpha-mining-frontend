import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type SampleDomeRow = {
  id: number
  iup: number | null
  iup_code?: string | null
  iup_name?: string | null
  date_sample: string
  shift: string
  type_sample: string
  sample_method: string
  material_psi: string
  dome_psi: string
  sampling_desc: string
  batch_code: string
  increments: number
  sample_id: string
  weight: string
  allocated_tonnage: number | null
  ni_display: number | null
  co_display: number | null
  al2o3_display: number | null
  fe2o3_display: number | null
  fe_display: number | null
  mgo_display: number | null
  sio2_display: number | null
  sm_display: number | null
  mc_display: number | null
  user: string | null
}

type ColumnActions = {
  onEdit: (row: SampleDomeRow) => void
  onDelete: (row: SampleDomeRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getSampleDomeColumns(
  actions?: Partial<ColumnActions>,
  opts: ColumnOptions = {}
): ColumnDef<SampleDomeRow>[] {

  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"
  const cols: ColumnDef<SampleDomeRow>[] = [
    // {
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
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.date_sample),
    },

    {
      accessorKey: 'type_sample',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.type_sample),
    },
    // {
    //   accessorKey: 'sample_method',
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Method' }),
    //   enableSorting: true,
    //   cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sample_method),
    // },
    {
      accessorKey: 'material',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Layers' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.material_psi),
    },
    {
      accessorKey: 'sampling_point',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sampling point' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.dome_psi),
    },


    {
      accessorKey: 'batch_code',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Batch' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.batch_code),
    },

    // {
    //   accessorKey: 'increments',
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Increments' }),
    //   enableSorting: true,
    //   cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.increments),
    // },
   
    {
      accessorKey: 'allocated_tonnage',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Tonnage' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.allocated_tonnage ?? 0),
    },
    {
      accessorKey: 'sample_id',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sample ID' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sample_id),
    },
    {
      accessorKey: 'ni_display',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Ni%' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.ni_display ?? 0),
    },
    {
      accessorKey: 'fe_display',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Fe%' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.fe_display ?? 0),
    },
    {
      accessorKey: 'co_display',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Co%' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.co_display ?? 0),
    },
    {
      accessorKey: 'mgo_display',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'MgO%' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.mgo_display ?? 0),
    },
    {
      accessorKey: 'sio2_display',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'SiO2%' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sio2_display ?? 0),
    },
    {
      accessorKey: 'sm_display',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: 'SM%' }),
      enableSorting: true,
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sm_display ?? 0),
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
        } as ColumnDef<SampleDomeRow>,
      ]
      : []),
  ]
  return cols
}