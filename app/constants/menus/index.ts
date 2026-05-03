// ~/constants/menus/index.ts
import type { NavMenu } from "~/types/nav"
import { menusDashboard } from "./dashboard"
import { menusMaster } from "./master"
import { menusGeology } from "./geology"
import { menusMining } from "./mining"
import { menusSelling } from "./selling"
import { menusGis } from "./gis"
import { menusInventory } from "./inventory"
import { menusReport } from "./report"

import { menusSystem } from "./system"

export const navMenu: NavMenu[] = [
  // ...menusDashboard,
 
  ...menusGeology,
  ...menusMining,
  ...menusSelling,
  ...menusMaster,
  ...menusGis,
  ...menusInventory,
  ...menusReport,
  ...menusSystem,
]