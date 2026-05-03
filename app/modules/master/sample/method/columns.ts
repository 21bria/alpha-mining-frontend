import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"
import { formatDateTime } from "@/utils/formatDate"
import type { UserRole } from "@/utils/roles"

export type SampleMethodRow = {
  id: number
  sample_type?: number | null
  sample_type_id?: number | null
  sample_type_name?: string | null
  type_sample?: string | null
  sample_method: string
  description?: string | null
  status?: number | null
  created_at?: string | null
  updated_at?: string | null
}

type ColumnActions = {
  onEdit: (row: SampleMethodRow) => void
  onDelete: (row: SampleMethodRow) => void
}

type CheckState = boolean | "indeterminate"

function getSampleTypeLabel(row: SampleMethodRow) {
  return (
    row.sample_type_name?.trim() ||
    row.type_sample?.trim() ||
    "-"
  )
}

function getStatusLabel(status?: number | null) {
  if (status === 1) return "Active"
  if (status === 0) return "Inactive"
  return "-"
}

export function getSampleMethodColumns(
  actions: ColumnActions,
  role: UserRole = "SITE_USER"
): ColumnDef<SampleMethodRow>[] {
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
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),
        }),
      enableSorting: false,
      size: 40,
    },

    {
      accessorKey: "sample_type_name",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sample Type" }),
      cell: ({ row }) =>
        h("div", { class: "text-muted-foreground" }, getSampleTypeLabel(row.original)),
    },

    {
      accessorKey: "sample_method",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Sample Method" }),
      cell: ({ row }) =>
        h("div", { class: "font-semibold" }, row.original.sample_method ?? "-"),
    },

    {
      accessorKey: "status",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status" }),
      cell: ({ row }) =>
        h("div", {}, getStatusLabel(row.original.status)),
    },

    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      cell: ({ row }) =>
        h("div", { class: "max-w-[250px] truncate" }, row.original.description ?? "-"),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created" }),
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
            cell: ({ row }: any) =>
              h(DataTableRowActions, {
                row: row.original,
                onEdit: actions.onEdit,
                onDelete: actions.onDelete,
              }),
          } as ColumnDef<SampleMethodRow>,
        ]
      : []),
  ]
}