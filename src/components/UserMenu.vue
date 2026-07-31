<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useColorMode } from '@vueuse/core'
import { useAuthStore } from '../stores/authStore'

defineProps<{
  collapsed?: boolean
}>()

const router = useRouter()
const authStore = useAuthStore()
const colorMode = useColorMode()
const appConfig = useAppConfig()

const colors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'taupe', 'mauve', 'mist', 'olive']

const user = computed(() => ({
  name: authStore.user?.name || 'User Account',
  avatar: authStore.user?.avatarUrl
    ? { src: authStore.user.avatarUrl, alt: authStore.user.name }
    : undefined,
  icon: !authStore.user?.avatarUrl ? 'i-lucide-user' : undefined,
}))

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: authStore.user?.name || 'User Account',
      avatar: user.value.avatar,
    },
  ],
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile',
    },
    {
      label: 'Security & 2FA',
      icon: 'i-lucide-shield-check',
      to: '/settings/security',
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ],
  [
    {
      label: 'Theme',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Primary',
          slot: 'chip',
          chip: appConfig.ui?.colors?.primary || 'blue',
          content: {
            align: 'center',
            collisionPadding: 16,
          },
          children: colors.map((color) => ({
            label: color,
            chip: color,
            slot: 'chip',
            checked: appConfig.ui?.colors?.primary === color,
            type: 'checkbox' as const,
            onSelect: (e: Event) => {
              e.preventDefault()
              if (appConfig.ui?.colors) {
                appConfig.ui.colors.primary = color
              }
            },
          })),
        },
        {
          label: 'Neutral',
          slot: 'chip',
          chip:
            appConfig.ui?.colors?.neutral === 'neutral'
              ? 'old-neutral'
              : appConfig.ui?.colors?.neutral || 'zinc',
          content: {
            align: 'end',
            collisionPadding: 16,
          },
          children: neutrals.map((color) => ({
            label: color,
            chip: color === 'neutral' ? 'old-neutral' : color,
            slot: 'chip',
            type: 'checkbox' as const,
            checked: appConfig.ui?.colors?.neutral === color,
            onSelect: (e: Event) => {
              e.preventDefault()
              if (appConfig.ui?.colors) {
                appConfig.ui.colors.neutral = color
              }
            },
          })),
        },
      ],
    },
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox' as const,
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.value = 'light'
          },
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox' as const,
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.value = 'dark'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          },
        },
      ],
    },
  ],
  [
    {
      label: 'Documentation',
      icon: 'i-lucide-book-open',
      to: 'https://ui.nuxt.com/docs/getting-started/installation/vue',
      target: '_blank',
    },
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: handleLogout,
    },
  ],
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`,
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
