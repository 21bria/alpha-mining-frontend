import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type WaybillsRow = {
  id: string
  iup: number | null
  iup_code?: string | null
  iup_name?: string | null
  tgl_deliver: string | null
  delivery_time: string | null
  waybill_number: string | null
  qty: number | null
  sample_id: string | null
  sample_status: string | null
  mral_order: string | null
  roa_order: string | null
  remarks: string | null
  delivery: string | null
  username: string | null
}

type ColumnActions = {
  onEdit: (row: WaybillsRow) => void
  onDelete: (row: WaybillsRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}


function fmtValue(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "-"
  return String(v)
}

function textCell(v: string | number | null | undefined, cls = "font-medium") {
  return h("div", { class: cls }, fmtValue(v))
}

export function getWaybillsColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<WaybillsRow>[] {
  
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"
  const cols: ColumnDef<WaybillsRow>[] = [
    // {
    //   id: "role_debug",
    //   header: ({ column }) => h(DataTableColumnHeader, { column, title: "Role" }),
    //   enableSorting: false,
    //   cell: () =>
    //     h(
    //       "span",
    //       {
    //         class: "px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700",
    //       },
    //       role
    //     ),
    // },
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
      accessorKey: "tgl_deliver",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Date" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.tgl_deliver),
    },
    {
      accessorKey: "delivery_time",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Time" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.delivery_time),
    },
    {
      accessorKey: "waybill_number",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Waybill Number" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.waybill_number),
    },
    {
      accessorKey: "qty",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Qty" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.qty),
    },
    {
      accessorKey: "sample_id",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Sample ID" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.sample_id),
    },
    {
      accessorKey: "sample_status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status Sample" }),
      enableSorting: true,
      cell: ({ row }) => {
        const status = (row.original.sample_status || "").toUpperCase()

        return h(
          "span",
          {
            class: [
              "px-2 py-1 rounded text-xs font-semibold",
              status === "READY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
            ],
          },
          status || "-"
        )
      },
    },
    {
      accessorKey: "mral_order",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "MRAL Order" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.mral_order),
    },
    {
      accessorKey: "roa_order",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "ROA Order" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.roa_order),
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Remarks" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.remarks),
    },
    {
      accessorKey: "username",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "User" }),
      enableSorting: true,
      cell: ({ row }) => textCell(row.original.username),
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
          } as ColumnDef<WaybillsRow>,
        ]
      : []),
    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: { row: { original: WaybillsRow } }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<WaybillsRow>,
        ]
      : []),
  ]

  return cols
}