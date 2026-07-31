import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'
import { useOrganizationStore } from './organizationStore'
import type {
  MfaSetupResponseData,
  ResendOtpPayload,
  ResetPasswordPayload,
  SignupPayload,
  UserProfile,
  ValidationErrorItem,
  VerifyPayload,
} from '../types/auth'

export interface PendingVerification {
  identifier: string
  email: string
  code?: string
  type?: 'email_verification' | 'phone_verification' | 'password_reset'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isAuthenticated = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})

  // MFA Step 2 State
  const mfaRequired = ref<boolean>(false)
  const pendingCredentials = ref<{ identifier: string; password: string } | null>(null)

  function loadSavedPendingVerification(): PendingVerification | null {
    try {
      const stored = sessionStorage.getItem('pending_verification')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  // Verification Context State (persisted in sessionStorage across page reloads)
  const pendingVerification = ref<PendingVerification | null>(loadSavedPendingVerification())
  const lastRegisteredIdentifier = ref<string>('')

  // MFA Setup State
  const mfaSetupData = ref<MfaSetupResponseData | null>(null)
  const backupCodes = ref<string[]>([])

  const isEmailVerified = computed(() => !!user.value?.isEmailVerified)
  const isPhoneVerified = computed(() => !!user.value?.isPhoneVerified)
  const isMfaEnabled = computed(() => !!user.value?.isMfaEnabled)

  function clearError() {
    error.value = null
    fieldErrors.value = {}
  }

  function handleActionError(err: unknown, fallbackMessage: string) {
    const errorObj = err as { message?: string; errors?: ValidationErrorItem[] }
    error.value = errorObj?.message || fallbackMessage
    const errorsMap: Record<string, string> = {}
    if (Array.isArray(errorObj?.errors)) {
      errorObj.errors.forEach((item: ValidationErrorItem) => {
        if (item.field) {
          errorsMap[item.field] = item.message
        }
      })
    }
    fieldErrors.value = errorsMap
  }

  function setPendingVerification(data: PendingVerification) {
    const base = pendingVerification.value || {}
    const updated = { ...base, ...data } as PendingVerification
    pendingVerification.value = updated
    try {
      sessionStorage.setItem('pending_verification', JSON.stringify(updated))
    } catch {
      // Ignore storage write errors
    }
  }

  function clearPendingVerification() {
    pendingVerification.value = null
    try {
      sessionStorage.removeItem('pending_verification')
    } catch {
      // Ignore storage remove errors
    }
  }

  function clearBackupCodes() {
    backupCodes.value = []
  }

  async function fetchUser(): Promise<UserProfile | null> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.fetchMe()
      if (res.success && res.data) {
        user.value = res.data
        isAuthenticated.value = true
        return res.data
      }
      user.value = null
      isAuthenticated.value = false
      return null
    } catch {
      user.value = null
      isAuthenticated.value = false
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function login(identifier: string, password: string): Promise<{ mfaRequired: boolean }> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.login({ identifier, password })
      if (res.data?.mfaRequired) {
        mfaRequired.value = true
        pendingCredentials.value = { identifier, password }
        return { mfaRequired: true }
      }

      mfaRequired.value = false
      pendingCredentials.value = null
      const organizationStore = useOrganizationStore()
      organizationStore.resetStore()
      await fetchUser()
      return { mfaRequired: false }
    } catch (err: unknown) {
      handleActionError(err, 'Login failed. Please check your credentials.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loginMfa(mfaCode: string): Promise<void> {
    if (!pendingCredentials.value) {
      throw new Error('No pending authentication credentials found.')
    }
    isLoading.value = true
    clearError()
    try {
      const { identifier, password } = pendingCredentials.value
      await authService.loginMfa({ identifier, password, mfaCode })
      mfaRequired.value = false
      pendingCredentials.value = null
      await fetchUser()
    } catch (err: unknown) {
      handleActionError(err, 'Invalid authenticator code.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function signup(payload: SignupPayload): Promise<string> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.signup(payload)
      setPendingVerification({
        identifier: payload.username || payload.email,
        email: payload.email,
        type: 'email_verification',
      })
      return res.message
    } catch (err: unknown) {
      handleActionError(err, 'Registration failed.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyCode(payload: VerifyPayload): Promise<string> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.verify(payload)
      if (isAuthenticated.value) {
        await fetchUser()
      }
      return res.message
    } catch (err: unknown) {
      handleActionError(err, 'Verification failed.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function resendOtp(payload: ResendOtpPayload): Promise<string> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.resendOtp(payload)
      return res.message
    } catch (err: unknown) {
      handleActionError(err, 'Failed to resend code.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.resetPassword(payload)
      clearPendingVerification()
      return res.message
    } catch (err: unknown) {
      handleActionError(err, 'Failed to reset password.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function setupMfa(): Promise<MfaSetupResponseData> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.setupMfa()
      if (res.data) {
        mfaSetupData.value = res.data
        return res.data
      }
      throw new Error('Failed to retrieve MFA setup data.')
    } catch (err: unknown) {
      handleActionError(err, 'Failed to initialize 2FA.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyMfa(methodId: string, code: string): Promise<string[]> {
    isLoading.value = true
    clearError()
    try {
      const res = await authService.verifyMfa({ methodId, code })
      const codes = res.data?.backupCodes || []
      backupCodes.value = codes
      await fetchUser()
      return codes
    } catch (err: unknown) {
      handleActionError(err, 'MFA verification failed.')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      await authService.logout()
    } catch {
      // Ignore logout errors and clean local state
    } finally {
      user.value = null
      isAuthenticated.value = false
      mfaRequired.value = false
      pendingCredentials.value = null
      mfaSetupData.value = null
      backupCodes.value = []
      pendingVerification.value = null
      fieldErrors.value = {}
      isLoading.value = false
      const organizationStore = useOrganizationStore()
      organizationStore.resetStore()
    }
  }

  function cancelMfaStep() {
    mfaRequired.value = false
    pendingCredentials.value = null
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    fieldErrors,
    mfaRequired,
    pendingCredentials,
    pendingVerification,
    lastRegisteredIdentifier,
    mfaSetupData,
    backupCodes,
    isEmailVerified,
    isPhoneVerified,
    isMfaEnabled,
    clearError,
    setPendingVerification,
    clearPendingVerification,
    clearBackupCodes,
    fetchUser,
    login,
    loginMfa,
    signup,
    verifyCode,
    resendOtp,
    resetPassword,
    setupMfa,
    verifyMfa,
    logout,
    cancelMfaStep,
  }
})
