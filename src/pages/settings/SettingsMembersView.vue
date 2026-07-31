<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useOrganizationStore } from '../../stores/organizationStore'
import InviteMemberModal from '../../components/organizations/InviteMemberModal.vue'
import type { MemberSchema, InvitationSchema } from '../../types/organization'

const toast = useToast()
const organizationStore = useOrganizationStore()

const isInviteModalOpen = ref(false)
const copiedTokenMap = ref<Record<string, boolean>>({})

// Modals confirmation state
const isRemoveMemberModalOpen = ref(false)
const memberToRemove = ref<MemberSchema | null>(null)
const isRemovingMember = ref(false)

const isRevokeInviteModalOpen = ref(false)
const invitationToRevoke = ref<InvitationSchema | null>(null)
const isRevokingInvite = ref(false)

const memberColumns: TableColumn<MemberSchema>[] = [
  {
    accessorKey: 'name',
    header: 'Member Name & Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    meta: {
      class: {
        th: '',
        td: '',
      },
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center',
      },
    },
  },
  {
    accessorKey: 'joinedAt',
    header: 'Joined Date',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right',
      },
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: {
      class: {
        th: 'text-right w-16',
        td: 'text-right whitespace-nowrap',
      },
    },
  },
]

const invitationColumns: TableColumn<InvitationSchema>[] = [
  {
    accessorKey: 'email',
    header: 'Recipient Email',
  },
  {
    accessorKey: 'role',
    header: 'Assigned Role',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center',
      },
    },
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right',
      },
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: {
      class: {
        th: 'text-right w-36',
        td: 'text-right whitespace-nowrap',
      },
    },
  },
]

onMounted(() => {
  if (!organizationStore.isPersonalWorkspace) {
    organizationStore.fetchMembers()
    if (organizationStore.isCurrentOrgAdmin) {
      organizationStore.fetchInvitations()
    }
  }
})

watch(
  () => organizationStore.currentOrganization.id,
  (newId) => {
    if (newId !== 'personal-workspace') {
      organizationStore.fetchMembers()
      if (organizationStore.isCurrentOrgAdmin) {
        organizationStore.fetchInvitations()
      }
    }
  },
)

async function handleRoleChange(member: MemberSchema, newRole: 'Owner' | 'Admin' | 'Member') {
  try {
    await organizationStore.updateMemberRole(member.id, newRole)
    toast.add({
      title: 'Role Updated',
      description: `${member.name}'s role updated to ${newRole}.`,
      color: 'success',
    })
  } catch (err: unknown) {
    toast.add({
      title: 'Role Update Failed',
      description: (err as Error).message || 'Failed to update member role.',
      color: 'error',
    })
  }
}

function openRemoveMemberModal(member: MemberSchema) {
  memberToRemove.value = member
  isRemoveMemberModalOpen.value = true
}

async function executeRemoveMember() {
  if (!memberToRemove.value) return
  isRemovingMember.value = true

  try {
    await organizationStore.removeMember(memberToRemove.value.id)
    toast.add({
      title: 'Member Removed',
      description: `${memberToRemove.value.name} has been removed from the workspace.`,
      color: 'success',
    })
    isRemoveMemberModalOpen.value = false
    memberToRemove.value = null
  } catch (err: unknown) {
    toast.add({
      title: 'Remove Member Failed',
      description: (err as Error).message || 'Failed to remove team member.',
      color: 'error',
    })
  } finally {
    isRemovingMember.value = false
  }
}

function openRevokeInviteModal(invitation: InvitationSchema) {
  invitationToRevoke.value = invitation
  isRevokeInviteModalOpen.value = true
}

async function executeRevokeInvitation() {
  if (!invitationToRevoke.value) return
  isRevokingInvite.value = true

  try {
    await organizationStore.cancelInvitation(invitationToRevoke.value.id)
    toast.add({
      title: 'Invitation Revoked',
      description: `Invitation sent to ${invitationToRevoke.value.email} has been revoked.`,
      color: 'success',
    })
    isRevokeInviteModalOpen.value = false
    invitationToRevoke.value = null
  } catch (err: unknown) {
    toast.add({
      title: 'Revoke Invitation Failed',
      description: (err as Error).message || 'Failed to cancel invitation.',
      color: 'error',
    })
  } finally {
    isRevokingInvite.value = false
  }
}

