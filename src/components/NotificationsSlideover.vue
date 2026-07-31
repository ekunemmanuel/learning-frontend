<script setup lang="ts">
import { ref } from 'vue'
import { useDashboard } from '../composables/useDashboard'

const { isNotificationsSlideoverOpen } = useDashboard()

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
  icon: string
  color: 'primary' | 'success' | 'warning' | 'info'
}

const notifications = ref<NotificationItem[]>([
  {
    id: '1',
    title: 'New Member Joined',
    description: 'Sarah Jenkins accepted your invitation to join Acme Corp.',
    time: '5m ago',
    unread: true,
    icon: 'i-lucide-user-check',
    color: 'success',
  },
  {
    id: '2',
    title: 'Two-Factor Authentication Enabled',
    description: 'Your account security was updated with authenticator TOTP 2FA.',
    time: '1h ago',
    unread: true,
    icon: 'i-lucide-shield-check',
    color: 'primary',
  },
  {
    id: '3',
    title: 'Monthly Invoice Generated',
    description: 'Invoice #INV-2026-004 for $49.00 is now available for download.',
    time: '1d ago',
    unread: false,
    icon: 'i-lucide-receipt',
    color: 'info',
  },
])

function markAllAsRead() {
  notifications.value.forEach((n) => (n.unread = false))
}

function removeNotification(id: string) {
  notifications.value = notifications.value.filter((n) => n.id !== id)
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #body>
      <div class="space-y-4 py-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</span>
          <UButton
            color="neutral"
            variant="link"
            size="xs"
            class="text-xs text-primary hover:text-primary-500 p-0"
            @click="markAllAsRead"
          >
            Mark all as read
          </UButton>
        </div>

        <div v-if="notifications.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-bell-off" class="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p class="text-sm font-medium text-gray-900 dark:text-white">No notifications</p>
          <p class="text-xs text-gray-500">You're all caught up!</p>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="item in notifications"
            :key="item.id"
            class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
            :class="item.unread ? 'bg-primary-50/40 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900' : 'bg-white dark:bg-gray-900'"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              :class="{
                'bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400': item.color === 'primary',
                'bg-success-100 text-success-600 dark:bg-success-950 dark:text-success-400': item.color === 'success',
                'bg-warning-100 text-warning-600 dark:bg-warning-950 dark:text-warning-400': item.color === 'warning',
                'bg-info-100 text-info-600 dark:bg-info-950 dark:text-info-400': item.color === 'info',
              }"
            >
              <UIcon :name="item.icon" class="w-4 h-4" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {{ item.title }}
                </p>
                <span class="text-[10px] text-gray-400 shrink-0">{{ item.time }}</span>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                {{ item.description }}
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              aria-label="Dismiss notification"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
              @click="removeNotification(item.id)"
            />
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
