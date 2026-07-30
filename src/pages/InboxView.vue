<script setup lang="ts">
import { ref } from 'vue'

interface MailItem {
  id: string
  sender: string
  email: string
  subject: string
  snippet: string
  body: string
  date: string
  unread: boolean
  tag: string
}

const mails = ref<MailItem[]>([
  {
    id: 'm1',
    sender: 'GitHub Security',
    email: 'noreply@github.com',
    subject: 'New SSH key added to your account',
    snippet: 'An SSH key (id_ed25519) was added to your account pablodev...',
    body: `Hello Emmanuel,\n\nAn SSH key (id_ed25519) was recently added to your account. If you added this key, you do not need to take any action.\n\nIf you did not add this key, please revoke it immediately in your Security Settings.\n\nThanks,\nThe GitHub Team`,
    date: '10:42 AM',
    unread: true,
    tag: 'Security',
  },
  {
    id: 'm2',
    sender: 'Stripe Billing',
    email: 'receipts@stripe.com',
    subject: 'Payment receipt for Invoice #INV-2026-004',
    snippet: 'Thank you for your payment of $49.00 USD for Acme Corp Pro Plan...',
    body: `Hi Emmanuel,\n\nYour payment of $49.00 USD for Acme Corp Pro Plan subscription was processed successfully.\n\nYou can access your invoice receipt and billing details anytime in your Dashboard.\n\nBest regards,\nStripe Payments`,
    date: 'Yesterday',
    unread: false,
    tag: 'Billing',
  },
  {
    id: 'm3',
    sender: 'Vercel Deployment',
    email: 'notifications@vercel.com',
    subject: 'Deployment learning-frontend-v4 succeeded',
    snippet: 'Production deployment completed in 42s for branch features/authentication...',
    body: `Deployment Update:\n\nBranch: features/authentication\nCommit: 2ae98ad (feat: persist pending verification)\nEnvironment: Production\nStatus: Ready (200 OK)\n\nVisit your preview URL to test live updates.`,
    date: 'Jul 28',
    unread: false,
    tag: 'DevOps',
  },
])

const activeMail = ref<MailItem>(mails.value[0]!)

function selectMail(item: MailItem) {
  activeMail.value = item
  item.unread = false
}
</script>

<template>
  <div class="h-[calc(100vh-9rem)] flex flex-col md:flex-row border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
    <!-- Message List Pane -->
    <div class="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
      <div class="p-4 border-b border-gray-100 dark:border-gray-800">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Inbox</h2>
        <UInput placeholder="Search messages..." icon="i-lucide-search" size="sm" class="w-full" />
      </div>

      <div class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="item in mails"
          :key="item.id"
          class="p-4 cursor-pointer transition-colors"
          :class="activeMail.id === item.id ? 'bg-primary-50/60 dark:bg-primary-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'"
          @click="selectMail(item)"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-bold text-gray-900 dark:text-white truncate">
              {{ item.sender }}
            </span>
            <span class="text-[10px] text-gray-400 shrink-0">{{ item.date }}</span>
          </div>
          <p class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mb-1">
            {{ item.subject }}
          </p>
          <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {{ item.snippet }}
          </p>
        </div>
      </div>
    </div>

    <!-- Active Message Body View -->
    <div v-if="activeMail" class="flex-1 flex flex-col p-6 overflow-y-auto">
      <div class="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
        <div class="flex items-center justify-between gap-4 mb-2">
          <h3 class="text-xl font-extrabold text-gray-900 dark:text-white">
            {{ activeMail.subject }}
          </h3>
          <UBadge color="neutral" variant="subtle">
            {{ activeMail.tag }}
          </UBadge>
        </div>
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span class="font-bold text-gray-900 dark:text-white">{{ activeMail.sender }}</span>
          <span>&lt;{{ activeMail.email }}&gt;</span>
          <span class="ml-auto">{{ activeMail.date }}</span>
        </div>
      </div>

      <div class="flex-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
        {{ activeMail.body }}
      </div>

      <div class="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 flex gap-3">
        <UButton color="primary" icon="i-lucide-reply">Reply</UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide-forward">Forward</UButton>
      </div>
    </div>
  </div>
</template>
