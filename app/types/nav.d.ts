export type Require = {
  any?: string[]
  all?: string[]
}

export interface NavSectionTitle {
  heading: string
  require?: Require
}

export interface NavLink {
  title: string
  link: string
  icon?: string
  new?: boolean
  require?: Require
}

export interface NavGroup {
  title: string
  icon?: string
  new?: boolean
  require?: Require
  children: NavItem[]
}

export type NavItem = NavLink | NavGroup | NavSectionTitle

export interface NavMenu {
  heading: string
  require?: Require   
  items: NavItem[]
}

/** menu bawah biasanya link/group saja */
export type NavMenuBottom = (NavLink | NavGroup)[]