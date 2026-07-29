<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Dynamic verification type from store context or route fallback
const verifyType = computed<'email_verification' | 'phone_verification' | 'password_reset'>(() => {
  return (
    authStore.pendingVerification?.type ||
    (route.query.type as any) ||
    'email_verification'
  )
})

// Email destination display
const emailAddress = computed(() => {
  return (
    authStore.pendingVerification?.email ||
    authStore.pendingVerification?.identifier ||
    (route.query.email as string) ||
    (route.query.identifier as string) ||
    authStore.lastRegisteredIdentifier ||
    authStore.user?.email ||
    'your email address'
  )
})

const identifier = computed(() => {
  return (
    authStore.pendingVerification?.identifier ||
    authStore.pendingVerification?.email ||
    (route.query.identifier as string) ||
    (route.query.email as string) ||
    authStore.lastRegisteredIdentifier ||
    authStore.user?.email ||
    ''
  )
})

// Pin Input state (array of 4 digits)
const pinValue = ref<string[]>([])
const isSubmitting = ref(false)
const isResending = ref(false)
const message = ref<string | null>(null)
const localError = ref<string | null>(null)

// 1-minute countdown timer (60 seconds)
const timerSeconds = ref(60)
let timerInterval: ReturnType<typeof setInterval> | null = null

function startTimer(seconds = 60) {
  timerSeconds.value = seconds
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--
    } else {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, 1000)
}

onMounted(() => {
  startTimer(60)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const formattedTimer = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
})

async function handleVerify() {
  const code = pinValue.value.join('')
  if (code.length < 4) {
    localError.value = 'Please fill in all 4 digits of the verification code.'
    return
  }

  localError.value = null
  message.value = null
  isSubmitting.value = true

  try {
    const msg = await authStore.verifyCode({
      identifier: identifier.value,
      code,
      type: verifyType.value,
    })

    message.value = msg || 'Code verified successfully!'

    setTimeout(() => {
      if (verifyType.value === 'password_reset') {
        // Store verified code in memory state and navigate cleanly without URL parameters
        authStore.setPendingVerification({
          identifier: identifier.value,
          email: emailAddress.value,
          code,
          type: 'password_reset',
        })
        router.push('/reset-password')
      } else {
        authStore.clearPendingVerification()
        router.push('/login')
      }
    }, 1200)
  } catch (err: any) {
    localError.value = err.message || 'Verification failed. Please check the code and try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleResend() {
  if (timerSeconds.value > 0 || isResending.value) return

  if (!identifier.value) {
    localError.value = 'Missing recipient information for resending code.'
    return
  }

  localError.value = null
  message.value = null
  isResending.value = true

  try {
    const msg = await authStore.resendOtp({
      identifier: identifier.value,
      purpose: verifyType.value,
    })
    message.value = msg || 'A new 4-digit code has been sent to your email.'
    startTimer(60)
  } catch (err: any) {
    localError.value = err.message || 'Failed to resend verification code.'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
      <template #header>
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 mb-1">
            <UIcon name="i-lucide-mail-check" class="w-6 h-6" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {{ verifyType === 'password_reset' ? 'Reset Password Verification' : 'Check Your Email' }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            We sent a 4-digit verification code to
          </p>
          <div class="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-950/50 rounded-full border border-primary-200 dark:border-primary-800">
            <span class="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {{ emailAddress }}
            </span>
          </div>
        </div>
      </template>

      <!-- Error Alert -->
      <UAlert
        v-if="localError || authStore.error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="localError || authStore.error || ''"
        class="mb-4"
      />

      <!-- Success Alert -->
      <UAlert
        v-if="message"
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        :title="message"
        class="mb-4"
      />

      <div class="space-y-6 text-center py-2">
        <UFormField label="Enter 4-Digit Security Code" required :error="authStore.fieldErrors.code" class="flex flex-col items-center">
          <div class="flex justify-center w-full mt-2">
            <UPinInput
              v-model="pinValue"
              :length="4"
              type="text"
              otp
              size="lg"
              class="gap-3"
              @complete="handleVerify"
            />
          </div>
        </UFormField>

        <UButton
          color="primary"
          size="lg"
          block
          class="w-full justify-center text-base font-semibold py-2.5"
          :loading="isSubmitting"
          :disabled="pinValue.join('').length < 4"
          @click="handleVerify"
        >
          Verify Code
        </UButton>
      </div>

      <template #footer>
        <div class="space-y-4 pt-1">
          <!-- Resend Section -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Didn't receive the code?</span>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="timerSeconds > 0 || isResending"
              :loading="isResending"
              icon="i-lucide-rotate-cw"
              @click="handleResend"
            >
              <span v-if="timerSeconds > 0">Resend in {{ formattedTimer }}</span>
              <span v-else>Resend OTP</span>
            </UButton>
          </div>

          <!-- Navigation Back Links -->
          <div class="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-800 pt-3">
            <RouterLink to="/login" class="text-primary hover:text-primary-500 font-medium flex items-center gap-1">
              <UIcon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
              Back to Sign In
            </RouterLink>

            <RouterLink
              :to="verifyType === 'password_reset' ? '/forgot-password' : '/signup'"
              class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
            >
              {{ verifyType === 'password_reset' ? 'Use another account' : 'Change email' }}
            </RouterLink>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
