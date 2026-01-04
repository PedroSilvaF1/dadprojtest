<script setup>
import {ref, onMounted, onUnmounted, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router"
import GameTable from '@/components/GameTable.vue';
import GameMenuDialog from '@/components/dialogs/GameMenuDialog.vue';
import SettingsDialog from "@/components/dialogs/SettingsDialog.vue";
import PlayerGameStat from '@/components/PlayerGameStat.vue';
import TurnAlert from '@/components/alerts/TurnAlert.vue';
import AchievementAlert from '@/components/alerts/AchievementAlert.vue'
import Alert from "@/components/alerts/Alert.vue";
import { useAlertStore } from '@/stores/useAlertStore';
import { useGameStore, TURN_LIMIT } from '@/stores/useGameStore';
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useShopStore } from "@/stores/useShopStore";
import CoinsBalance from "@/components/CoinsBalance.vue";
import { useSocketStore } from '@/stores/socket';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const gameStore = useGameStore();
const alertStore = useAlertStore();
const shopStore = useShopStore();
const userStore = useUserStore();
const showMenu = ref(false);
const showSettings = ref(false);
const socketStore = useSocketStore();


const getFullPhotoUrl = (path) => {
    if (!path) return '/icons/null_profile.png';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const apiBase = import.meta.env.VITE_API_DOMAIN || 'http://localhost:8000';
    return `${apiBase}/storage/${path}`;
};

const myId = computed(() => String(socketStore.socketUserId || userStore.id || authStore.user?.id));
const opponentId = computed(() => {
  const game = gameStore.multiplayerGame;
  if (!game?.id || !game.player1 || !game.player2) return null;
  return String(game.player1) === myId.value ? String(game.player2) : String(game.player1);
});

const opponentName = computed(() => {
    if (gameStore.multiplayerGame && gameStore.multiplayerGame.names) {
        const names = gameStore.multiplayerGame.names;
        const opponentKey = opponentId.value || Object.keys(names).find(id => String(id) !== myId.value);
        
        console.log("🔍 [DEBUG NAMES] Lista:", JSON.parse(JSON.stringify(names)), "| Sou:", myId.value);
        return names[opponentKey] || 'Oponente';
    }
    return 'Bot';
});

const opponentPhoto = computed(() => {
    if (gameStore.multiplayerGame && gameStore.multiplayerGame.photos) {
        const photos = gameStore.multiplayerGame.photos;
        const opponentKey = opponentId.value || Object.keys(photos).find(id => String(id) !== myId.value);
        const photoPath = photos[opponentKey];
        
        console.log("🔍 [DEBUG PHOTO] Path cru:", photoPath);
        return photoPath ? getFullPhotoUrl(photoPath) : '/icons/null_profile.png';
    }
    return '/icons/bot.jpg';
});

const multiplayerTurnTime = ref(TURN_LIMIT);
let multiplayerTimerId = null;

const isMultiplayerActive = computed(() => !!gameStore.multiplayerGame?.id);
const isMyTurnMultiplayer = computed(() => String(gameStore.multiplayerGame?.currentPlayer) === myId.value);
const activeCurrentPlayer = computed(() => {
  if (isMultiplayerActive.value) return isMyTurnMultiplayer.value ? 'player' : 'bot';
  return gameStore.currentPlayer;
});
const myPoints = computed(() => (
  isMultiplayerActive.value ? (gameStore.multiplayerGame.points?.[myId.value] || 0) : gameStore.playerPoints
));
const opponentPoints = computed(() => (
  isMultiplayerActive.value ? (gameStore.multiplayerGame.points?.[opponentId.value] || 0) : gameStore.botPoints
));
const multiplayerMarks = computed(() => {
  if (!isMultiplayerActive.value) {
    return { my: 0, opponent: 0 };
  }
  const game = gameStore.multiplayerGame;
  const p1Marks = game?.player1_marks || 0;
  const p2Marks = game?.player2_marks || 0;
  if (String(game?.player1) === myId.value) {
    return { my: p1Marks, opponent: p2Marks };
  }
  return { my: p2Marks, opponent: p1Marks };
});

const myMarks = computed(() => (
  isMultiplayerActive.value ? multiplayerMarks.value.my : gameStore.playerMarks
));
const opponentMarks = computed(() => (
  isMultiplayerActive.value ? multiplayerMarks.value.opponent : gameStore.botMarks
));

const startMultiplayerTimer = () => {
  if (multiplayerTimerId) clearInterval(multiplayerTimerId);
  multiplayerTurnTime.value = TURN_LIMIT;
  multiplayerTimerId = setInterval(() => {
    if (multiplayerTurnTime.value > 0 && gameStore.multiplayerGame?.status === 'PLAYING') {
      multiplayerTurnTime.value--;
    }
  }, 1000);
};

