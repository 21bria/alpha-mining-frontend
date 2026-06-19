import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type ProductionsRow = {
  id: number
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
  category_mine: string | null
  date_production: string | null
  shift: string | null

  vendors: string | null
  loader: string | null
  bucket: number | string | null
  hauler: string | null

  hauler_class: string | null
  hauler_type: string | null
  sources_area: string | null
  loading_point: string | null
  dumping_point: string | null
  dome_id: string | null
  time_loading: string | null
  time_dumping: string | null
  mine_block: string | null
  rl: string | null
  nama_material: string | null
  ritase: number | null
  bcm: number | null
  tonnage: number | null
  remarks: string | null
  t_load: number | null
  direct: boolean | string | null
  created_at: string | null
  user_id: number | null
  username: string | null
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
      accessorKey: "date_production",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.date_production ?? "-"),
    },
    {
      accessorKey: "shift",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Shift" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.shift ?? "-"),
    },
    {
      accessorKey: "time_loading",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Time Loading" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.time_loading ?? "-"),
    },
    {
      accessorKey: "category_mine",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Category" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.category_mine ?? "-"),
    },
    {
      accessorKey: "loader",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Loader" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.loader ?? "-"),
    },
    {
      accessorKey: "bucket",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Bucket" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.bucket ?? "-"),
    },
    {
      accessorKey: "hauler",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Hauler" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.hauler ?? "-"),
    },
    {
      accessorKey: "loading_point",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Loading Point" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.loading_point ?? "-"),
    },
    {
      accessorKey: "dumping_point",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Dumping Point" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.dumping_point ?? "-"),
    },
    {
      accessorKey: "dome_id",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Dome" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.dome_id ?? "-"),
    },
    {
      accessorKey: "nama_material",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Material" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.nama_material ?? "-"),
    },

    {
      accessorKey: "rl",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "RL" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.rl ?? "-"),
    },
    {
      accessorKey: "ritase",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ritase" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.ritase ?? "-"),
    },
    // {
    //   accessorKey: "bcm",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "BCM" }),
    //   enableSorting: true,
    //   cell: ({ row }) => h("div", { class: "font-medium" }, row.original.bcm ?? "-"),
    // },
    {
      accessorKey: "tonnage",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Tonnage" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.tonnage ?? "-"),
    },
    {
      accessorKey: "vendors",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Vendor" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.vendors ?? "-"),
    },

    // {
    //   accessorKey: "direct",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Direct" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "font-medium" }, row.original.direct?.toString() ?? "-"),
    // },
    {
      accessorKey: "username",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.username ?? "-"),
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Remarks" }),
      enableSorting: true,
      cell: ({ row }) => h("div", { class: "font-medium" }, row.original.remarks ?? "-"),
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
      : []),
  ]
  return cols
}