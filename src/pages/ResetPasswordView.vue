<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Read authorization details from store or route fallback
const identifier = computed(() => {
  return (
    authStore.pendingVerification?.identifier ||
    authStore.pendingVerification?.email ||
    (route.query.identifier as string) ||
    authStore.lastRegisteredIdentifier ||
    ''
  )
})

const code = computed(() => {
  return (
    authStore.pendingVerification?.code ||
    (route.query.code as string) ||
    ''
  )
})

const formState = reactive({
  newPassword: '',
  confirmPassword: '',
})

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const message = ref<string | null>(null)
const localError = ref<string | null>(null)

async function handleResetPassword() {
  if (!formState.newPassword) {
    localError.value = 'Please enter a new password.'
    return
  }

  if (formState.newPassword.length < 8) {
    localError.value = 'Password must be at least 8 characters long.'
    return
  }

  if (formState.newPassword !== formState.confirmPassword) {
    localError.value = 'Passwords do not match.'
    return
  }

  if (!identifier.value || !code.value) {
    localError.value = 'Missing password reset authorization code. Please request a new reset code.'
    return
  }

  localError.value = null
  message.value = null
  isSubmitting.value = true

  try {
    const msg = await authStore.resetPassword({
      identifier: identifier.value,
      code: code.value,
      newPassword: formState.newPassword,
    })

    message.value = msg || 'Password updated successfully!'

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (err: any) {
    localError.value = err.message || 'Failed to reset password. The reset code may have expired.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-key-round" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Choose a new secure password for your account
          </p>
        </div>
      </template>

      <!-- Alert Error -->
      <UAlert
        v-if="localError || authStore.error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="localError || authStore.error || ''"
        class="mb-4"
      />

      <!-- Alert Success -->
      <UAlert
        v-if="message"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        :title="message"
        class="mb-4"
      />

      <!-- Simplified Form: Only New Password & Confirm New Password -->
      <UForm :state="formState" class="space-y-4" @submit="handleResetPassword">
        <UFormField label="New Password" required help="Must be at least 8 characters" :error="authStore.fieldErrors.newPassword">
          <UInput
            v-model="formState.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
            autofocus
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                aria-label="Toggle password visibility"
                class="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
                @click="showNewPassword = !showNewPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Confirm New Password" required :error="authStore.fieldErrors.confirmPassword">
          <UInput
            v-model="formState.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                aria-label="Toggle password visibility"
                class="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          class="w-full justify-center text-base font-semibold py-2.5 mt-2"
          :loading="isSubmitting"
        >
          Update Password
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Remembered your password?
          <RouterLink to="/login" class="text-primary hover:text-primary-500 font-semibold ml-1">
            Back to Sign In
          </RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
