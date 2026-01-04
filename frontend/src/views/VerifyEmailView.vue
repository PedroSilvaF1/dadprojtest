<template>
  <div class="min-h-svh flex flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
    <div class="mb-6 sm:mb-8">
      <RouterLink to="/" class="flex items-center">
        <img src="@/assets/logo.svg" class="h-20 sm:h-24 md:h-32" alt="Logo" />
      </RouterLink>
    </div>

    <div class="w-full max-w-sm bg-[#151515] rounded-xl shadow-xl shadow-[#151515] px-4 py-6 sm:px-6 sm:py-8 mb-6">
      <h2 class="text-center text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6">
        Verify your email
      </h2>

      <p class="text-sm text-gray-300 text-center">
        We sent a verification email to
        <span class="font-semibold text-gray-100">{{ email || 'your inbox' }}</span>.
        Click the link to activate your account.
      </p>

      <div class="mt-5 text-center">
        <button
          type="button"
          class="text-red-500 hover:text-red-300 text-sm font-semibold transition-colors underline active:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="countdown > 0 || loading"
          @click="resend"
        >
          Resend verification email
          <span v-if="countdown > 0">({{ countdown }})</span>
        </button>
      </div>

      <p v-if="message" class="text-green-500 text-sm text-center pt-3">{{ message }}</p>
      <p v-if="error" class="text-red-500 text-sm text-center pt-3">{{ error }}</p>

      <div class="mt-6 text-sm text-center font-semibold text-gray-400 border-t border-gray-700 pt-4 sm:pt-6">
        Already verified?
        <router-link to="/login"
          class="text-red-500 hover:text-red-300 text-sm font-semibold transition-colors underline active:text-gray-300 ml-1">
          Login now
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmailVerificationStore } from '@/stores/useEmailVerificationStore'

const route = useRoute()
const store = useEmailVerificationStore()

const email = computed(() => store.email)
const countdown = computed(() => store.countdown)
const loading = computed(() => store.loading)
const message = computed(() => store.message)
const error = computed(() => store.error)

const syncEmail = () => {
  const routeEmail = route.query.email || ''
  if (routeEmail) {
    store.setEmail(routeEmail)
  }
}

watch(
  () => route.query.email,
  () => {
    syncEmail()
  }
)

onMounted(() => {
  store.loadState()
  syncEmail()
})

onBeforeUnmount(() => {
  store.stopCountdown()
  store.resetMessages()
})

const resend = () => store.resend()
</script>
