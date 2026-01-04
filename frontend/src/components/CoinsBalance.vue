<script setup>
import {McCoinLine} from "@kalimahapps/vue-icons";
import {useAuthStore} from "@/stores/useAuthStore.js";
import {useUserStore} from "@/stores/useUserStore.js";

const auth = useAuthStore();
const userStore = useUserStore();

// ADIÇÃO: Prop 'custom' com valor padrão false para não afetar os outros sítios
defineProps({
  custom: { type: Boolean, default: false }
});
</script>
<template>
  <div v-if="auth.isAuthenticated" 
       :class="[
           // SE não for custom, usa 'fixed'. SE for custom, usa 'w-fit' para não esticar.
           !custom ? 'fixed top-3 right-3 md:top-6 md:right-10' : 'w-fit',
           'bg-black/50 backdrop-blur-sm border border-yellow-600 rounded-full px-3 md:px-5 py-1.5 md:py-2 flex items-center gap-2 shadow-lg z-50 transition-all duration-300 hover:scale-105'
       ]">
    <McCoinLine class="w-4 h-4 md:w-5 md:h-5 text-yellow-200" />
    <span id="coins" class="font-semibold text-yellow-200 text-sm md:text-lg">{{ userStore.coins }}</span>
  </div>
</template>