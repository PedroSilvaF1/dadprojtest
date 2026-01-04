<script setup>
import { computed, } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import BottomNav from "@/components/BottomNav.vue";

const route = useRoute();
const router = useRouter();

const currentRouteName = computed(() => route.name);

// rotas que são acessiveis sem fazer login
const publicRoutes = ['GAME', 'SCORE', 'STATS'];

const handleNavSelection = (name) => {
  router.push({ name: name });
};

const goToLogin = () => {
  router.push({ name: 'LOGIN' });
};
</script>
<template>
  <NavBar
    :selected="currentRouteName"
    @update:selected="handleNavSelection"
    class="hidden md:block"
  />

  <div class="text-center pb-28 md:pb-10 text-white relative overflow-hidden min-h-screen flex flex-col">

    <transition v-if="publicRoutes.includes(route.name)" name="fade" mode="out-in">
      <div :key="route.name" class="relative z-10 h-full flex-1">
        <RouterView />
      </div>
    </transition>

    <div v-else class="flex-1 flex flex-col items-center justify-center gap-6 p-6 mt-10">
      <div class="bg-black/60 border border-yellow-700/50 p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h2 class="text-2xl font-bold text-yellow-200 mb-2">Access Restricted</h2>
        <p class="text-gray-300 mb-6">You need to be logged in to access this section.</p>

        <button
          @click="goToLogin"
          class="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700
                 text-yellow-100 font-bold py-3 px-8 rounded-full shadow-lg transition-all
                 transform hover:scale-105 active:scale-95 border border-yellow-600/50">
          Go to Login Page
        </button>
      </div>
    </div>

    <BottomNav
      :selected="currentRouteName"
      @update:selected="handleNavSelection"
      class="md:hidden"
    />
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
