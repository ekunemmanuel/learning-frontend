<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import TeamsMenu from '../components/TeamsMenu.vue'
import UserMenu from '../components/UserMenu.vue'
import NotificationsSlideover from '../components/NotificationsSlideover.vue'

const route = useRoute()

const isMobileDrawerOpen = ref(false)
const isNotificationsOpen = ref(false)
const isSearchModalOpen = ref(false)

const searchQuery = ref('')

const links = computed(() => [
  {
    label: 'Overview',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    onSelect: () => {
      isMobileDrawerOpen.value = false
    },
  },
  {
    label: 'Customers',
    icon: 'i-lucide-users',
    to: '/customers',
    onSelect: () => {
      isMobileDrawerOpen.value = false
    },
  },
  {
    label: 'Inbox',
    icon: 'i-lucide-inbox',
    to: '/inbox',
    badge: '4',
    onSelect: () => {
      isMobileDrawerOpen.value = false
    },
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings',
    children: [
      {
        label: 'General',
        to: '/settings',
        exact: true,
        onSelect: () => {
          isMobileDrawerOpen.value = false
        },
      },
      {
        label: 'Members & Team',
        to: '/settings/members',
        onSelect: () => {
          isMobileDrawerOpen.value = false
        },
      },
      {
        label: 'Notifications',
        to: '/settings/notifications',
        onSelect: () => {
          isMobileDrawerOpen.value = false
        },
      },
      {
        label: 'Security & 2FA',
        to: '/settings/security',
        onSelect: () => {
          isMobileDrawerOpen.value = false
        },
      },
    ],
  },
])

const currentPageTitle = computed(() => {
  if (route.path.startsWith('/customers')) return 'Customers & Team Members'
  if (route.path.startsWith('/inbox')) return 'Inbox & Messaging'
  if (route.path.startsWith('/settings')) return 'Workspace Settings'
  if (route.path.startsWith('/profile')) return 'Profile & Security'
  return 'Dashboard Overview'
})
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex md:w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
      <!-- Sidebar Header -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-2 mb-3 px-1">
          <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            L
          </div>
          <span class="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">
            Learning<span class="text-primary-600 dark:text-primary-400">Hub</span>
          </span>
        </div>
        <!-- Workspace Switcher Component -->
        <TeamsMenu />
      </div>

      <!-- Sidebar Navigation Menu -->
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <UNavigationMenu :items="links" orientation="vertical" class="w-full" />
      </div>

      <!-- Sidebar Footer -->
      <div class="p-3 border-t border-gray-100 dark:border-gray-800">
        <UserMenu />
      </div>
    </aside>

    <!-- Mobile Drawer Sidebar -->
    <USlideover v-model:open="isMobileDrawerOpen" title="Navigation Menu" side="left">
      <template #body>
        <div class="space-y-6 py-2">
          <TeamsMenu />
          <UNavigationMenu :items="links" orientation="vertical" class="w-full" />
          <div class="pt-4 border-t border-gray-100 dark:border-gray-800">
            <UserMenu />
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Navbar Header Bar -->
      <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 sm:px-6 shrink-0 gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-menu"
            aria-label="Toggle Navigation Menu"
            class="md:hidden"
            @click="isMobileDrawerOpen = true"
          />
          <h1 class="text-lg font-bold text-gray-900 dark:text-white truncate">
            {{ currentPageTitle }}
          </h1>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-2">
          <!-- Search Bar Trigger -->
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-search"
            class="hidden sm:flex items-center gap-2 text-gray-500 dark:text-gray-400 font-normal pr-3"
            @click="isSearchModalOpen = true"
          >
            <span>Search...</span>
            <UKbd class="ml-2">Ctrl K</UKbd>
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-search"
            aria-label="Search"
            class="sm:hidden"
            @click="isSearchModalOpen = true"
          />

          <!-- Notifications Slideover Toggle -->
          <UChip text="2" color="primary" size="md">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-bell"
              aria-label="Notifications"
              @click="isNotificationsOpen = true"
            />
          </UChip>
        </div>
      </header>

      <!-- Main Page Router View Body -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div class="max-w-7xl mx-auto space-y-6">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- Notifications Slideover Panel -->
    <NotificationsSlideover v-model:open="isNotificationsOpen" />

    <!-- Global Search Modal -->
    <UModal v-model:open="isSearchModalOpen" title="Quick Search" description="Search pages, customers, settings, and documentation">
      <template #body>
        <div class="space-y-4 py-2">
          <UInput
            v-model="searchQuery"
            placeholder="Type a command or search..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
            autofocus
          />
          <div class="space-y-1">
            <span class="text-xs font-semibold text-gray-400 uppercase">Quick Links</span>
            <div class="space-y-1">
              <NuxtLink
                to="/dashboard"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                @click="isSearchModalOpen = false"
              >
                <UIcon name="i-lucide-layout-dashboard" class="w-4 h-4 text-primary-500" />
                Go to Dashboard Overview
              </NuxtLink>
              <NuxtLink
                to="/customers"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                @click="isSearchModalOpen = false"
              >
                <UIcon name="i-lucide-users" class="w-4 h-4 text-primary-500" />
                View Customers & Team Members
              </NuxtLink>
              <NuxtLink
                to="/settings/security"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                @click="isSearchModalOpen = false"
              >
                <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-primary-500" />
                Configure Security & 2FA
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
