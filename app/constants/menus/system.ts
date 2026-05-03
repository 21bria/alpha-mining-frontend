import type { NavMenu } from "~/types/nav"

export const menusSystem: NavMenu[] = [
{
    heading: 'System',
     require: { any: ["auth.view_group","accounts.view_user", "auth.view_permission"] },
    items: [
      {
        title: "Authentication",
        icon: "i-lucide-lock-keyhole-open",
        require: { any: ["auth.view_group", "accounts.view_user", "auth.view_permission"] },
        children: [
          {
            title: "Groups",
            icon: "i-lucide-circle",
            link: "/account/settings/groups",
            require: { any: ["auth.view_group"] },
          },
          {
            title: "User",
            icon: "i-lucide-circle",
            link: "/account/settings/users",
            require: { any: ["accounts.view_user"] },
          },
          {
            title: "Permissions",
            icon: "i-lucide-circle",
            link: "/account/settings/permissions",
            require: { any: ["auth.view_permission"] },
          },
        ],
      },
      // {
      //   title: 'Settings',
      //   icon: 'i-lucide-settings',
      //   new: true,
      //   children: [
      //     {
      //       title: 'Profile',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/profile',
      //     },
      //     {
      //       title: 'Account',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/account',
      //     },
      //     {
      //       title: 'Appearance',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/appearance',
      //     },
      //     {
      //       title: 'Notifications',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/notifications',
      //     },
      //     {
      //       title: 'Display',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/display',
      //     },
      //   ],
      // },
    ],
  },
]