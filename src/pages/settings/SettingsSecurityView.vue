<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'

const toast = useToast()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})

// Switch state reflecting 2FA status
const is2FaSwitch = ref(authStore.isMfaEnabled)

watch(
  () => authStore.isMfaEnabled,
  (val) => {
    is2FaSwitch.value = val
  },
  { immediate: true },
)

// Setup Modal State
const isSetupModalOpen = ref(false)
const isSettingUpMfa = ref(false)
const isActivatingMfa = ref(false)
const mfaConfirmationPin = ref<string[]>([])
const localError = ref<string | null>(null)
const setupCompleted = ref(false)
const copiedSuccess = ref(false)

const isPinValid = computed(() => mfaConfirmationPin.value.join('').length === 6)

// Disable Modal State
const isDisableModalOpen = ref(false)

async function handleToggleChange(val: boolean) {
  if (val) {
    // Toggled ON: Initiate 2FA setup in modal
    isSetupModalOpen.value = true
    setupCompleted.value = false
    mfaConfirmationPin.value = []
    localError.value = null
    isSettingUpMfa.value = true

    try {
      await authStore.setupMfa()
    } catch (err: unknown) {
      localError.value = (err as Error).message || 'Failed to initialize MFA setup.'
      toast.add({
        title: 'Setup Failed',
        description: localError.value || '',
        color: 'error',
      })
      is2FaSwitch.value = false
    } finally {
      isSettingUpMfa.value = false
    }
  } else {
    // Toggled OFF: Open confirmation modal to disable 2FA
    isDisableModalOpen.value = true
  }
}

function handleCloseSetupModal() {
  if (!setupCompleted.value && !authStore.isMfaEnabled) {
    is2FaSwitch.value = false
  }
  isSetupModalOpen.value = false
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
    setupCompleted.value = true
    toast.add({
      title: '2FA Activated',
      description: 'Two-Factor Authentication has been successfully enabled on your account.',
      color: 'success',
    })
  } catch (err: unknown) {
    localError.value =
      (err as Error).message || 'Verification failed. Please check the 6-digit code.'
    toast.add({
      title: 'Verification Failed',
      description: localError.value || '',
      color: 'error',
    })
  } finally {
    isActivatingMfa.value = false
  }
}

async function copyBackupCodes() {
  if (!authStore.backupCodes || authStore.backupCodes.length === 0) return
  const text = authStore.backupCodes.join('\n')

  try {
    await navigator.clipboard.writeText(text)
    copiedSuccess.value = true
    toast.add({
      title: 'Backup Codes Copied',
      description: 'Emergency recovery codes copied to clipboard.',
      color: 'success',
    })
    setTimeout(() => {
      copiedSuccess.value = false
    }, 2000)
  } catch {
    // Fallback if clipboard API is unavailable
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedSuccess.value = true
    toast.add({
      title: 'Backup Codes Copied',
      description: 'Emergency recovery codes copied to clipboard.',
      color: 'success',
    })
    setTimeout(() => {
      copiedSuccess.value = false
    }, 2000)
  }
}

function confirmDisable2FA() {
  authStore.disableMfa()
  is2FaSwitch.value = false
  isDisableModalOpen.value = false
  toast.add({
    title: '2FA Disabled',
    description: 'Two-Factor Authentication has been disabled for your account.',
    color: 'neutral',
  })
}