function copyInviteLink(id: string, url?: string) {
  if (url) {
    navigator.clipboard.writeText(url)
    copiedTokenMap.value[id] = true
    toast.add({
      title: 'Copied',
      description: 'Invitation magic link copied to clipboard.',
      color: 'success',
    })
    setTimeout(() => {
      copiedTokenMap.value[id] = false
    }, 2000)
  }
}
const activeMemberColumns = computed(() => {
  if (organizationStore.isCurrentOrgAdmin) {
    return memberColumns
  }
  return memberColumns.filter((col) => col.id !== 'actions')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Personal Workspace Info Banner -->
    <div
      v-if="organizationStore.isPersonalWorkspace"
      class="p-4 bg-elevated/50 rounded-xl border border-default text-xs text-default"
    >
      ℹ️ Personal workspaces do not support multi-user team memberships. To invite colleagues and
      manage roles, create or switch to an Organization workspace using the top-left sidebar menu.
    </div>

    <template v-else>
      <!-- Action Bar -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-highlighted">Active Team Members</h3>
          <p class="text-xs text-default">
            People with active access to {{ organizationStore.currentOrganization.name }}
          </p>
        </div>

        <UButton
          v-if="organizationStore.isCurrentOrgAdmin"
          color="primary"
          size="sm"
          icon="i-lucide-user-plus"
          class="font-bold"
          @click="isInviteModalOpen = true"
        >
          Invite Teammate
        </UButton>
      </div>

      <!-- Members Table -->
      <UTable
        :data="organizationStore.members"
        :columns="activeMemberColumns"
        class="w-full border border-default rounded-xl overflow-hidden shadow-sm"
      >
        <template #name-cell="{ row }">
          <div>
            <div class="font-bold text-highlighted">{{ row.original.name }}</div>
            <div class="text-[10px] text-default">{{ row.original.email }}</div>
          </div>
        </template>

        <template #role-cell="{ row }">
          <div class="">
            <USelect
              v-if="organizationStore.isCurrentOrgAdmin && row.original.role !== 'Owner'"
              :model-value="row.original.role"
              :items="['Admin', 'Member']"
              size="xs"
              class="w-28"
              @update:model-value="(val) => handleRoleChange(row.original, val as any)"
            />
            <UBadge v-else color="neutral" variant="subtle">{{ row.original.role }}</UBadge>
          </div>
        </template>

        <template #status-cell="{ row }">
          <div class="flex justify-center">
            <UBadge color="success" variant="soft">
              {{ row.original.status }}
            </UBadge>
          </div>
        </template>

        <template #joinedAt-cell="{ row }">
          <span class="text-default">
            {{
              row.original.joinedAt ? new Date(row.original.joinedAt).toLocaleDateString() : 'N/A'
            }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div v-if="organizationStore.isCurrentOrgAdmin" class="text-right">
            <UButton
              v-if="row.original.role !== 'Owner'"
              color="error"
              variant="ghost"
              size="xs"
              icon="i-lucide-trash-2"
              aria-label="Remove Member"
              @click="openRemoveMemberModal(row.original)"
            />
          </div>
        </template>

        <template #empty>
          <div class="text-center py-6 text-default">No members found in this organization.</div>
        </template>
      </UTable>

      <USeparator v-if="organizationStore.isCurrentOrgAdmin" label="Pending Invitations" />

      <!-- Pending Invitations Section -->
      <div v-if="organizationStore.isCurrentOrgAdmin" class="space-y-3">
        <div>
          <h3 class="text-sm font-bold text-highlighted">Pending Invitations</h3>
          <p class="text-xs text-default">
            Invitations sent to teammates that have not been claimed yet
          </p>
        </div>

        <UTable
          :data="organizationStore.invitations"
          :columns="invitationColumns"
          class="w-full border border-default rounded-xl overflow-hidden shadow-sm"
        >
          <template #email-cell="{ row }">
            <span class="font-bold text-default">{{ row.original.email }}</span>
          </template>

          <template #role-cell="{ row }">
            <div class="flex justify-center">
              <UBadge color="neutral" variant="subtle">{{ row.original.role }}</UBadge>
            </div>
          </template>

          <template #expiresAt-cell="{ row }">
            <span class="text-default">
              {{
                row.original.expiresAt
                  ? new Date(row.original.expiresAt).toLocaleDateString()
                  : '7 days'
              }}
            </span>
          </template>

          <template #actions-cell="{ row }">
            <div class="text-right space-x-2">
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                :icon="copiedTokenMap[row.original.id] ? 'i-lucide-check' : 'i-lucide-copy'"
                @click="copyInviteLink(row.original.id, row.original.inviteUrl)"
              >
                {{ copiedTokenMap[row.original.id] ? 'Copied Link' : 'Copy Link' }}
              </UButton>
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-lucide-x-circle"
                aria-label="Revoke Invitation"
                @click="openRevokeInviteModal(row.original)"
              />
            </div>
          </template>

          <template #empty>
            <div class="text-center py-6 text-default">No pending invitations.</div>
          </template>
        </UTable>
      </div>

      <!-- Invite Modal -->
      <InviteMemberModal v-model:open="isInviteModalOpen" />

      <!-- Remove Member Confirmation Modal -->
      <UModal
        v-model:open="isRemoveMemberModalOpen"
        title="Remove Team Member"
        :description="`Are you sure you want to remove '${memberToRemove?.name}' (${memberToRemove?.email}) from this workspace?`"
      >
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="isRemovingMember"
              @click="isRemoveMemberModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton color="error" :loading="isRemovingMember" @click="executeRemoveMember">
              Remove Member
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Revoke Invitation Confirmation Modal -->
      <UModal
        v-model:open="isRevokeInviteModalOpen"
        title="Revoke Workspace Invitation"
        :description="`Are you sure you want to revoke the pending invitation sent to '${invitationToRevoke?.email}'?`"
      >
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="isRevokingInvite"
              @click="isRevokeInviteModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton color="error" :loading="isRevokingInvite" @click="executeRevokeInvitation">
              Revoke Invitation
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
