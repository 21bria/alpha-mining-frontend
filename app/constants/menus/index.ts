// ~/constants/menus/index.ts
import type { NavMenu } from "~/types/nav"
import { menusDashboard } from "./dashboard"
import { menusGeology } from "./geology"
import { menusMining } from "./mining"
import { menusSelling } from "./selling"
import { menusGis } from "./gis"
import { menusInventory } from "./inventory"
import { menusTools } from "./tools"

import { menusSystem } from "./system"

export const navMenu: NavMenu[] = [
  ...menusDashboard,
  ...menusGeology,
  ...menusMining,
  ...menusSelling,
  ...menusGis,
  ...menusInventory,
  ...menusTools,
  ...menusSystem,
]