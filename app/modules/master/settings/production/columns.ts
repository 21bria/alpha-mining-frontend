import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import type { UserRole } from "@/utils/roles"

export type ProductionConfigRow = {
  id: number
  key: string
  value: number | string | null
  is_active: boolean
}

type ColumnActions = {
  onEdit: (row: ProductionConfigRow) => void
  onDelete: (row: ProductionConfigRow) => void
}

type CheckState = boolean | "indeterminate"

function getActiveLabel(v?: boolean | null) {
  return v ? "Active" : "Inactive"
}

export function getProductionConfigColumns(
  actions: ColumnActions,
  role: UserRole = "SITE_USER"
): ColumnDef<ProductionConfigRow>[] {
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
      accessorKey: "key",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Key" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-semibold" }, row.original.key ?? "-"),
    },

    {
      accessorKey: "value",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Value" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, String(row.original.value ?? "-")),
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
          getActiveLabel(row.original.is_active)
        ),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", {}, "Actions"),
            cell: ({ row }: { row: { original: ProductionConfigRow } }) =>
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
          } as ColumnDef<ProductionConfigRow>,
        ]
      : []),
  ]
}