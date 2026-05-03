// utils/permissionMenu.ts
import type { NavMenu, NavItem } from "~/types/nav"

export function canAccess(perms: Set<string>, require?: any): boolean {
  if (!require) return true

  if (require.all?.length) {
    for (const p of require.all) if (!perms.has(p)) return false
  }

  if (require.any?.length) {
    return require.any.some((p: string) => perms.has(p))
  }

  return true
}

export function filterNavMenuItems(items: NavItem[], perms: Set<string>): NavItem[] {
  return items
    .map((item) => {
      // group (punya children)
      if ("children" in item) {
        const children = filterNavMenuItems(item.children, perms)
        const allowed = canAccess(perms, item.require)
        if (children.length === 0 && !allowed) return null
        return { ...item, children }
      }

      // link (punya link)
      if ("link" in item) {
        return canAccess(perms, item.require) ? item : null
      }

      // section title
      return item
    })
    .filter(Boolean) as NavItem[]
}

export function filterNavMenu(menu: NavMenu[], perms: Set<string>): NavMenu[] {
  return menu
    .map((section) => {
      const items = filterNavMenuItems(section.items, perms)
      const allowed = canAccess(perms, (section as any).require)

      // ✅ kalau kosong dan tidak allowed -> hilang heading
      if (items.length === 0 && !allowed) return null

      return { ...section, items }
    })
    .filter(Boolean) as NavMenu[]
}