<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useOrganizationStore } from '../stores/organizationStore'

const router = useRouter()
const route = useRoute()
const toast = useToast()
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
    toast.add({
      title: 'Invitation Error',
      description: 'Invalid or missing invitation token.',
      color: 'error',
    })
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

  // If user is logged in under a different email address -> automatically sign out!
  if (authStore.isAuthenticated && isEmailMismatch.value) {
    await authStore.logout()
  }

  // If user is signed out (or was signed out due to email mismatch) -> redirect cleanly to /signup
  if (!authStore.isAuthenticated) {
    router.push('/signup')
    return
  }

  // If user is signed in with matching email -> auto claim invitation!
  if (authStore.isAuthenticated && !isEmailMismatch.value) {
    await claimInvitation()
  }
})

async function claimInvitation() {
  if (!token.value) return
  localError.value = null
  isSubmitting.value = true

  try {
    const joinedOrg = await organizationStore.acceptInvitation(token.value)
    clearInviteSession()
    successMessage.value = 'Successfully joined organization!'

    const activeWorkspaceName =
      joinedOrg?.name ||
      (organizationStore.currentOrganization?.name !== 'Personal Workspace'
        ? organizationStore.currentOrganization.name
        : orgSlug.value || 'the organization')

    toast.add({
      title: 'Welcome!',
      description: `You're now a member of '${activeWorkspaceName}'.`,
      color: 'success',
    })
    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)
  } catch (err: unknown) {
    const errMsg = (err as Error).message || 'Failed to claim invitation token.'
    localError.value = errMsg
    toast.add({
      title: 'Invitation Failed',
      description: errMsg,
      color: 'error',
    })
    clearInviteSession()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-md shadow-xl border border-default">
    <template #header>
      <div class="text-center space-y-2">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-1"
        >
          <UIcon name="i-lucide-mail-open" class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-highlighted">
          Workspace Invitation
        </h1>
        <p class="text-sm text-muted">
          You've been invited to join
          <strong class="text-highlighted">{{ orgSlug || 'an organization workspace' }}</strong>
        </p>
      </div>
    </template>

    <!-- Error Fallback Action -->
    <div v-if="localError || organizationStore.error" class="space-y-4 py-2">
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

    <!-- Matching Logged In User Claim View -->
    <div
      v-else-if="
        authStore.isAuthenticated && !successMessage && !localError && !organizationStore.error
      "
      class="space-y-4 text-center py-2"
    >
      <div class="p-4 bg-muted/40 rounded-xl border border-default text-left text-xs space-y-1.5">
        <p>
          <span class="font-semibold text-muted">Invited Email:</span>
          <span class="font-bold text-highlighted ml-1">{{
            invitedEmail || authStore.user?.email
          }}</span>
        </p>
        <p>
          <span class="font-semibold text-muted">Target Workspace:</span>
          <span class="font-bold text-highlighted ml-1">{{
            orgSlug || 'Organization'
          }}</span>
        </p>
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
</template>
