import type { NavMenu } from "~/types/nav"

export const menusGis: NavMenu[] = [
{
    heading: 'GIS',
    items: [
      {
        title: 'Data IUP',
        icon: 'i-lucide-map',
        new: false,
        link: '/gis/mine-iup',
      },
      // {
      //   title: 'GoeJSON(UTM)',
      //   icon: 'i-lucide-map-pin-pen',
      //   link: '/gis/imports',
      // },
    ],
  },
  
]