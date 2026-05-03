import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import { formatDateTime } from "@/utils/formatDate"
import type { UserRole } from "@/utils/roles"

export type SampleTypeRow = {
  id: number
  type_sample: string
  category?: string | null
  description?: string | null
  status?: number | null
  total_methods?: number
  created_at?: string | null
}

type ColumnActions = {
  onEdit: (row: SampleTypeRow) => void
  onDelete: (row: SampleTypeRow) => void
  onOpenMethods: (row: SampleTypeRow) => void
}

type CheckState = boolean | "indeterminate"

function getStatusLabel(status?: number | null) {
  if (status === 1) return "Active"
  if (status === 0) return "Inactive"
  return "-"
}

export function getSampleTypeColumns(
  actions: ColumnActions,
  role: UserRole = "SITE_USER"
): ColumnDef<SampleTypeRow>[] {
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
      accessorKey: "type_sample",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sample Type" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-semibold" }, row.original.type_sample),
    },

    {
      accessorKey: "category",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Category" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", {}, row.original.category ?? "-"),
    },

    {
      accessorKey: "total_methods",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Total Methods" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          Button,
          {
            variant: "link",
            class: "h-auto p-0 font-medium",
            onClick: (e: MouseEvent) => {
              e.stopPropagation()
              actions.onOpenMethods(row.original)
            },
          },
          () => String(row.original.total_methods ?? 0)
        ),
    },

    {
      accessorKey: "status",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", {}, getStatusLabel(row.original.status)),
    },

    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "max-w-[250px] truncate" }, row.original.description ?? "-"),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.created_at ? formatDateTime(row.original.created_at) : "-"
        ),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", {}, "Actions"),
            cell: ({ row }: { row: { original: SampleTypeRow } }) =>
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
          } as ColumnDef<SampleTypeRow>,
        ]
      : []),
  ]
}