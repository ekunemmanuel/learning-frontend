<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useOrganizationStore } from '../stores/organizationStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()

const token = computed(() => (route.query.token as string) || '')
const invitedEmail = computed(() => (route.query.email as string) || '')
const orgSlug = computed(() => (route.query.org as string) || '')

const isSubmitting = ref(false)
const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const isEmailMismatch = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.email || !invitedEmail.value) {
    return false
  }
  return authStore.user.email.toLowerCase() !== invitedEmail.value.toLowerCase()
})

function clearInviteSession() {
  sessionStorage.removeItem('pending_invite_token')
  sessionStorage.removeItem('pending_invite_email')
  sessionStorage.removeItem('pending_invite_org')
}

function goBackToDashboard() {
  clearInviteSession()
  router.push('/dashboard')
}

onMounted(async () => {
  if (!token.value) {
    localError.value = 'Invalid or missing invitation token.'
    clearInviteSession()
    return
  }

  // Save invitation context into sessionStorage
  sessionStorage.setItem('pending_invite_token', token.value)
  if (invitedEmail.value) sessionStorage.setItem('pending_invite_email', invitedEmail.value)
  if (orgSlug.value) sessionStorage.setItem('pending_invite_org', orgSlug.value)

  // Ensure user authentication status is loaded
  if (!authStore.isAuthenticated) {
    await authStore.fetchUser()
  }

  // Scenario 3: User is signed out -> Redirect to /signup or /login
  if (!authStore.isAuthenticated) {
    if (invitedEmail.value) {
      router.push(`/signup?email=${encodeURIComponent(invitedEmail.value)}`)
    } else {
      router.push('/signup')
    }
    return
  }

  // Scenario 1: User is logged in and email matches -> Auto claim
  if (authStore.isAuthenticated && !isEmailMismatch.value) {
    await claimInvitation()
  }
})

async function claimInvitation() {
  if (!token.value) return
  localError.value = null
  isSubmitting.value = true

  try {
    await organizationStore.acceptInvitation(token.value)
    clearInviteSession()
    successMessage.value = 'Successfully joined organization!'
    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)
  } catch (err: unknown) {
    localError.value = (err as Error).message || 'Failed to claim invitation token.'
    clearInviteSession()
  } finally {
    isSubmitting.value = false
  }
}

async function handleSwitchAccount() {
  await authStore.logout()
  if (invitedEmail.value) {
    router.push(`/login?email=${encodeURIComponent(invitedEmail.value)}`)
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-mail-open" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Workspace Invitation
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            You've been invited to join <strong class="text-gray-900 dark:text-white">{{ orgSlug || 'an organization workspace' }}</strong>
          </p>
        </div>
      </template>

      <!-- Success Alert -->
      <UAlert
        v-if="successMessage"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        :title="successMessage"
        class="mb-4"
      />

      <!-- Error Alert -->
      <div v-if="localError || organizationStore.error" class="space-y-4 mb-4">
        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="localError || organizationStore.error || ''"
        />
        <UButton
          v-if="authStore.isAuthenticated"
          color="neutral"
          variant="outline"
          block
          class="w-full justify-center font-bold"
          icon="i-lucide-arrow-left"
          @click="goBackToDashboard"
        >
          Back to Dashboard
        </UButton>
      </div>

      <!-- Scenario B: Email Mismatch Warning -->
      <div v-if="isEmailMismatch" class="space-y-4 text-center py-2">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-alert-triangle"
          title="Invitation Email Mismatch"
          :description="`You are currently signed in as '${authStore.user?.email}'. This invitation was sent to '${invitedEmail}'. Please switch accounts to accept.`"
        />

        <div class="space-y-2">
          <UButton
            color="primary"
            block
            class="w-full justify-center font-bold"
            @click="handleSwitchAccount"
          >
            Sign Out & Switch Account to {{ invitedEmail }}
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            block
            class="w-full justify-center text-xs"
            icon="i-lucide-arrow-left"
            @click="goBackToDashboard"
          >
            Back to Dashboard
          </UButton>
        </div>
      </div>

      <!-- Scenario A: Matching Logged In User Claim Button -->
      <div v-else-if="authStore.isAuthenticated && !successMessage && !localError && !organizationStore.error" class="space-y-4 text-center py-2">
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-left text-xs space-y-1">
          <p><span class="font-semibold text-gray-500">Invited Email:</span> <span class="font-bold text-gray-900 dark:text-white">{{ invitedEmail || authStore.user?.email }}</span></p>
          <p><span class="font-semibold text-gray-500">Target Workspace:</span> <span class="font-bold text-gray-900 dark:text-white">{{ orgSlug || 'Organization' }}</span></p>
        </div>

        <div class="space-y-2">
          <UButton
            color="primary"
            size="lg"
            block
            class="w-full justify-center text-base font-semibold py-2.5"
            :loading="isSubmitting"
            @click="claimInvitation"
          >
            Accept & Join Workspace
          </UButton>

          <UButton
            color="neutral"
            variant="outline"
            size="md"
            block
            class="w-full justify-center font-semibold"
            icon="i-lucide-arrow-left"
            @click="goBackToDashboard"
          >
            Back to Dashboard
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
