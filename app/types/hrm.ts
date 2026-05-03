// types/hrm.ts

export type DivisionPayload = {
  id?: number
  name: string
  description?: string | null
}

export type DepartmentPayload = {
  id?: number
  name: string
  division: number
  description?: string | null
}

export type DepartmentRow = {
  id: number
  name: string
  division: number
  division_name?: string
  description?: string | null
}