watch(() => gameStore.multiplayerGame?.currentPlayer, () => {
  if (isMultiplayerActive.value) {
    startMultiplayerTimer();
  }
});

onMounted(async () => {
  if (router.currentRoute.value.path === '/practice-match') { // Nota: ajustei router.path para router.currentRoute.value.path se usares Vue Router 4
    gameStore.isPractice = true;
  } else {
    gameStore.isPractice = false;
  }

  if (!userStore.nickname && authStore.isAuthenticated) {
    await userStore.fetchProfile();
  }

  if (route.path === '/multiplayer') {
    if (!isMultiplayerActive.value) {
      router.push('/game');
      return;
    }
    startMultiplayerTimer();
    console.log("Modo Multiplayer detetado. Ignorando lógica offline.");
    return;
  }

  if (!isMultiplayerActive.value && !gameStore.matchOver && gameStore.gameNum === 1 && gameStore.playerMarks === 0) {
    console.log("Iniciando modo Single Player (Bot)...");
    const modeParam = parseInt(route.query.mode) || 9;
    const formatParam = route.query.format || 'match';

    await gameStore.startNewMatch({
      mode: modeParam,
      format: formatParam
    });
  } else {
    console.log("Modo Multiplayer detetado. Ignorando lógica offline.");
  }
});

onUnmounted(() => {
  console.log("Leaving the game...");
  if (multiplayerTimerId) clearInterval(multiplayerTimerId);
  gameStore.stopAllTimers();
  if (!gameStore.matchOver && gameStore.currentMatchId && authStore.isAuthenticated) {
    const payload = gameStore.endGamePayload();
    userStore.editMatch(gameStore.currentMatchId, payload);
    gameStore.resetGameState();
    gameStore.resetMatchState();
  }
});

const activeTurnTime = computed(() => (
  isMultiplayerActive.value ? multiplayerTurnTime.value : gameStore.turnTime
));

const timerProgress = computed(() => {
  const maxTime = TURN_LIMIT;
  const current = activeTurnTime.value;

  // Calcular a percentagem de preenchimento da cor cizenta
  // Quando é 120s, o resultado será 0% (Full Color)
  // Quando é 0s, o resultado será 100% (Grey Color)
  return ((maxTime - current) / maxTime) * 100;
});

const timerColor = computed(() => {
  const t = activeTurnTime.value;
  if (t <= 5) return '#EF4444'; // Vermelho (Danger)
  if (t <= 10) return '#EAB308'; // Amarelo (Warning)
  return '#22C55E'; // Verde (Safe)
});



const playerPhoto = computed(() => {
  if (gameStore.isPractice) {
    return '/icons/null_profile.png';
  }

  if (userStore.activeAvatar) {
    return shopStore.getAvatarPreview(userStore.activeAvatar);
  }

  if (userStore.avatar) {
    return userStore.avatar;
  }

  return '/icons/null_profile.png';
});




// Para motivos de teste do matchResult
const handleSimulate = () => {
  gameStore.simulateEndMatchScenario();
}

const handleSimulateCapote = () => {
  gameStore.simulateEndMatchCapoteScenario();
}

const handleSimulateBandeira = () => {
  gameStore.simulateEndMatchBandeiraScenario();
}

