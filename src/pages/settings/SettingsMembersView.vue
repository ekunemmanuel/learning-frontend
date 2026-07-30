<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useOrganizationStore } from '../../stores/organizationStore'
import InviteMemberModal from '../../components/organizations/InviteMemberModal.vue'
import type { MemberSchema } from '../../types/organization'

const organizationStore = useOrganizationStore()

const isInviteModalOpen = ref(false)
const copiedTokenMap = ref<Record<string, boolean>>({})
const localError = ref<string | null>(null)

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
  }
)

async function handleRoleChange(member: MemberSchema, newRole: 'Owner' | 'Admin' | 'Member') {
  localError.value = null
  try {
    await organizationStore.updateMemberRole(member.id, newRole)
  } catch (err: any) {
    localError.value = err.message || 'Failed to update member role.'
  }
}

async function handleRemoveMember(member: MemberSchema) {
  localError.value = null
  try {
    await organizationStore.removeMember(member.id)
  } catch (err: any) {
    localError.value = err.message || 'Failed to remove team member.'
  }
}

async function handleCancelInvitation(invitationId: string) {
  localError.value = null
  try {
    await organizationStore.cancelInvitation(invitationId)
  } catch (err: any) {
    localError.value = err.message || 'Failed to cancel invitation.'
  }
}

function copyInviteLink(id: string, url?: string) {
  if (url) {
    navigator.clipboard.writeText(url)
    copiedTokenMap.value[id] = true
    setTimeout(() => {
      copiedTokenMap.value[id] = false
    }, 2000)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Personal Workspace Info Banner -->
    <div v-if="organizationStore.isPersonalWorkspace" class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-gray-500">
      ℹ️ Personal workspaces do not support multi-user team memberships. To invite colleagues and manage roles, create or switch to an Organization workspace using the top-left sidebar menu.
    </div>

    <template v-else>
      <!-- Error Alert -->
      <UAlert
        v-if="localError || organizationStore.error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="localError || organizationStore.error || ''"
      />

      <!-- Action Bar -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white">Active Team Members</h3>
          <p class="text-xs text-gray-500">People with active access to {{ organizationStore.currentOrganization.name }}</p>
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
      <div class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="py-3 px-4">Member Name & Email</th>
              <th class="py-3 px-4">Role</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Joined Date</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-if="organizationStore.members.length === 0">
              <td colspan="5" class="text-center py-6 text-gray-400">
                No members found in this organization.
              </td>
            </tr>
            <tr v-for="m in organizationStore.members" :key="m.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
              <td class="py-3 px-4">
                <div class="font-bold text-gray-900 dark:text-white">{{ m.name }}</div>
                <div class="text-[10px] text-gray-400">{{ m.email }}</div>
              </td>
              <td class="py-3 px-4">
                <USelect
                  v-if="organizationStore.isCurrentOrgAdmin"
                  :model-value="m.role"
                  :items="['Owner', 'Admin', 'Member']"
                  size="xs"
                  class="w-28"
                  @update:model-value="(val) => handleRoleChange(m, val as any)"
                />
                <UBadge v-else color="neutral" variant="subtle" size="xs">{{ m.role }}</UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge color="success" variant="soft" size="xs">
                  {{ m.status }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-gray-500">
                {{ m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'N/A' }}
              </td>
              <td class="py-3 px-4 text-right">
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-trash-2"
                  aria-label="Remove Member"
                  @click="handleRemoveMember(m)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pending Invitations Section -->
      <div v-if="organizationStore.isCurrentOrgAdmin" class="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white">Pending Invitations</h3>
          <p class="text-xs text-gray-500">Invitations sent to teammates that have not been claimed yet</p>
        </div>

        <div class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th class="py-3 px-4">Recipient Email</th>
                <th class="py-3 px-4">Assigned Role</th>
                <th class="py-3 px-4">Expires</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-if="organizationStore.invitations.length === 0">
                <td colspan="4" class="text-center py-6 text-gray-400">
                  No pending invitations.
                </td>
              </tr>
              <tr v-for="inv in organizationStore.invitations" :key="inv.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                <td class="py-3 px-4 font-bold text-gray-900 dark:text-white">
                  {{ inv.email }}
                </td>
                <td class="py-3 px-4">
                  <UBadge color="neutral" variant="subtle" size="xs">{{ inv.role }}</UBadge>
                </td>
                <td class="py-3 px-4 text-gray-500">
                  {{ inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '7 days' }}
                </td>
                <td class="py-3 px-4 text-right space-x-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="xs"
                    :icon="copiedTokenMap[inv.id] ? 'i-lucide-check' : 'i-lucide-copy'"
                    @click="copyInviteLink(inv.id, inv.inviteUrl)"
                  >
                    {{ copiedTokenMap[inv.id] ? 'Copied Link' : 'Copy Link' }}
                  </UButton>
                  <UButton
                    color="error"
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-x-circle"
                    aria-label="Revoke Invitation"
                    @click="handleCancelInvitation(inv.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Invite Modal -->
      <InviteMemberModal v-model:open="isInviteModalOpen" />
    </template>
  </div>
</template>
