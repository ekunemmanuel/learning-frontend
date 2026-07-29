import type {
  ApiResponse,
  LoginMfaPayload,
  LoginPayload,
  LoginResponseData,
  MfaSetupResponseData,
  MfaVerifyPayload,
  MfaVerifyResponseData,
  ResendOtpPayload,
  ResetPasswordPayload,
  SignupPayload,
  UserProfile,
  VerifyPayload,
} from '../types/auth'

const API_BASE_URL = 'http://localhost:3000/auth'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Includes HTTP-Only cookies for refreshToken session
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(json.message || `Request failed with status ${response.status}`)
  }

  return json
}

export const authService = {
  signup(payload: SignupPayload): Promise<ApiResponse<null>> {
    return request<null>('/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  verify(payload: VerifyPayload): Promise<ApiResponse<null>> {
    return request<null>('/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
    return request<LoginResponseData>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  loginMfa(payload: LoginMfaPayload): Promise<ApiResponse<LoginResponseData>> {
    return request<LoginResponseData>('/login/mfa', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  fetchMe(): Promise<ApiResponse<UserProfile>> {
    return request<UserProfile>('/me', {
      method: 'GET',
    })
  },

  resendOtp(payload: ResendOtpPayload): Promise<ApiResponse<null>> {
    return request<null>('/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  refreshSession(): Promise<ApiResponse<null>> {
    return request<null>('/refresh', {
      method: 'POST',
    })
  },

  logout(refreshToken?: string): Promise<ApiResponse<null>> {
    return request<null>('/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshToken || '' }),
    })
  },

  resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<null>> {
    return request<null>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  setupMfa(): Promise<ApiResponse<MfaSetupResponseData>> {
    return request<MfaSetupResponseData>('/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({ type: 'totp', name: 'Google Authenticator' }),
    })
  },

  verifyMfa(payload: MfaVerifyPayload): Promise<ApiResponse<MfaVerifyResponseData>> {
    return request<MfaVerifyResponseData>('/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
