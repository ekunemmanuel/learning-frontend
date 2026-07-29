<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Navbar -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-layout-dashboard" class="w-6 h-6 text-primary-600" />
          <span class="font-bold text-lg text-gray-900 dark:text-white">App Dashboard</span>
        </div>

        <div class="flex items-center gap-4">
          <RouterLink to="/profile">
            <UButton color="neutral" variant="ghost" icon="i-lucide-user">
              Profile & Security
            </UButton>
          </RouterLink>
          <UButton color="error" variant="soft" size="sm" icon="i-lucide-log-out" @click="handleLogout">
            Sign Out
          </UButton>
        </div>
      </div>
    </header>

    <!-- Content Body -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <!-- Welcome Banner -->
      <div class="p-6 rounded-2xl bg-linear-to-r from-primary-600 to-indigo-600 text-white shadow-xl">
        <h1 class="text-3xl font-extrabold tracking-tight">
          Welcome back, {{ authStore.user?.name || 'Developer' }}!
        </h1>
        <p class="mt-2 text-primary-100 max-w-2xl text-sm sm:text-base">
          You have successfully logged in via HTTP-Only session cookie. You can manage your profile or setup multi-factor authentication in profile settings.
        </p>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard class="shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <UIcon name="i-lucide-user" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-gray-400">Account Identity</p>
              <p class="text-base font-bold text-gray-900 dark:text-white">@{{ authStore.user?.username }}</p>
            </div>
          </div>
        </UCard>

        <UCard class="shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <UIcon name="i-lucide-shield-check" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-gray-400">Email Status</p>
              <p class="text-base font-bold text-gray-900 dark:text-white">
                {{ authStore.isEmailVerified ? 'Verified' : 'Pending Verification' }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard class="shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <UIcon name="i-lucide-key-round" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-gray-400">Session Method</p>
              <p class="text-base font-bold text-gray-900 dark:text-white">HTTP-Only Cookie</p>
            </div>
          </div>
        </UCard>
      </div>

    </main>
  </div>
</template>
