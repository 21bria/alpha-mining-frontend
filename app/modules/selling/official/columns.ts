import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type SellingOfficialRow = {
  id: number
  iup_id: number | null
  iup_code: string | null
  iup_name: string | null
  name_surveyor: string | null
  type_selling: string | null
  tonnage: number | null
  id_factory: number | null
  factory_stock: string | null
  so_number: string | null
  product_code: string | null
  barge_code: string | null
  ni: number | null
  co: number | null
  al2o3: number | null
  cao: number | null
  cr2o3: number | null
  fe: number | null
  mgo: number | null
  sio2: number | null
  mno: number | null
  mc: number | null
  start_date: string | null
  end_date: string | null
  description: string | null
  re_assay: number | null
  username: string | null
}

function fmtValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "-"
  return String(v)
}

function textCell(v: string | number | null | undefined, cls = "font-medium") {
  return h("div", { class: cls }, fmtValue(v))
}
type ColumnActions = {
  onEdit: (row: SellingOfficialRow) => void
  onDelete: (row: SellingOfficialRow) => void
}

type CheckState = boolean | "indeterminate"
type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}
export function getSellingOfficialColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SellingOfficialRow>[] {

  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<SellingOfficialRow>[] = [
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
          disabled: !canMutate,
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) => row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
          disabled: !canMutate,
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "name_surveyor",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Surveyor" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.name_surveyor),
    },
    {
      accessorKey: "type_selling",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Type" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.type_selling),
    },
    {
      accessorKey: "factory_name",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Buyer" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.factory_stock),
    },
    {
      accessorKey: "so_number",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SO Number" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.so_number),
    },
    {
      accessorKey: "product_code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Product Code" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.product_code),
    },
    {
      accessorKey: "barge_code",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Barge Code" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.barge_code),
    },
    {
      accessorKey: "tonnage",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Tonnage" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.tonnage),
    },
    {
      accessorKey: "ni",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ni%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.ni),
    },
    // {
    //   accessorKey: "co",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Co%" }),
    //   enableSorting: true,
    //   cell: ({ row }) => textCell(row.original.co),
    // },
    {
      accessorKey: "fe",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Fe%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.fe),
    },
    {
      accessorKey: "mgo",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "MgO%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.mgo),
    },
    {
      accessorKey: "sio2",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "SiO2%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sio2),
    },
    {
      accessorKey: "mc",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "MC%" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.mc),
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Start Date" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.start_date),
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "End Date" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.end_date),
    },
    {
      accessorKey: "re_assay",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Re Assay" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.re_assay),
    },
    {
      accessorKey: "username",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.username),
    },
    // {
    //   accessorKey: "description",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Description" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "text-muted-foreground line-clamp-2" }, fmtValue(row.original.description)),
    // },

    ...(showIup
      ? [
        {
          accessorKey: "iup_code",
          header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: "IUP Code" }),
          enableSorting: true,
          cell: ({ row }) =>
            h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
        } as ColumnDef<SellingOfficialRow>,
      ]
      : []),
    // ...(canMutate
    //   ? [
    //     {
    //       id: "actions",
    //       header: () => h("div", { class: "text-left" }, "Actions"),
    //       cell: ({ row }: { row: { original: SellingOfficialRow } }) =>
    //         h("div", { class: "flex justify-end" }, [
    //           h(DataTableRowActions, {
    //             row: row.original,
    //             onEdit: actions.onEdit,
    //             onDelete: actions.onDelete,
    //           }),
    //         ]),
    //     } as ColumnDef<SellingOfficialRow>,
    //   ]
    //   : []),
  ]
  return cols
}