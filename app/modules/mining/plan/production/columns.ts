import type { ColumnDef } from "@tanstack/vue-table"
import { h } from "vue"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import DataTableColumnHeader from "@/components/data-table/DataTableColumnHeader.vue"
import type { UserRole } from "@/utils/roles"

export type PlanProductionDetail = {
  id?: string
  material_code: string | null
  material_name: string | null
  tonnage: number | string | null
}

export type planProductionsRow = {
  id: string
  code?: string | null
  iup: number | null
  iup_code: string | null
  iup_name: string | null
  date_plan: string | null
  category: string | null
  source_code: string | null
  vendor_code: string | null
  ref_plan?: string | null
  details: PlanProductionDetail[]
  total_tonnage?: number | string | null
  user_id?: number | null
  user?: string | null
}

function formatNumber(value: number | string | null | undefined, digits = 1) {
  if (value === null || value === undefined || value === "") return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatDetails(details: PlanProductionDetail[] = []) {
  if (!details.length) return "-"

  return details
    .map((d) => `${d.material_name || d.material_code}: ${formatNumber(d.tonnage)}`)
    .join(" | ")
}

type ColumnActions = {
  onEdit: (row: planProductionsRow) => void
  onDelete: (row: planProductionsRow) => void
}

type CheckState = boolean | "indeterminate"

type ColumnOptions = {
  role?: UserRole
  showIup?: boolean
}

export function getplanProductionsColumns(
  actions: ColumnActions,
  opts: ColumnOptions = {},
): ColumnDef<planProductionsRow>[] {
  const role: UserRole = opts.role ?? "SITE_USER"
  const showIup = opts.showIup ?? role !== "SITE_USER"

  const cols: ColumnDef<planProductionsRow>[] = [
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

    {
      accessorKey: "date_plan",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Date Plan" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium whitespace-nowrap" }, row.original.date_plan ?? "-"),
    },

    {
      accessorKey: "category",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Category" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.category ?? "-"),
    },

    // {
    //   accessorKey: "source_code",
    //   header: ({ column }) =>
    //     h(DataTableColumnHeader, { column, title: "Source" }),
    //   enableSorting: true,
    //   cell: ({ row }) =>
    //     h("div", { class: "font-medium" }, row.original.source_code ?? "-"),
    // },

    {
      accessorKey: "vendor_code",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Vendor" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.vendor_code ?? "-"),
    },

    {
  id: "materials",
  header: ({ column }) =>
    h(DataTableColumnHeader, {
      column,
      title: "Materials",
    }),

  enableSorting: false,

  cell: ({ row }) => {
    const details = row.original.details ?? []
    const preview = details.slice(0, 3)
    const remaining = details.length - preview.length
    const total = details.reduce(
      (sum, d) => sum + Number(d.tonnage || 0),
      0,
    )

    if (!details.length) {
      return h("div", { class: "text-muted-foreground" }, "-")
    }

    return h(
      "div",
      { class: "max-w-[600px] whitespace-normal text-sm leading-5" },
      [
        ...preview.map((d) =>
          h(
            "span",
            {
              class:
                "inline-flex mr-2 mb-1 rounded-md bg-muted px-2 py-1 text-xs",
            },
            `${d.material_name || d.material_code}: ${formatNumber(d.tonnage)}`
          )
        ),

        remaining > 0
          ? h(
              Popover,
              {},
              {
                default: () => [
                  h(
                    PopoverTrigger,
                    { asChild: true },
                    {
                      default: () =>
                        h(
                          "button",
                          {
                            type: "button",
                            class:
                              "inline-flex mr-2 mb-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/20",
                            onClick: (e: MouseEvent) => e.stopPropagation(),
                          },
                          `+${remaining} More`
                        ),
                    }
                  ),

                  h(
                    PopoverContent,
                    {
                      class: "w-[320px] p-0",
                      align: "start",
                    },
                    {
                      default: () =>
                        h("div", { class: "p-3" }, [
                          h(
                            "div",
                            { class: "mb-3" },
                            [
                              h(
                                "p",
                                { class: "text-sm font-semibold" },
                                "Production Plan Details"
                              ),
                              h(
                                "p",
                                { class: "text-xs text-muted-foreground" },
                                row.original.date_plan ?? "-"
                              ),
                            ]
                          ),

                          h(
                            "div",
                            { class: "max-h-[260px] overflow-y-auto rounded-lg border" },
                            details.map((d) =>
                              h(
                                "div",
                                {
                                  class:
                                    "flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0",
                                },
                                [
                                  h(
                                    "span",
                                    { class: "text-sm font-medium" },
                                    d.material_name || d.material_code || "-"
                                  ),
                                  h(
                                    "span",
                                    { class: "text-sm tabular-nums text-muted-foreground" },
                                    formatNumber(d.tonnage)
                                  ),
                                ]
                              )
                            )
                          ),

                          h(
                            "div",
                            {
                              class:
                                "mt-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2",
                            },
                            [
                              h(
                                "span",
                                { class: "text-sm font-semibold" },
                                "Total"
                              ),
                              h(
                                "span",
                                { class: "text-sm font-bold tabular-nums" },
                                formatNumber(total)
                              ),
                            ]
                          ),
                        ]),
                    }
                  ),
                ],
              }
            )
          : null,
      ]
    )
  },
},
    {
      accessorKey: "total_tonnage",
      header: ({ column }) =>
        h(
          "div",
          { class: "flex justify-end" },
          [
            h(DataTableColumnHeader, {
              column,
              title: "Total",
            }),
          ]
        ),

      enableSorting: true,

      cell: ({ row }) =>
        h(
          "div",
          {
            class:
              "w-full text-right font-semibold tabular-nums",
          },
          formatNumber(row.original.total_tonnage),
        ),
    },

    {
      accessorKey: "user",
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: "Created By" }),
      enableSorting: true,
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.original.user ?? "-"),
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
              row.original.iup_code ?? "-",
            ),
        } as ColumnDef<planProductionsRow>,
      ]
      : []),
  ]

  return cols
}