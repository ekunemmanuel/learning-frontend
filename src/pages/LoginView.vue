<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  // Clear any stale verification data when returning to the login page
  authStore.clearPendingVerification()
})

const formState = reactive({
  identifier: '',
  password: '',
})

const showPassword = ref(false)
const mfaPin = ref<string[]>([])
const backupCodePin = ref<string[]>([])
const isUsingBackupCode = ref(false)

const isSubmitting = ref(false)
const localError = ref<string | null>(null)

async function handleLogin() {
  if (!formState.identifier || !formState.password) {
    localError.value = 'Please provide both your username/email/phone and password.'
    return
  }

  localError.value = null
  isSubmitting.value = true

  try {
    const result = await authStore.login(formState.identifier, formState.password)
    if (!result.mfaRequired) {
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch (err: any) {
    localError.value = err.message || 'Login failed. Please check your credentials.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleMfaSubmit() {
  const rawCode = isUsingBackupCode.value
    ? backupCodePin.value.join('')
    : mfaPin.value.join('')
  
  // Strip hyphens or whitespace before sending payload to backend
  const code = rawCode.replace(/[- ]/g, '')

  if (isUsingBackupCode.value ? code.length < 8 : code.length < 6) {
    localError.value = isUsingBackupCode.value
      ? 'Please enter all 8 characters of your emergency backup code.'
      : 'Please enter all 6 digits of your authenticator code.'
    return
  }

  localError.value = null
  isSubmitting.value = true

  try {
    await authStore.loginMfa(code)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: any) {
    localError.value = err.message || 'Invalid authentication code.'
  } finally {
    isSubmitting.value = false
  }
}

function cancelMfa() {
  authStore.cancelMfaStep()
  mfaPin.value = []
  backupCodePin.value = []
  isUsingBackupCode.value = false
  localError.value = null
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-lock" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {{ authStore.mfaRequired ? 'Two-Factor Verification' : 'Sign in to your account' }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ authStore.mfaRequired ? 'Enter the code from your authenticator app or emergency backup code' : 'Enter your credentials to access your dashboard' }}
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

      <!-- MFA Step 2 Form -->
      <div v-if="authStore.mfaRequired" class="space-y-4">
        <UFormField
          :label="isUsingBackupCode ? '8-Character Emergency Backup Code' : '6-Digit Authenticator Code'"
          required
          class="flex flex-col items-center"
        >
          <!-- 6-digit TOTP Pin Input -->
          <div v-if="!isUsingBackupCode" class="flex justify-center w-full mt-2">
            <UPinInput
              v-model="mfaPin"
              :length="6"
              type="text"
              otp
              size="lg"
              class="gap-2"
              @complete="handleMfaSubmit"
            />
          </div>

          <!-- Emergency Backup Code OTP Input (8 character boxes, hyphens ignored) -->
          <div v-else class="flex justify-center w-full mt-2">
            <UPinInput
              v-model="backupCodePin"
              :length="8"
              type="text"
              otp
              size="lg"
              class="gap-1.5"
              @complete="handleMfaSubmit"
            />
          </div>
        </UFormField>

        <!-- Toggle between 6-digit TOTP and Backup code -->
        <div class="text-center">
          <UButton
            color="neutral"
            variant="link"
            size="xs"
            class="text-xs text-primary hover:text-primary-500"
            @click="isUsingBackupCode = !isUsingBackupCode"
          >
            {{ isUsingBackupCode ? 'Use 6-digit authenticator code instead' : 'Use emergency backup code instead' }}
          </UButton>
        </div>

        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="outline"
            class="flex-1"
            :disabled="isSubmitting"
            @click="cancelMfa"
          >
            Back to Login
          </UButton>
          <UButton
            color="primary"
            class="flex-1"
            :loading="isSubmitting"
            @click="handleMfaSubmit"
          >
            Verify & Sign In
          </UButton>
        </div>
      </div>

      <!-- Step 1 Login Form -->
      <UForm v-else :state="formState" class="space-y-4" @submit="handleLogin">
        <UFormField label="Email, Username or Phone" required>
          <UInput
            v-model="formState.identifier"
            placeholder="you@example.com or pablodev"
            icon="i-lucide-user"
            size="lg"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Password" required>
          <template #hint>
            <RouterLink to="/forgot-password" class="text-xs text-primary hover:text-primary-500 font-medium">
              Forgot password?
            </RouterLink>
          </template>
          <UInput
            v-model="formState.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            size="lg"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                aria-label="Toggle password visibility"
                class="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
                @click="showPassword = !showPassword"
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
          Sign In
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?
          <RouterLink to="/signup" class="text-primary hover:text-primary-500 font-semibold ml-1">
            Create an account
          </RouterLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
