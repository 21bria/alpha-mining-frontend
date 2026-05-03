import type { NavMenu } from "@/types/nav"

export const menusInventory: NavMenu[] = [
  {
    heading: 'Inventory',
    items: [
      {
        title: 'By dome',
        icon: 'i-lucide-table-columns-split',
        children: [
          {
            title: 'Data All',
            icon: 'i-lucide-circle',
            link: '/inventory',
          },
          {
            title: 'By Limonite',
            icon: 'i-lucide-circle',
            new: false,
            link: '/inventory/limonite',
          },
          {
            title: 'By Saprolite',
            icon: 'i-lucide-circle',
            new: false,
            link: '/inventory/saprolite',
          },
        ],
      },
      {
        title: 'By Stockpile',
        icon: 'i-lucide-trending-up-down',
        new: false,
        link: '/inventory/stockpiles',
      },
    ],
  },
 
]