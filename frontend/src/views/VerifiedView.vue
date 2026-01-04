<template>
  <div class="min-h-svh flex flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
    <div class="mb-6 sm:mb-8">
      <RouterLink to="/" class="flex items-center">
        <img src="@/assets/logo.svg" class="h-20 sm:h-24 md:h-32" alt="Logo" />
      </RouterLink>
    </div>

    <div class="w-full max-w-sm bg-[#151515] rounded-xl shadow-xl shadow-[#151515] px-4 py-6 sm:px-6 sm:py-8 mb-6">
      <h2 class="text-center text-xl sm:text-2xl font-bold text-gray-100 mb-3 sm:mb-4">
        {{ title }}
      </h2>

      <p class="text-sm text-gray-300 text-center">
        {{ message }}
      </p>

      <div class="flex w-full justify-center pt-5">
        <RouterLink to="/login"
          class="w-full sm:w-auto justify-center cursor-pointer font-bold transition bg-red-600 px-8 py-3 sm:px-6 sm:py-2 rounded-lg border-red-700
          border-b-[4px] hover:brightness-110 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
          Go to login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const status = computed(() => route.query.status || 'success')

const title = computed(() => {
  if (status.value === 'already') return 'Email already verified'
  if (status.value === 'invalid') return 'Verification link invalid'
  return 'Email verified'
})

const message = computed(() => {
  if (status.value === 'already') {
    return 'Your email was already verified. You can log in now.'
  }
  if (status.value === 'invalid') {
    return 'This verification link is invalid or expired. Please request a new one.'
  }
  return 'Your email is verified. You can log in now.'
})
</script>
