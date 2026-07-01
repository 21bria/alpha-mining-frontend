<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#09090b' : '#ffffff')
const { theme } = useAppSettings()

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  // link: [
  //   { rel: 'icon', href: '/favicon.ico' },
  // ],
  link: [
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/meinova.png'
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/meinova.png'
  }
],
  htmlAttrs: {
    lang: 'en',
  },
  bodyAttrs: {
    class: computed(() => `color-${theme.value?.color || 'default'} theme-${theme.value?.type || 'default'}`),
  },
})

const title = 'App Mining - Nickel'
const description = 'Empower mining operations with integrated production, maintenance, quality,\
                    fuel management, inventory, barging, workforce, analytics, and AI assistance.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: 'https://dashboard.dianprata.com',
  ogImage: 'https://nuxt-shadcn-dashboard.vercel.app/social-card.png',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: 'https://nuxt-shadcn-dashboard.vercel.app/social-card.png',
  twitterCard: 'summary_large_image',
})

const router = useRouter()

defineShortcuts({
  'G-H': () => router.push('/'),
  'G-E': () => router.push('/email'),
})

const textDirection = useTextDirection({ initialValue: 'ltr' })
const dir = computed(() => textDirection.value === 'rtl' ? 'rtl' : 'ltr')
</script>

<template>
  <Body class="overscroll-none antialiased bg-background text-foreground">
    <ConfigProvider :dir="dir">
      <div id="app" vaul-drawer-wrapper class="relative">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <AppSettings />
      </div>
    </ConfigProvider>

    <Toaster
      :theme="colorMode.preference as any || 'system'"
      position="top-right"
      rich-colors
      close-button
      class="z-[2147483647]"
    />
  </Body>
</template>

<style>
[data-sonner-toaster] {
  position: fixed !important;
  z-index: 2147483647 !important;
}

[data-sonner-toast] {
  z-index: 2147483647 !important;
}
</style>