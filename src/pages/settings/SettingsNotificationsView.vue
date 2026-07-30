<script setup lang="ts">
import { ref } from 'vue'

const emailNotifications = ref(true)
const securityAlerts = ref(true)
const marketingEmails = ref(false)
const weeklyReport = ref(true)
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div>
          <p class="text-sm font-bold text-gray-900 dark:text-white">Email Digest & Activity</p>
          <p class="text-xs text-gray-500">Receive summary notifications about workspace changes</p>
        </div>
        <USwitch v-model="emailNotifications" />
      </div>

      <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div>
          <p class="text-sm font-bold text-gray-900 dark:text-white">Security Alerts & 2FA Notifications</p>
          <p class="text-xs text-gray-500">Get immediate alerts for password changes and new logins</p>
        </div>
        <USwitch v-model="securityAlerts" />
      </div>

      <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div>
          <p class="text-sm font-bold text-gray-900 dark:text-white">Weekly Performance Report</p>
          <p class="text-xs text-gray-500">Receive weekly analytics report via email every Monday</p>
        </div>
        <USwitch v-model="weeklyReport" />
      </div>

      <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div>
          <p class="text-sm font-bold text-gray-900 dark:text-white">Product Updates & Marketing</p>
          <p class="text-xs text-gray-500">Receive news about new platform features and updates</p>
        </div>
        <USwitch v-model="marketingEmails" />
      </div>
    </div>
  </div>
</template>
