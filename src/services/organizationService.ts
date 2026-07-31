import type { ApiResponse } from '../types/auth'
import type {
  AcceptInvitationPayload,
  CreateInvitationPayload,
  CreateOrganizationPayload,
  InvitationSchema,
  MemberSchema,
  OrganizationSchema,
  UpdateMemberRolePayload,
  UpdateOrganizationPayload,
} from '../types/organization'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'
const API_BASE_URL = `${BASE_URL}/organizations`

export class ApiError extends Error {
  errors?: unknown[]
  constructor(message: string, errors?: unknown[]) {
    super(message)
    this.name = 'ApiError'
    this.errors = errors
  }
}

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
    credentials: 'include', // Includes HTTP-Only cookies for session authentication
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok || (json && json.success === false)) {
    throw new ApiError(
      json.message || `Request failed with status ${response.status}`,
      json.errors || [],
    )
  }

  return json
}

export const organizationService = {
  createOrganization(payload: CreateOrganizationPayload): Promise<ApiResponse<OrganizationSchema>> {
    return request<OrganizationSchema>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getUserOrganizations(): Promise<ApiResponse<OrganizationSchema[]>> {
    return request<OrganizationSchema[]>('', {
      method: 'GET',
    })
  },

  getOrganization(idOrSlug: string): Promise<ApiResponse<OrganizationSchema>> {
    return request<OrganizationSchema>(`/${encodeURIComponent(idOrSlug)}`, {
      method: 'GET',
    })
  },

  updateOrganization(
    idOrSlug: string,
    payload: UpdateOrganizationPayload,
  ): Promise<ApiResponse<OrganizationSchema>> {
    return request<OrganizationSchema>(`/${encodeURIComponent(idOrSlug)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deleteOrganization(idOrSlug: string): Promise<ApiResponse<null>> {
    return request<null>(`/${encodeURIComponent(idOrSlug)}`, {
      method: 'DELETE',
    })
  },

  getMembers(idOrSlug: string): Promise<ApiResponse<MemberSchema[]>> {
    return request<MemberSchema[]>(`/${encodeURIComponent(idOrSlug)}/members`, {
      method: 'GET',
    })
  },

  updateMemberRole(
    idOrSlug: string,
    memberId: string,
    payload: UpdateMemberRolePayload,
  ): Promise<ApiResponse<MemberSchema>> {
    return request<MemberSchema>(
      `/${encodeURIComponent(idOrSlug)}/members/${encodeURIComponent(memberId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    )
  },

  removeMember(idOrSlug: string, memberId: string): Promise<ApiResponse<null>> {
    return request<null>(
      `/${encodeURIComponent(idOrSlug)}/members/${encodeURIComponent(memberId)}`,
      {
        method: 'DELETE',
      },
    )
  },

  createInvitation(
    idOrSlug: string,
    payload: CreateInvitationPayload,
  ): Promise<ApiResponse<InvitationSchema>> {
    return request<InvitationSchema>(`/${encodeURIComponent(idOrSlug)}/invitations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getInvitations(idOrSlug: string): Promise<ApiResponse<InvitationSchema[]>> {
    return request<InvitationSchema[]>(`/${encodeURIComponent(idOrSlug)}/invitations`, {
      method: 'GET',
    })
  },

  cancelInvitation(idOrSlug: string, invitationId: string): Promise<ApiResponse<null>> {
    return request<null>(
      `/${encodeURIComponent(idOrSlug)}/invitations/${encodeURIComponent(invitationId)}`,
      {
        method: 'DELETE',
      },
    )
  },

  acceptInvitation(payload: AcceptInvitationPayload): Promise<ApiResponse<null>> {
    return request<null>('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