const handleTestAchievement = (achievement) => {
  gameStore.simulateEndGameAchievement(achievement);
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};
</script>
<template>
  <div class="relative w-screen h-[100dvh] overflow-hidden">

    <!-- Teste do Match result com o test user seeder-->
    <button
      v-if="userStore.nickname === 'BiscaTester'"
      id="match-result-test"
      @click="handleSimulate"
      type="button"
      class="absolute top-4 left-16 cursor-pointer font-bold transition bg-purple-600 px-3 py-1 rounded-lg border-purple-800
        border-b-[4px] text-white text-xs uppercase tracking-wider shadow-lg z-50
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      Match Result Test
    </button>

    <button
      v-if="userStore.nickname === 'BiscaTester'"
      id="match-result-capote-test"
      @click="handleSimulateCapote"
      type="button"
      class="absolute top-12 left-16 cursor-pointer font-bold transition bg-purple-600 px-3 py-1 rounded-lg border-purple-800
        border-b-[4px] text-white text-xs uppercase tracking-wider shadow-lg z-50
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      Match Capote Result Test
    </button>

    <button
      v-if="userStore.nickname === 'BiscaTester'"
      id="match-result-bandeira-test"
      @click="handleSimulateBandeira"
      type="button"
      class="absolute top-20 left-16 cursor-pointer font-bold transition bg-purple-600 px-3 py-1 rounded-lg border-purple-800
        border-b-[4px] text-white text-xs uppercase tracking-wider shadow-lg z-50
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      Match Bandeira Result Test
    </button>

    <button
      v-if="userStore.nickname === 'BiscaTester'"
      id="achievement-risca-test"
      @click="handleTestAchievement('Risca')"
      type="button"
      class="absolute top-28 left-16 cursor-pointer font-bold transition bg-purple-600 px-3 py-1 rounded-lg border-purple-800
        border-b-[4px] text-white text-xs uppercase tracking-wider shadow-lg z-50
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      Test Risca Achievement Alert
    </button>
    <button
      v-if="userStore.nickname === 'BiscaTester'"
      id="achievement-capote-test"
      @click="handleTestAchievement('Capote')"
      type="button"
      class="absolute top-36 left-16 cursor-pointer font-bold transition bg-purple-600 px-3 py-1 rounded-lg border-purple-800
        border-b-[4px] text-white text-xs uppercase tracking-wider shadow-lg z-50
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      Test Capote Achievement Alert
    </button>
    <button
      v-if="userStore.nickname === 'BiscaTester'"
      id="achievement-bandeira-test"
      @click="handleTestAchievement('Bandeira')"
      type="button"
      class="absolute top-[175px] left-16 cursor-pointer font-bold transition bg-purple-600 px-3 py-1 rounded-lg border-purple-800
        border-b-[4px] text-white text-xs uppercase tracking-wider shadow-lg z-50
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      Test Bandeira Achievement Alert
    </button>

    <!-- Botão de saida -->
    <button
      @click="toggleMenu"
      type="button"
      class="absolute top-4 left-4 cursor-pointer font-bold transition bg-red-600 px-1 py-1 rounded-lg border-red-700
        border-b-[4px]
        hover:brightness-110 hover:-translate-y-[1px] md:scale-150 md:ms-4 md:mt-4
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      <img src="/icons/exit_path.svg" alt="menu" class="w-8 h-8" />
    </button>

    <button
      @click="toggleSettings"
      type="button"
      class="absolute top-4 right-4 cursor-pointer font-bold transition bg-red-600 px-1 py-1 rounded-lg border-red-700
        border-b-[4px]
        md:scale-150 md:me-4 md:mt-4
        hover:brightness-110 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
    >
      <img src="/icons/settings.svg" alt="settings" class="w-8 h-8" />
    </button>

    <!-- Dialog de saida -->
    <GameMenuDialog v-if="showMenu" @close="showMenu = false"/>

    <!-- Dialog das Settings -->
    <SettingsDialog v-if="showSettings" @close="showSettings = false"/>

    <!-- Conteúdo principal centrado -->
    <div class="flex flex-col items-center justify-center w-full h-full pointer-events-auto">
      <TurnAlert
        :image-src="alertStore.imageSrc"
        :image-alt="alertStore.imageAlt"
        :message="alertStore.message"
        :visible="alertStore.turnAlertVisible"
        :image-direction="alertStore.imageDirection"
      />
      <AchievementAlert
        :message="alertStore.message"
        :achievement="alertStore.achievement"
        :visible="alertStore.achievementAlertVisible"
      />
      <Alert
        :message="alertStore.message"
        :visible="alertStore.gameAlertVisible"
      />
      <PlayerGameStat
        class="mt-4"
        id="bot"
        :playerName="opponentName"
        :currentPlayer="activeCurrentPlayer"
        :gamePoints="opponentPoints"
        :photo-path="opponentPhoto"
        :marks="opponentMarks"
      />

      <GameTable />

      <div class="relative mb-4">
        <div
          v-if="!gameStore.gameOver && !gameStore.matchOver"
          class="absolute top-1/2 -left-[105px] -translate-y-1/2 scale-50 sm:scale-75 z-40
               grid aspect-square size-[90px] place-content-center rounded-full shadow-2xl"
          :style="{ background: `conic-gradient(#D7D7D7 ${timerProgress}%, ${timerColor} 0)` }"
        >
          <div class="flex aspect-square size-[75px] items-center justify-center rounded-full bg-gray-900">
            <div class="flex flex-col items-center">
              <span class="text-5xl font-bold tabular-nums text-white drop-shadow-md">
                {{ activeTurnTime }}
              </span>
            </div>
          </div>
        </div>

        <PlayerGameStat
          id="player"
          :playerName="gameStore.isPractice ? 'Guest' : (userStore.nickname || 'You')"
          :photo-path="playerPhoto"
          :currentPlayer="activeCurrentPlayer"
          :gamePoints="myPoints"
          :marks="myMarks"
        />
        <div class="absolute top-1/2 -right-[90px] -translate-y-4 z-40">
          <CoinsBalance custom/>
        </div>
      </div>
    </div>
  </div>
</template>
