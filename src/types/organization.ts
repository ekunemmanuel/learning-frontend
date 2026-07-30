export interface OrganizationSchema {
  id: string
  name: string
  slug: string
  billingPlan: string
  createdBy: string
  createdAt: string
  updatedAt: string
  memberCount: number
  role: 'Owner' | 'Admin' | 'Member'
}

export interface MemberSchema {
  id: string
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  role: 'Owner' | 'Admin' | 'Member'
  status: 'active' | 'pending'
  joinedAt: string
}

export interface InvitationSchema {
  id: string
  organizationId: string
  organizationName: string
  email: string
  role: 'Owner' | 'Admin' | 'Member'
  token: string
  inviteUrl?: string
  status: 'pending' | 'accepted' | 'cancelled'
  expiresAt: string
  createdAt: string
}

export interface CreateOrganizationPayload {
  name: string
  slug?: string
  billingPlan?: string
}

export interface UpdateOrganizationPayload {
  name?: string
  slug?: string
  billingPlan?: string
}

export interface CreateInvitationPayload {
  email: string
  roleName: 'Owner' | 'Admin' | 'Member'
}

export interface UpdateMemberRolePayload {
  roleName: 'Owner' | 'Admin' | 'Member'
}

export interface AcceptInvitationPayload {
  token: string
}
