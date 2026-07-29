<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const isSettingUpMfa = ref(false)
const mfaConfirmationPin = ref<string[]>([])
const isActivatingMfa = ref(false)
const copiedSuccess = ref(false)
const localError = ref<string | null>(null)
const localSuccess = ref<string | null>(null)

// 2FA status derived from backend user profile or local activation state
const is2FaActive = computed(() => authStore.isMfaEnabled)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})

// Clear backup codes when leaving page so they are not displayed again later
onUnmounted(() => {
  authStore.clearBackupCodes()
})

async function handleInitiateMfa() {
  localError.value = null
  localSuccess.value = null
  isSettingUpMfa.value = true
  mfaConfirmationPin.value = []

  try {
    await authStore.setupMfa()
  } catch (err: any) {
    localError.value = err.message || 'Failed to initialize MFA setup.'
  } finally {
    isSettingUpMfa.value = false
  }
}

async function handleActivateMfa() {
  const code = mfaConfirmationPin.value.join('')
  if (code.length < 6) {
    localError.value = 'Please enter all 6 digits from your authenticator app.'
    return
  }

  localError.value = null
  isActivatingMfa.value = true

  try {
    const methodId = authStore.mfaSetupData?.methodId || ''
    await authStore.verifyMfa(methodId, code)
    authStore.mfaSetupData = null
    localSuccess.value = 'Two-Factor Authentication successfully activated! Please save your emergency backup codes below.'
  } catch (err: any) {
    localError.value = err.message || 'Verification failed. Please check the code.'
  } finally {
    isActivatingMfa.value = false
  }
}

