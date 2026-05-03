import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type FillFactorsRow = {
  id: number
  code: string | null

  iup: number | null
  iup_code: string | null
  iup_name: string | null

  material: number | null
  material_code: string | null
  material_name: string | null

  type_tf: string | null

  density: number | null
  bcm: number | null
  ton: number | null

  status: boolean | null

  user?: number | null
  user_id?: number | null
  username?: string | null
}

type ColumnActions = {
  onEdit: (row: FillFactorsRow) => void
  onDelete: (row: FillFactorsRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

function fmtStatus(v: boolean | null | undefined) {
  if (v === null || v === undefined) return "-"
  return v ? "Active" : "Inactive"
}


export function getFillFactorsColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<FillFactorsRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<FillFactorsRow>[] = [
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
      accessorKey: "type_tf",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Type Factors" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.type_tf ?? "-"),
    },

    {
      accessorKey: "material_name",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Material" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.material_name
            ? `${row.original.material_name}${row.original.material_code ? ` (${row.original.material_code})` : ""}`
            : "-"
        ),
    },

    ...(showIup
      ? [
          {
            accessorKey: "iup_code",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "IUP Code" }),
            enableSorting: true,
            cell: ({ row }: any) =>
              h("div", { class: "text-muted-foreground" }, row.original.iup_code ?? "-"),
          } as ColumnDef<FillFactorsRow>,
        ]
      : []),

   {
      accessorKey: "bcm",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Bcm" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.bcm ?? "-"),
    },
   {
      accessorKey: "density",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Density" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.density ?? "-"),
    },
   {
      accessorKey: "ton",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Ton" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.ton ?? "-"),
    },

    {
      accessorKey: "status",
      header: ({ column }) => h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, fmtStatus(row.original.status)),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: any) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<FillFactorsRow>,
        ]
      : []),
  ]

  return cols
}