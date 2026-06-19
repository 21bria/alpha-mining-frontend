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
  description?: string | null
  status?: number | null
  total_methods?: number
  created_at?: string | null

  is_production: boolean
  is_geology: boolean
  is_selling: boolean
  is_monitoring: boolean
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
      accessorKey: "is_production",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Production" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: row.original.is_production
            ? "rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600"
            : "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
        }, row.original.is_production ? "Yes" : "No"),
    },

    {
      accessorKey: "is_geology",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Geology" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: row.original.is_geology
            ? "rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600"
            : "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
        }, row.original.is_geology ? "Yes" : "No"),
    },

    {
      accessorKey: "is_selling",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Selling" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: row.original.is_selling
            ? "rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600"
            : "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
        }, row.original.is_selling ? "Yes" : "No"),
    },

    {
      accessorKey: "is_monitoring",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Monitoring" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("span", {
          class: row.original.is_monitoring
            ? "rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-600"
            : "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
        }, row.original.is_monitoring ? "Yes" : "No"),
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

    // {
    //   accessorKey: "description",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Description" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "max-w-[250px] truncate" }, row.original.description ?? "-"),
    // },

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