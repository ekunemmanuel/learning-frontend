<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

interface Team {
  id: string
  name: string
  avatar: string
  role: string
}

const teams = ref<Team[]>([
  {
    id: '1',
    name: 'Acme Corp',
    avatar: 'i-lucide-building-2',
    role: 'Owner',
  },
  {
    id: '2',
    name: 'Personal Workspace',
    avatar: 'i-lucide-user',
    role: 'Admin',
  },
  {
    id: '3',
    name: 'Stark Industries',
    avatar: 'i-lucide-zap',
    role: 'Member',
  },
])

const activeTeam = ref<Team>(teams.value[0]!)
const isCreateModalOpen = ref(false)
const newTeamName = ref('')

const dropdownItems = computed(() => [
  teams.value.map((team) => ({
    label: team.name,
    icon: team.avatar,
    badge: team.role,
    type: 'checkbox' as const,
    checked: team.id === activeTeam.value.id,
    onSelect: () => {
      activeTeam.value = team
    },
  })),
  [
    {
      label: 'Create Workspace',
      icon: 'i-lucide-plus',
      onSelect: () => {
        isCreateModalOpen.value = true
      },
    },
  ],
])

function handleCreateTeam() {
  if (!newTeamName.value.trim()) return
  const newTeam: Team = {
    id: String(Date.now()),
    name: newTeamName.value.trim(),
    avatar: 'i-lucide-briefcase',
    role: 'Owner',
  }
  teams.value.push(newTeam)
  activeTeam.value = newTeam
  newTeamName.value = ''
  isCreateModalOpen.value = false
}
</script>

<template>
  <div>
    <UDropdownMenu :items="dropdownItems" :content="{ align: 'start' }">
      <UButton
        color="neutral"
        variant="ghost"
        class="w-full justify-between py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <UIcon :name="activeTeam.avatar" class="w-4 h-4" />
          </div>
          <div class="text-left truncate">
            <p class="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
              {{ activeTeam.name }}
            </p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              {{ activeTeam.role }}
            </p>
          </div>
        </div>
        <UIcon name="i-lucide-chevrons-up-down" class="w-4 h-4 text-gray-400 shrink-0" />
      </UButton>
    </UDropdownMenu>

    <!-- Create Workspace Modal -->
    <UModal v-model:open="isCreateModalOpen" title="Create New Workspace" description="Add a new workspace to manage your team and projects">
      <template #body>
        <div class="space-y-4 py-2">
          <UFormField label="Workspace Name" required help="e.g. Acme Marketing, Dev Studio">
            <UInput
              v-model="newTeamName"
              placeholder="My New Workspace"
              icon="i-lucide-building"
              class="w-full"
              autofocus
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="isCreateModalOpen = false">
            Cancel
          </UButton>
          <UButton color="primary" :disabled="!newTeamName.trim()" @click="handleCreateTeam">
            Create Workspace
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
