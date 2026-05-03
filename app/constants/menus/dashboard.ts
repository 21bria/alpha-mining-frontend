
import type { NavMenu } from "~/types/nav"

export const menusDashboard: NavMenu[] = [
   {
    heading: 'Dashboard',
    items: [
      // {
      //   title: 'Index',
      //   icon: 'i-lucide-chart-area',
      //   link: '/',
      // },
      {
        title: 'Mining',
        icon: 'i-lucide-calendar-check-2',
        link: '/dashboard/mining',
      },
      // {
      //   title: 'Tasks',
      //   icon: 'i-lucide-calendar-check-2',
      //   link: '/tasks',
      // },
    ],
  },
]