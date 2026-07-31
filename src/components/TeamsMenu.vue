<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

const dropdownItems = computed(() => {
  const orgItems = organizationStore.organizations.map((org) => ({
    label: org.name,
    icon: org.id === PERSONAL_WORKSPACE.id ? 'i-lucide-user' : 'i-lucide-building-2',
    badge: org.role,
    type: 'checkbox' as const,
    checked: org.id === organizationStore.currentOrganization.id,
    onSelect: () => {
      organizationStore.setCurrentOrganization(org)
    },
  }))

  return [
    orgItems,
    [
      {
        label: 'Create Workspace',
        icon: 'i-lucide-plus',
        onSelect: () => {
          isCreateModalOpen.value = true
        },
      },
    ],
  ]
})
</script>

<template>
  <div>
    <UDropdownMenu :items="dropdownItems" :content="{ align: 'start' }" :ui="{ content: 'w-64' }">
      <UButton color="neutral" variant="soft" class="w-full justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0"
          >
            <UIcon
              :name="
                organizationStore.currentOrganization.id === PERSONAL_WORKSPACE.id
                  ? 'i-lucide-user'
                  : 'i-lucide-building-2'
              "
              class="w-4 h-4"
            />
          </div>
          <div v-if="!collapsed" class="text-left truncate">
            <p class="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
              {{ organizationStore.currentOrganization.name }}
            </p>
          </div>
        </div>
        <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="w-4 h-4 shrink-0" />
      </UButton>
    </UDropdownMenu>

    <!-- Create Workspace Modal -->
    <CreateOrganizationModal v-model:open="isCreateModalOpen" />
  </div>
</template>
