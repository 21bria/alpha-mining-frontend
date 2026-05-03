import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type FillFactorRow = {
  id: number
  code: string | null

  iup_id: number | null
  iup_code: string | null
  iup_name: string | null

  type_unit: string | null
  material: string | null
  density_bcm: number | null
  density_lcm: number | null
  bucket_capacity: number | null
  validation: string | null
  description: string | null

  user_id: number | null
  username: string | null
}

type ColumnActions = {
  onEdit: (row: FillFactorRow) => void
  onDelete: (row: FillFactorRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getFillFactorColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<FillFactorRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? (role !== "SITE_USER")
  const canMutate = role !== "GLOBAL_VIEWER"

  const cols: ColumnDef<FillFactorRow>[] = [
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

    // {
    //   accessorKey: "code",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Code" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "font-medium" }, row.original.code ?? "-"),
    // },

    {
      accessorKey: "type_unit",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Type Unit" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.type_unit ?? "-"),
    },

    {
      accessorKey: "material",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Material" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.material ?? "-"),
    },

    {
      accessorKey: "density_bcm",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Density BCM" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.density_bcm ?? "-"
        ),
    },

    {
      accessorKey: "density_lcm",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Density LCM" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.density_lcm ?? "-"
        ),
    },

    {
      accessorKey: "bucket_capacity",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Bucket Capacity" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium" },
          row.original.bucket_capacity ?? "-"
        ),
    },

    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.description ?? "-"),
    },

    {
      accessorKey: "username",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.username ?? "-"),
    },

    ...(showIup
      ? [
          {
            accessorKey: "iup_code",
            header: ({ column }) =>
              h(DataTableColumnHeader, { column, title: "IUP Code" }),
            enableSorting: true,
            cell: ({ row }) =>
              h(
                "div",
                { class: "text-muted-foreground" },
                row.original.iup_code ?? "-"
              ),
          } as ColumnDef<FillFactorRow>,
          // {
          //   accessorKey: "iup_name",
          //   header: ({ column }) =>
          //     h(DataTableColumnHeader, { column, title: "IUP Name" }),
          //   enableSorting: true,
          //   cell: ({ row }) =>
          //     h(
          //       "div",
          //       { class: "text-muted-foreground" },
          //       row.original.iup_name ?? "-"
          //     ),
          // } as ColumnDef<FillFactorRow>,
        ]
      : []),

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-left" }, "Actions"),
            cell: ({ row }: { row: { original: FillFactorRow } }) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<FillFactorRow>,
        ]
      : []),
  ]

  return cols
}