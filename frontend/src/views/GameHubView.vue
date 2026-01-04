<script setup>
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useUserStore } from "@/stores/useUserStore.js";
import GameSetupDialog from "@/components/dialogs/GameSetupDialog.vue";
import { useSocketStore } from "@/stores/socket"; // <--- IMPORTANTE
import { McCoinLine } from '@kalimahapps/vue-icons';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const socketStore = useSocketStore(); // <--- IMPORTANTE: Faltava esta linha!
const showBuyCoins = ref(false);
const showGameSetup = ref(false);

const isPlayButtonDisabled = computed(() => {
  if (!authStore.isAuthenticated) return false;
  return userStore.type !== 'P' || userStore.coins < 3;
});

// Abre o dialog para escolher Bisca 3 ou 9 e entra na fila multiplayer
const startMatch = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  if (userStore.type !== 'P' || userStore.blocked === 1) return;
  if (userStore.coins < 3) {
    showBuyCoins.value = true;
    return;
  }

  showGameSetup.value = true;
};

const onSetupConfirmed = (settings) => {
  showGameSetup.value = false;
  socketStore.emitPlay(settings.mode, settings.format);
};

// Inicia Jogo de Treino (Gratuito)
const startPracticeMatch = () => {
  router.push({ path: '/practice-match' });
}

</script>

<template>
  <GameSetupDialog
    v-if="showGameSetup"
    @close="showGameSetup = false"
    @confirm="onSetupConfirmed"
  />
  <div class="text-center px-5 py-16 flex flex-col justify-center items-center min-h-[80vh]">
    <h1 class="text-4xl md:text-5xl font-extrabold text-yellow-200 mb-4">Time to Play!</h1>
    <p class="text-lg text-gray-300 mb-10">Choose how you want to jump into Bisca.</p>

    <div class="flex flex-col md:flex-row items-stretch justify-center md:gap-10">


      <div class="flex flex-col items-center">
        <button class="bg-black/60 hover:bg-black/80 text-yellow-100 text-xl md:text-2xl font-semibold px-10 md:px-12 py-4 md:py-5
                 rounded-full shadow-lg border border-yellow-700/80 transition-all hover:scale-105 active:scale-95
                 flex items-center justify-center gap-3" @click="startPracticeMatch()">
          <span>Practice Match</span>
        </button>

      <div class="invisible px-4 py-1.5 border border-transparent rounded-lg flex items-center gap-2">
        <span class="text-sm font-semibold tracking-wide uppercase">Entry fee: 2</span>
        <McCoinLine class="w-4 h-4" />
      </div>
      </div>

      <div class="flex flex-col items-center gap-3">
        <button v-if="!authStore.isAuthenticated"
          class="bg-gradient-to-r from-red-700 to-red-900 hover:brightness-110
                  text-yellow-100 text-xl md:text-2xl font-semibold px-10 md:px-12 py-4 md:py-5 rounded-full shadow-xl
                  border border-yellow-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          @click="startMatch()">
          <span>Login to Play</span>
        </button>
        <button v-else-if="isPlayButtonDisabled" class="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 cursor-not-allowed
                  text-yellow-100 text-xl md:text-2xl font-semibold px-10 md:px-12 py-4 md:py-5 rounded-full shadow-xl
                  border border-yellow-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          @click="startMatch()" id="play-now-disabled" disabled>
          <span>Play Now</span>
        </button>
        <button v-else class="bg-gradient-to-r from-red-700 via-red-800 to-red-900 hover:from-red-800 hover:via-red-900 hover:to-black
                  text-yellow-100 text-xl md:text-2xl font-semibold px-10 md:px-12 py-4 md:py-5 rounded-full shadow-xl
                  border border-yellow-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          @click="startMatch()" id="play-now">
          <span v-if="socketStore.inQueue" class="animate-pulse flex items-center gap-2">
            <span>🔍</span> Searching...
          </span>
          <span v-else>Play Now</span>
        </button>

        <div
          class="bg-black border border-yellow-600 rounded-lg px-4 py-1.5 flex items-center gap-2 shadow-md animate-pulse">
          <span class="text-yellow-200 text-sm font-semibold tracking-wide uppercase">Entry fee: 2</span>
          <McCoinLine class="w-4 h-4 text-yellow-400" />
        </div>
      </div>

    </div>
  </div>
</template>
