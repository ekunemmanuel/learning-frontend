import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { organizationService } from '../services/organizationService'
import type {
  CreateInvitationPayload,
  CreateOrganizationPayload,
  InvitationSchema,
  MemberSchema,
  OrganizationSchema,
  UpdateOrganizationPayload,
} from '../types/organization'

export const PERSONAL_WORKSPACE: OrganizationSchema = {
  id: 'personal-workspace',
  name: 'Personal Workspace',
  slug: 'personal-workspace',
  billingPlan: 'free',
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  memberCount: 1,
  role: 'Owner',
}

export const useOrganizationStore = defineStore('organization', () => {
  const organizations = ref<OrganizationSchema[]>([PERSONAL_WORKSPACE])
  const currentOrganization = ref<OrganizationSchema>(PERSONAL_WORKSPACE)

  const members = ref<MemberSchema[]>([])
  const invitations = ref<InvitationSchema[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isCurrentOrgOwner = computed(() => currentOrganization.value.role === 'Owner')
  const isCurrentOrgAdmin = computed(
    () => currentOrganization.value.role === 'Owner' || currentOrganization.value.role === 'Admin',
  )
  const isPersonalWorkspace = computed(() => currentOrganization.value.id === PERSONAL_WORKSPACE.id)

  function clearError() {
    error.value = null
  }

  function setCurrentOrganization(org: OrganizationSchema) {
    currentOrganization.value = org
    if (!isPersonalWorkspace.value) {
      fetchMembers()
      if (isCurrentOrgAdmin.value) {
        fetchInvitations()
      }
    } else {
      members.value = []
      invitations.value = []
    }
  }

  function resetStore() {
    organizations.value = [PERSONAL_WORKSPACE]
    currentOrganization.value = PERSONAL_WORKSPACE
    members.value = []
    invitations.value = []
    error.value = null
  }

  async function fetchUserOrganizations(): Promise<OrganizationSchema[]> {
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.getUserOrganizations()
      const fetchedOrgs = res.data || []
      organizations.value = [PERSONAL_WORKSPACE, ...fetchedOrgs]

      // By default, always maintain or revert to Personal Workspace on user load/login
      const found = fetchedOrgs.find((o) => o.id === currentOrganization.value.id)
      if (!found) {
        currentOrganization.value = PERSONAL_WORKSPACE
      }
      return organizations.value
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to load user organizations.'
      return organizations.value
    } finally {
      isLoading.value = false
    }
  }

  async function createOrganization(
    payload: CreateOrganizationPayload,
  ): Promise<OrganizationSchema> {
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.createOrganization(payload)
      if (res.data) {
        organizations.value.push(res.data)
        setCurrentOrganization(res.data)
        return res.data
      }
      throw new Error('Failed to create organization.')
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to create organization workspace.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateOrganization(
    payload: UpdateOrganizationPayload,
  ): Promise<OrganizationSchema> {
    if (isPersonalWorkspace.value) {
      throw new Error('Personal workspace settings cannot be modified.')
    }
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.updateOrganization(
        currentOrganization.value.id,
        payload,
      )
      if (res.data) {
        currentOrganization.value = res.data
        const index = organizations.value.findIndex((o) => o.id === res.data?.id)
        if (index !== -1) {
          organizations.value[index] = res.data
        }
        return res.data
      }
      throw new Error('Failed to update organization.')
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to update organization.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteOrganization(): Promise<void> {
    if (isPersonalWorkspace.value) {
      throw new Error('Personal workspace cannot be deleted.')
    }
    isLoading.value = true
    clearError()
    try {
      await organizationService.deleteOrganization(currentOrganization.value.id)
      organizations.value = organizations.value.filter((o) => o.id !== currentOrganization.value.id)
      setCurrentOrganization(PERSONAL_WORKSPACE)
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to delete organization.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMembers(): Promise<MemberSchema[]> {
    if (isPersonalWorkspace.value) return []
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.getMembers(currentOrganization.value.id)
      members.value = res.data || []
      return members.value
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to load team members.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function updateMemberRole(
    memberId: string,
    roleName: 'Owner' | 'Admin' | 'Member',
  ): Promise<MemberSchema> {
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.updateMemberRole(
        currentOrganization.value.id,
        memberId,
        { roleName },
      )
      if (res.data) {
        const index = members.value.findIndex((m) => m.id === memberId)
        if (index !== -1) {
          members.value[index] = res.data
        }
        return res.data
      }
      throw new Error('Failed to update member role.')
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to update member role.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeMember(memberId: string): Promise<void> {
    isLoading.value = true
    clearError()
    try {
      await organizationService.removeMember(currentOrganization.value.id, memberId)
      members.value = members.value.filter((m) => m.id !== memberId)
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to remove team member.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchInvitations(): Promise<InvitationSchema[]> {
    if (isPersonalWorkspace.value) return []
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.getInvitations(currentOrganization.value.id)
      invitations.value = res.data || []
      return invitations.value
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to load pending invitations.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function createInvitation(payload: CreateInvitationPayload): Promise<InvitationSchema> {
    isLoading.value = true
    clearError()
    try {
      const res = await organizationService.createInvitation(currentOrganization.value.id, payload)
      if (res.data) {
        invitations.value.unshift(res.data)
        return res.data
      }
      throw new Error('Failed to create invitation.')
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to invite team member.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function cancelInvitation(invitationId: string): Promise<void> {
    isLoading.value = true
    clearError()
    try {
      await organizationService.cancelInvitation(currentOrganization.value.id, invitationId)
      invitations.value = invitations.value.filter((i) => i.id !== invitationId)
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to cancel invitation.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function acceptInvitation(token: string): Promise<void> {
    isLoading.value = true
    clearError()
    try {
      await organizationService.acceptInvitation({ token })
      await fetchUserOrganizations()
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to accept invitation.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function checkAndClaimPendingInvitation(): Promise<boolean> {
    const pendingToken = sessionStorage.getItem('pending_invite_token')
    if (pendingToken) {
      try {
        await acceptInvitation(pendingToken)
        sessionStorage.removeItem('pending_invite_token')
        sessionStorage.removeItem('pending_invite_email')
        sessionStorage.removeItem('pending_invite_org')
        return true
      } catch (err: unknown) {
        console.error('Failed to accept invitation:', err)
        sessionStorage.removeItem('pending_invite_token')
        return false
      }
    }
    return false
  }

  return {
    organizations,
    currentOrganization,
    members,
    invitations,
    isLoading,
    error,
    isCurrentOrgOwner,
    isCurrentOrgAdmin,
    isPersonalWorkspace,
    clearError,
    resetStore,
    setCurrentOrganization,
    fetchUserOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchMembers,
    updateMemberRole,
    removeMember,
    fetchInvitations,
    createInvitation,
    cancelInvitation,
    acceptInvitation,
    checkAndClaimPendingInvitation,
  }
})
