export interface UserProfile {
  id: string
  email: string
  username: string
  phone: string | null
  country: string | null
  name: string
  avatarUrl: string | null
  isEmailVerified: boolean
  emailVerifiedAt: string | null
  isPhoneVerified: boolean
  phoneVerifiedAt: string | null
  isMfaEnabled: boolean
}

export interface MinimalUser {
  email: string
  name: string
}

export interface ValidationErrorItem {
  field: string
  message: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: ValidationErrorItem[]
}

export interface SignupPayload {
  name: string
  email: string
  username: string
  phone?: string
  country?: string
  password: string
}

export interface VerifyPayload {
  identifier: string
  code: string
  type: 'email_verification' | 'phone_verification' | 'password_reset'
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface LoginMfaPayload {
  identifier: string
  password: string
  mfaCode: string
}

export interface LoginResponseData {
  mfaRequired: boolean
  user: MinimalUser | null
  refreshToken: string | null
}

export interface ResendOtpPayload {
  identifier: string
  purpose: 'email_verification' | 'phone_verification' | 'password_reset'
}

export interface ResetPasswordPayload {
  identifier: string
  code: string
  newPassword: string
}

export interface MfaSetupResponseData {
  methodId?: string
  secret?: string
  qrCodePayload?: string
  qrCodeDataUrl?: string
  isMfaEnabled?: boolean
}

export interface MfaVerifyPayload {
  methodId: string
  code: string
}

export interface MfaVerifyResponseData {
  backupCodes: string[]
}
