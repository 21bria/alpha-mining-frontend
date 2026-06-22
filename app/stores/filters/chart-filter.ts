// stores/chart-filter.ts
import { defineStore } from "pinia"

export const filterOptions = [
  { value: "", label: "-- Select --" },
  { value: "all", label: "All Data" },
  { value: "yearly", label: "Yearly" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "range", label: "Range" },
  { value: "daily", label: "Daily" },
] as const

export type LooseFilterType = typeof filterOptions[number]["value"]
export type FilterType = Exclude<LooseFilterType, "">

export interface ChartFilterPayload {
  type: FilterType
  year?: number | null
  month?: number | null
  week?: string | null
  range?: { start: string; end: string }
  date?: string
  iup_id?: string | number | Array<string | number> | null
}

type MonthOption = {
  name: string
  value: number
}

const getDefaultState = () => {
  const now = new Date()
  const monthIndex = now.getMonth() + 1
  const monthName = now.toLocaleString("default", { month: "short" })

  return {
    type: "monthly" as LooseFilterType,
    year: now.getFullYear() as number | null,
    month: {
      name: monthName,
      value: monthIndex,
    } as MonthOption | null,
    week: null as string | null,
    range: {
      start: "",
      end: "",
    },
    date: "",
    iup_id: "" as string,
  }
}

export const useChartFilterStore = defineStore("chartFilter", {
  state: getDefaultState,

  getters: {
    monthValue: (state): number | null => state.month?.value ?? null,

    filters(state) {
      return {
        filter_type: state.type || "monthly",
        year: state.year,
        month: state.month?.value ?? null,
        week: state.week,
        date_start: state.range.start || null,
        date_end: state.range.end || null,
        filter_date: state.date || null,
        iup_id: state.iup_id || null,
      }
    },
  },

  actions: {
    apply(payload: ChartFilterPayload) {
      this.type = payload.type || "monthly"
      this.year = payload.year ?? this.year
      this.month = payload.month
        ? {
            name: new Date(0, payload.month - 1).toLocaleString("default", {
              month: "short",
            }),
            value: payload.month,
          }
        : this.month

      this.week = payload.week ?? null
      this.range = payload.range ?? { start: "", end: "" }
      this.date = payload.date ?? ""

      if ("iup_id" in payload) {
        this.setIup(payload.iup_id ?? null)
      }
    },

    setIup(iupId: string | number | Array<string | number> | null) {
      if (Array.isArray(iupId)) {
        this.iup_id = iupId.map(String).filter(Boolean).join(",")
        return
      }

      this.iup_id = iupId ? String(iupId) : ""
    },

    reset() {
      Object.assign(this, getDefaultState())
    },

    resetForUser(iupId?: string | number | Array<string | number> | null) {
      Object.assign(this, getDefaultState())
      this.setIup(iupId ?? null)
    },
  },
})