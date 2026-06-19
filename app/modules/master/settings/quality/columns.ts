import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type QualityConfigRow = {
  id: number
  name: string
  adjust_sale: string
  material: number | null
  material_name?: string | null
  selling_sample_type: number | null
  selling_sample_type_name?: string | null
  monitoring_sample_type: number | null
  monitoring_sample_type_name?: string | null
  is_active: boolean
}

type ColumnActions = {
  onEdit: (row: QualityConfigRow) => void
  onDelete: (row: QualityConfigRow) => void
}

type CheckState = boolean | "indeterminate"

export function getQualityConfigColumns(
  actions: ColumnActions,
  role: UserRole = "SITE_USER"
): ColumnDef<QualityConfigRow>[] {
  const canMutate = role !== "GLOBAL_VIEWER"

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
      size: 40,
    },

    {
      accessorKey: "name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Name" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-semibold" }, row.original.name ?? "-"),
    },

    {
      accessorKey: "adjust_sale",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Adjust Sale" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: "rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600",
        }, row.original.adjust_sale ?? "-"),
    },

    {
      accessorKey: "material_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Material" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.material_name ?? "-"),
    },

    {
      accessorKey: "selling_sample_type_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Selling Sample" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: "rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600",
        }, row.original.selling_sample_type_name ?? "-"),
    },

    {
      accessorKey: "monitoring_sample_type_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Monitoring Sample" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: "rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-600",
        }, row.original.monitoring_sample_type_name ?? "-"),
    },

    {
      accessorKey: "is_active",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "span",
          {
            class: row.original.is_active
              ? "rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600"
              : "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
          },
          row.original.is_active ? "Active" : "Inactive"
        ),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", {}, "Actions"),
            cell: ({ row }: { row: { original: QualityConfigRow } }) =>
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
          } as ColumnDef<QualityConfigRow>,
        ]
      : []),
  ]
}