function cancelDisable2FA() {
  is2FaSwitch.value = true
  isDisableModalOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- 2FA Status Card -->
    <UCard>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center"
          >
            <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-highlighted">Two-Factor Authentication (2FA)</h3>
            <p class="text-xs text-default">
              Add an extra layer of security to your account using TOTP apps
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UBadge
            :color="authStore.isMfaEnabled ? 'success' : 'warning'"
            variant="soft"
            size="md"
            class="font-bold"
          >
            {{ authStore.isMfaEnabled ? '2FA Enabled' : '2FA Disabled' }}
          </UBadge>
          <USwitch v-model="is2FaSwitch" @update:model-value="handleToggleChange" />
        </div>
      </div>
    </UCard>

    <!-- Active Sessions Card -->
    <UCard>
      <template #header>
        <h3 class="text-sm font-bold text-highlighted">Active Sessions</h3>
      </template>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-laptop" class="w-5 h-5 text-default" />
            <div>
              <p class="font-bold text-highlighted">Windows (Chrome Browser)</p>
              <p class="text-[10px] text-default">Current Session • 127.0.0.1</p>
            </div>
          </div>
          <UBadge color="success" variant="subtle" size="xs">Active Now</UBadge>
        </div>
      </div>
    </UCard>

    <!-- Setup 2FA Modal -->
    <UModal
      v-model:open="isSetupModalOpen"
      title="Setup Two-Factor Authentication"
      description="Protect your account using an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy"
      @update:open="handleCloseSetupModal"
    >
      <template #body>
        <!-- Loading State -->
        <div v-if="isSettingUpMfa" class="py-8 text-center text-default space-y-2">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto text-primary" />
          <p class="text-xs">Generating 2FA secret key and QR code...</p>
        </div>

        <!-- Completed / Backup Codes Display State -->
        <div v-else-if="setupCompleted" class="space-y-4">
          <div class="flex items-center gap-3 text-success">
            <UIcon name="i-lucide-check-circle-2" class="w-6 h-6 shrink-0" />
            <div>
              <h4 class="font-bold text-sm text-highlighted">2FA Successfully Enabled!</h4>
              <p class="text-xs text-default">Save your emergency backup recovery codes below.</p>
            </div>
          </div>

          <div
            v-if="authStore.backupCodes.length > 0"
            class="p-3 bg-elevated/20 rounded-lg border border-default space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-default uppercase">Emergency Recovery Codes</span>
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                :icon="copiedSuccess ? 'i-lucide-check' : 'i-lucide-copy'"
                @click="copyBackupCodes"
              >
                {{ copiedSuccess ? 'Copied!' : 'Copy All' }}
              </UButton>
            </div>
            <div class="grid grid-cols-2 gap-2 font-mono text-xs text-center">
              <div
                v-for="code in authStore.backupCodes"
                :key="code"
                class="p-2 rounded bg-background border border-default font-semibold"
              >
                {{ code }}
              </div>
            </div>
          </div>
        </div>

        <!-- QR Code & OTP Verification Step (Stacked Layout) -->
        <div v-else-if="authStore.mfaSetupData" class="space-y-6">
          <UAlert
            v-if="localError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="localError"
          />

          <div class="flex flex-col items-center gap-6">
            <!-- QR Image Container with Primary Color Background -->
            <div class="flex flex-col items-center justify-center p-4 w-full max-w-sm">
              <div class="p-3 bg-white rounded-xl shadow-sm">
                <img
                  v-if="authStore.mfaSetupData.qrCodeDataUrl"
                  :src="authStore.mfaSetupData.qrCodeDataUrl"
                  alt="Authenticator QR Code"
                  class="w-44 h-44 object-contain"
                />
              </div>
              <p class="text-xs text-default mt-3 text-center font-medium">
                Scan with your authenticator app <br />
                <span class="text-[11px] text-dimmed"
                  >(e.g. Google Authenticator, Microsoft Authenticator, Authy, 1Password)</span
                >
              </p>
            </div>

            <!-- Manual Secret & OTP Pin -->
            <div class="space-y-4 w-full max-w-sm text-center">
              <div>
                <span
                  class="text-[10px] font-semibold text-default uppercase tracking-wider block mb-1"
                  >Secret Key (Manual Entry)</span
                >
                <div
                  class="px-3 py-2 bg-elevated rounded-lg font-mono text-xs font-bold tracking-wider select-all border border-default"
                >
                  {{ authStore.mfaSetupData.secret }}
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-semibold text-default block"
                  >Enter 6-digit authenticator code</label
                >
                <div class="flex justify-center">
                  <UPinInput
                    v-model="mfaConfirmationPin"
                    :length="6"
                    type="text"
                    otp
                    size="md"
                    class="gap-2"
                    @complete="handleActivateMfa"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <template v-if="setupCompleted">
            <UButton color="primary" @click="handleCloseSetupModal"> Done </UButton>
          </template>
          <template v-else>
            <UButton
              color="neutral"
              variant="outline"
              :disabled="isActivatingMfa"
              @click="handleCloseSetupModal"
            >
              Cancel
            </UButton>
            <UButton
              :color="isPinValid ? 'primary' : 'neutral'"
              :variant="isPinValid ? 'solid' : 'ghost'"
              :disabled="!isPinValid"
              :loading="isActivatingMfa"
              @click="handleActivateMfa"
            >
              Verify & Enable 2FA
            </UButton>
          </template>
        </div>
      </template>
    </UModal>

    <!-- Disable 2FA Confirmation Modal -->
    <UModal
      v-model:open="isDisableModalOpen"
      title="Disable Two-Factor Authentication"
      description="Are you sure you want to disable 2FA? This will make your account less secure by removing the second layer of verification."
      :dismissible="false"
    >
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" @click="cancelDisable2FA"> Cancel </UButton>
          <UButton color="error" @click="confirmDisable2FA"> Disable 2FA </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
