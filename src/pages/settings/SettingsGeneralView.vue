<script setup lang="ts">
import { reactive, ref } from 'vue'

const formState = reactive({
  workspaceName: 'Acme Corp',
  workspaceSlug: 'acme-corp',
  description: 'Enterprise cloud infrastructure and software development workspace',
  contactEmail: 'admin@acme.com',
})

const isSaved = ref(false)

function handleSave() {
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="isSaved"
      color="success"
      variant="soft"
      icon="i-lucide-check-circle-2"
      title="Workspace settings saved successfully!"
    />

    <UForm :state="formState" class="space-y-4" @submit="handleSave">
      <UFormField label="Workspace Name" required help="The public display name of your organization">
        <UInput v-model="formState.workspaceName" class="w-full" />
      </UFormField>

      <UFormField label="Workspace URL Slug" required help="Your workspace URL: https://hub.example.com/org/acme-corp">
        <UInput v-model="formState.workspaceSlug" class="w-full" />
      </UFormField>

      <UFormField label="Description">
        <UTextarea v-model="formState.description" :rows="3" class="w-full" />
      </UFormField>

      <UFormField label="Administrative Contact Email" required>
        <UInput v-model="formState.contactEmail" type="email" class="w-full" />
      </UFormField>

      <div class="pt-2">
        <UButton type="submit" color="primary" class="font-bold">
          Save Changes
        </UButton>
      </div>
    </UForm>
  </div>
</template>
