<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useOrganizationStore, PERSONAL_WORKSPACE } from '../stores/organizationStore'
import CreateOrganizationModal from './organizations/CreateOrganizationModal.vue'

defineProps<{
  collapsed?: boolean
}>()

const organizationStore = useOrganizationStore()
const isCreateModalOpen = ref(false)

onMounted(() => {
  organizationStore.fetchUserOrganizations()
})

const selectedTeam = computed(() => {
  const current = organizationStore.currentOrganization
  return {
    label: current.name,
    avatar: {
      src: undefined,
      alt: current.name,
    },
    icon: current.id === PERSONAL_WORKSPACE.id ? 'i-lucide-user' : 'i-lucide-building-2',
  }
})

const items = computed<DropdownMenuItem[][]>(() => {
  const orgItems = organizationStore.organizations.map((org) => ({
    label: org.name,
    icon: org.id === PERSONAL_WORKSPACE.id ? 'i-lucide-user' : 'i-lucide-building-2',
    badge: org.role,
    type: 'checkbox' as const,
    checked: org.id === organizationStore.currentOrganization.id,
    onSelect() {
      organizationStore.setCurrentOrganization(org)
    },
  }))

  return [
    orgItems,
    [
      {
        label: 'Create workspace',
        icon: 'i-lucide-circle-plus',
        onSelect() {
          isCreateModalOpen.value = true
        },
      },
    ],
  ]
})
</script>

<template>
  <div class="w-full">
    <UDropdownMenu
      :items="items"
      :content="{ align: 'center', collisionPadding: 12 }"
      :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <UButton
        v-bind="{
          ...selectedTeam,
          label: collapsed ? undefined : selectedTeam.label,
          trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
        }"
        color="neutral"
        variant="ghost"
        block
        :square="collapsed"
        class="data-[state=open]:bg-elevated"
        :class="[!collapsed && 'py-2']"
        :ui="{
          trailingIcon: 'text-dimmed',
        }"
      />
    </UDropdownMenu>

    <!-- Create Workspace Modal -->
    <CreateOrganizationModal v-model:open="isCreateModalOpen" />
  </div>
</template>
