<template>
  <div class="min-h-svh flex flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

    <!-- Logo section -->
    <div class="mb-6 sm:mb-8">
      <RouterLink to="/" class="flex items-center">
        <img src="@/assets/logo.svg" class="h-20 sm:h-24 md:h-32" alt="Logo" />
      </RouterLink>
    </div>

    <!-- Form section -->
    <div class="w-full max-w-sm bg-[#151515] rounded-xl shadow-xl shadow-[#151515] px-4 py-6 sm:px-6 sm:py-8 mb-6">
      <h2 class="text-center text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6">
        Login to your account
      </h2>

      <form @submit.prevent="submit" class="text-gray-100 space-y-3 sm:space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium">Email</label>
          <input v-model="email" type="email" id="email" required
            class="mt-1.5 sm:mt-2 px-3 py-2.5 sm:py-2 block w-full bg-[#525252] rounded-md border border-[#403f3f] shadow-sm focus:outline-none focus:ring-1 focus:border-gray-800 focus:ring-gray-800 text-sm sm:text-base" />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium">Password</label>
          <input v-model="password" type="password" id="password" required
            class="mt-1.5 sm:mt-2 px-3 py-2.5 sm:py-2 block w-full bg-[#525252] rounded-md border border-[#403f3f] shadow-sm focus:outline-none focus:ring-1 focus:border-gray-800 focus:ring-gray-800 text-sm sm:text-base" />
        </div>

        <div class="flex w-full justify-center pt-2">
          <button :disabled="auth.loading" id="btn_login" type="submit"
            class="w-full sm:w-auto justify-center cursor-pointer font-bold transition bg-red-600 px-8 py-3 sm:px-6 sm:py-2 rounded-lg border-red-700
          border-b-[4px]
          hover:brightness-110 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed">
            Login
          </button>
        </div>

        <p v-if="auth.error" class="text-red-500 text-sm text-center pt-2">{{ auth.error }}</p>
      </form>

      <!-- Guest option -->
      <div class="mt-4 sm:mt-6 text-sm text-center font-semibold border-t border-gray-700 pt-4 sm:pt-6">
        Don't you have an account?
        <button @click="register" id="btn_anonymous"
          class="text-red-500 hover:text-red-300 text-sm font-semibold transition-colors underline active:text-gray-300">
          Register Now!
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'

const email = ref('')
const password = ref('')
const auth = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

const submit = async () => {
  try {
    await auth.login(email.value, password.value)
    await userStore.fetchProfile()

    if (userStore.type === 'A') {
      await router.push({ name: 'ADMIN' })
    } else {
      await router.push({ name: 'GAME' })
    }
  } catch (error) {
    console.error("Login Error:", error)
  }
}

const register = () => {
  router.push({ name: 'REGISTER' })
}
</script>
