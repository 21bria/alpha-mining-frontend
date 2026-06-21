import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import DataTableRowActions from "./components/DataTableRowActions.vue"

export type SourcePitDomeRow = {
  id: number

  iup: number | null
  iup_code: string | null
  iup_name: string | null

  loading_point: number | null
  loading_point_label?: string | null

  dome: string
  dome_type: "TEMP" | "SELECTIVE" | "ROM" | "STOCK"

  description: string | null
  compositing: string | null
  status_dome: string | null
  is_active: boolean
  direct_sale: string | null

  latitude: number | null
  longitude: number | null
  geometry: unknown | null
  extra_properties: Record<string, any> | null
  user?: number | null
}

type ColumnActions = {
  onEdit: (row: SourcePitDomeRow) => void
  onDelete: (row: SourcePitDomeRow) => void
}

type CheckState = boolean | "indeterminate"
export type UserRole = "SYSTEM" | "MANAGEMENT" | "GLOBAL_VIEWER" | "SITE_USER"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
  showLoadingPoint?: boolean
  showDomeType?: boolean
}

function fmtText(v: string | null | undefined) {
  const s = (v ?? "").trim()
  return s ? s : "-"
}

function fmtDomeType(v: string | null | undefined) {
  if (v === "TEMP") return "Temporary"
  if (v === "SELECTIVE") return "Selective"
  if (v === "ROM") return "ROM"
  if (v === "STOCK") return "Stock"
  return fmtText(v)
}

function fmtBoolean(v: boolean | null | undefined) {
  if (v === true) return "Active"
  if (v === false) return "Inactive"
  return "-"
}

export function getSourcePitDomeColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {}
): ColumnDef<SourcePitDomeRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? role !== "SITE_USER"
  const canMutate = role !== "GLOBAL_VIEWER"

  const showLoadingPoint = opts.showLoadingPoint ?? true
  const showDomeType = opts.showDomeType ?? true

  const cols: ColumnDef<SourcePitDomeRow>[] = [
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
          "onUpdate:modelValue": (v: CheckState) =>
            row.toggleSelected(v === true),
          onClick: (e: MouseEvent) => e.stopPropagation(),
          "aria-label": "Select row",
          disabled: !canMutate,
        }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "dome",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Dome" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, fmtText(row.original.dome)),
    },

    ...(showLoadingPoint
      ? [
          {
            accessorKey: "loading_point_label",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "Loading Point" }),
            enableSorting: false,
            cell: ({ row }: any) =>
              h(
                "div",
                { class: "text-muted-foreground" },
                row.original.loading_point_label ??
                  (row.original.loading_point != null
                    ? `#${row.original.loading_point}`
                    : "-")
              ),
          } as ColumnDef<SourcePitDomeRow>,
        ]
      : []),

    ...(showDomeType
      ? [
          {
            accessorKey: "dome_type",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "Dome Type" }),
            enableSorting: true,
            cell: ({ row }: any) =>
              h(
                "div",
                { class: "text-muted-foreground" },
                fmtDomeType(row.original.dome_type)
              ),
          } as ColumnDef<SourcePitDomeRow>,
        ]
      : []),

    ...(showIup
      ? [
          {
            accessorKey: "iup_code",
            header: ({ column }: any) =>
              h(DataTableColumnHeader, { column, title: "IUP Code" }),
            enableSorting: true,
            cell: ({ row }: any) =>
              h(
                "div",
                { class: "text-muted-foreground" },
                row.original.iup_code ?? "-"
              ),
          } as ColumnDef<SourcePitDomeRow>,
        ]
      : []),

    {
      accessorKey: "compositing",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Compositing" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          fmtText(row.original.compositing)
        ),
    },

    {
      accessorKey: "direct_sale",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Direct Sale" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          fmtText(row.original.direct_sale)
        ),
    },

    {
      accessorKey: "status_dome",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Status Dome" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          fmtText(row.original.status_dome)
        ),
    },

    {
      accessorKey: "is_active",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Active" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          fmtBoolean(row.original.is_active)
        ),
    },

    {
      accessorKey: "latitude",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Latitude" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.latitude ?? "-"
        ),
    },

    {
      accessorKey: "longitude",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Longitude" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground" },
          row.original.longitude ?? "-"
        ),
    },

    {
      accessorKey: "description",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Description" }),
      enableSorting: true,
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-muted-foreground line-clamp-2" },
          row.original.description ?? "-"
        ),
    },

    ...(canMutate
      ? [
          {
            id: "actions",
            header: () => h("div", { class: "text-right" }, "Actions"),
            cell: ({ row }: any) =>
              h("div", { class: "flex justify-end" }, [
                h(DataTableRowActions, {
                  row: row.original,
                  onEdit: actions.onEdit,
                  onDelete: actions.onDelete,
                }),
              ]),
          } as ColumnDef<SourcePitDomeRow>,
        ]
      : []),
  ]

  return cols
}