function copyBackupCodes() {
  if (authStore.backupCodes.length === 0) return
  const text = authStore.backupCodes.join('\n')
  navigator.clipboard.writeText(text)
  copiedSuccess.value = true
  setTimeout(() => {
    copiedSuccess.value = false
  }, 2000)
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Top Bar / Navigation -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/dashboard">
            <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left">
              Back to Dashboard
            </UButton>
          </RouterLink>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Profile & Security</h1>
        </div>
        <UButton color="error" variant="soft" icon="i-lucide-log-out" @click="handleLogout">
          Sign Out
        </UButton>
      </div>

      <!-- User Profile Card -->
      <UCard class="shadow-md border border-gray-200 dark:border-gray-800">
        <template #header>
          <div class="flex items-center gap-4">
            <UAvatar
              :src="authStore.user?.avatarUrl || ''"
              :alt="authStore.user?.name || 'User Avatar'"
              size="xl"
              class="bg-primary-500 text-white font-bold text-xl"
            >
              {{ authStore.user?.name?.charAt(0).toUpperCase() || 'U' }}
            </UAvatar>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ authStore.user?.name || 'User Profile' }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                @{{ authStore.user?.username }} • ID: {{ authStore.user?.id }}
              </p>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Email Address</span>
            <div class="flex items-center gap-2">
              <span class="text-base font-medium text-gray-900 dark:text-white">{{ authStore.user?.email }}</span>
              <UBadge
                :color="authStore.isEmailVerified ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ authStore.isEmailVerified ? 'Verified' : 'Unverified' }}
              </UBadge>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Phone Number</span>
            <div class="flex items-center gap-2">
              <span class="text-base font-medium text-gray-900 dark:text-white">{{ authStore.user?.phone || 'Not provided' }}</span>
              <UBadge
                v-if="authStore.user?.phone"
                :color="authStore.isPhoneVerified ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ authStore.isPhoneVerified ? 'Verified' : 'Unverified' }}
              </UBadge>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Country</span>
            <p class="text-base font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.country || 'Not specified' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase text-gray-400">Verification Timestamps</span>
            <p class="text-xs text-gray-500">
              Email Verified: {{ authStore.user?.emailVerifiedAt ? new Date(authStore.user.emailVerifiedAt).toLocaleString() : 'N/A' }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Security & 2FA Setup Card -->
      <UCard class="shadow-md border border-gray-200 dark:border-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-shield-check" class="w-6 h-6 text-primary-500" />
              <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Two-Factor Authentication (MFA)</h2>
                <p class="text-xs text-gray-500">Protect your account using Google Authenticator, Microsoft Authenticator, or 1Password</p>
              </div>
            </div>

            <!-- Active Status Badge based on user.isMfaEnabled -->
            <UBadge
              v-if="is2FaActive"
              color="success"
              variant="subtle"
              size="md"
              class="font-semibold flex items-center gap-1"
            >
              <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
              2FA Active
            </UBadge>
          </div>
        </template>

        <!-- Alerts -->
        <UAlert
          v-if="localError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="localError"
          class="mb-4"
        />

        <UAlert
          v-if="localSuccess"
          color="success"
          variant="soft"
          icon="i-lucide-check-circle-2"
          :title="localSuccess"
          class="mb-4"
        />

        <!-- One-Time Active 2FA Backup Codes Banner (Shown ONLY upon immediate activation) -->
        <div v-if="authStore.backupCodes.length > 0" class="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 mb-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
              <UIcon name="i-lucide-key-square" class="w-5 h-5" />
              Emergency Recovery Backup Codes (One-Time Display)
            </h3>
            <UButton
              color="success"
              variant="subtle"
              size="xs"
              :icon="copiedSuccess ? 'i-lucide-check' : 'i-lucide-copy'"
              @click="copyBackupCodes"
            >
              {{ copiedSuccess ? 'Copied!' : 'Copy All Codes' }}
            </UButton>
          </div>
          <p class="text-xs text-emerald-700 dark:text-emerald-400">
            Save these emergency backup codes now. They are displayed only once and will not be visible after you leave this page.
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
            <div
              v-for="code in authStore.backupCodes"
              :key="code"
              class="p-2 rounded bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 font-semibold"
            >
              {{ code }}
            </div>
          </div>
        </div>

        <!-- Initial Setup Button (Unconfigured State) -->
        <div v-if="!authStore.mfaSetupData && !is2FaActive" class="py-2 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Authenticator App Integration</p>
            <p class="text-xs text-gray-500">Generate a Base32 secret key and QR code</p>
          </div>
          <UButton
            color="primary"
            icon="i-lucide-qr-code"
            :loading="isSettingUpMfa"
            @click="handleInitiateMfa"
          >
            Setup 2FA Authenticator
          </UButton>
        </div>

        <!-- Re-configure 2FA Button (Already Active State) -->
        <div v-else-if="is2FaActive && !authStore.mfaSetupData" class="py-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Re-configure Authenticator App</p>
            <p class="text-xs text-gray-500">Scan a new QR code to replace your existing 2FA key</p>
          </div>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="isSettingUpMfa"
            @click="handleInitiateMfa"
          >
            Re-configure 2FA
          </UButton>
        </div>

        <!-- QR Code & 6-digit OTP Setup Step -->
        <div v-else-if="authStore.mfaSetupData" class="space-y-6 pt-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-4">
            
            <!-- QR Image -->
            <div class="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
              <img
                v-if="authStore.mfaSetupData.qrCodeDataUrl"
                :src="authStore.mfaSetupData.qrCodeDataUrl"
                alt="Authenticator QR Code"
                class="w-48 h-48 object-contain"
              />
              <p class="text-xs text-gray-500 mt-2 text-center">Scan with Google Authenticator or Authy</p>
            </div>

            <!-- Manual Secret Key & 6-Digit OTP Pin Input -->
            <div class="space-y-4">
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase">Base32 Secret Key (Manual Entry)</span>
                <div class="mt-1 p-3 bg-gray-100 dark:bg-gray-900 rounded font-mono text-sm tracking-wider font-bold text-gray-900 dark:text-white select-all">
                  {{ authStore.mfaSetupData.secret }}
                </div>
              </div>

              <!-- Activation UPinInput (6 Digits) -->
              <UFormField label="Step 2: Enter 6-digit code from app" required class="flex flex-col items-center">
                <div class="flex justify-center w-full mt-2">
                  <UPinInput
                    v-model="mfaConfirmationPin"
                    :length="6"
                    type="text"
                    otp
                    size="lg"
                    class="gap-2"
                    @complete="handleActivateMfa"
                  />
                </div>
              </UFormField>

              <UButton
                color="primary"
                block
                class="w-full justify-center mt-3"
                :loading="isActivatingMfa"
                :disabled="mfaConfirmationPin.join('').length < 6"
                @click="handleActivateMfa"
              >
                Verify & Enable 2FA
              </UButton>
            </div>

          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>
