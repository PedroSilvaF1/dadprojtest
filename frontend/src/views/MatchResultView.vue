<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/useGameStore';

const gameStore = useGameStore();
const router = useRouter();

const stats = computed(() => gameStore.matchStats);
const myName = computed(() => gameStore.multiplayerPlayerName || 'Player');
const opponentName = computed(() => gameStore.multiplayerOpponentName || 'Bot');
const selectedGameIndex = ref(0);

onMounted(() => {
  // para dar debug, comenta este o código e faz apenas router.push
  if (!gameStore.matchOver && gameStore.playerMarks === 0 && gameStore.botMarks === 0) {
      router.push('/');
  }

  // Selecionar automaticamente o último jogo
  if (gamesList.value.length > 0) {
    selectedGameIndex.value = gamesList.value.length - 1;
  }
});

// compute de jogos disponiveis
const gamesList = computed(() => {
  if (!stats.value.history) return [];
  return stats.value.history.map((game, index) => ({
    label: `Game ${game.gameNumber}`,
    value: index
  }));
});

// compute das tricks de cada jogo para aparecer depois de selecionar no dropdown
const activeGameTricks = computed(() => {
  if (!stats.value.history || stats.value.history.length === 0) return [];
  // Verificar se o index tá fora e não dá para selecionar
  if (selectedGameIndex.value >= stats.value.history.length) return [];

  return stats.value.history[selectedGameIndex.value].tricks;
});

const getSuitIcon = (suit) => {
  const icons = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return icons[suit] || suit;
};

const getSuitColor = (suit) => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-400' : 'text-gray-200';
};

const getAchievementLabel = (points) => {
  if (points === 120) return 'Bandeira'; // 4 marks
  if (points >= 91) return 'Capote';     // 2 marks
  if (points >= 61) return 'Risca';      // 1 mark
  return 'Draw';
}

const activeGameResult = computed(() => {
  if (!stats.value.history || !stats.value.history[selectedGameIndex.value]) {
    return {
      winner: '-',
      achievement: '-',
      winnerColor: 'text-gray-200'
    };
  }

  const game = stats.value.history[selectedGameIndex.value];
  const pPoints = game.playerPoints;
  const bPoints = game.botPoints;

  if (pPoints > bPoints) {
    return {
      winner: myName.value,
      achievement: getAchievementLabel(pPoints),
      winnerColor: 'text-green-400'
    };
  } else if (bPoints > pPoints) {
    return {
      winner: opponentName.value,
      achievement: getAchievementLabel(bPoints),
      winnerColor: 'text-red-300'
    };
  } else {
    return {
      winner: 'Draw',
      achievement: 'None',
      winnerColor: 'text-yellow-400'
    };
  }
});

const handlePlayAgain = () => {
  gameStore.resetMatchState();
  router.push('/match');
};

const handleExit = () => {
  gameStore.resetMatchState();
  router.push('/');
};
</script>

<template>
  <div
    class="w-screen h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-transparent to-black/30">

    <div class="flex flex-col items-center justify-center h-full animate-fade-in z-10 w-full max-w-4xl">

      <h1 class="text-5xl font-bold mb-4 text-green-50 tracking-wide uppercase drop-shadow-lg text-shadow">
        {{ stats.resultado }}
      </h1>

      <div class="flex flex-row items-center justify-center mb-6 space-x-8">
        <div class="bg-[#121213] border-2 border-gray-800 rounded-lg px-8 py-4 text-center shadow-xl backdrop-blur-sm">
          <div class="text-sm text-gray-200 uppercase tracking-wider mb-1 font-semibold">{{ myName }}</div>
          <div class="text-4xl font-bold text-white drop-shadow-md">{{ stats.gamesWon }}</div>
        </div>

        <div class="text-2xl font-black text-green-50 italic">VS</div>

        <div class="bg-[#121213] border-2 border-gray-800 rounded-lg px-8 py-4 text-center shadow-xl backdrop-blur-sm">
          <div class="text-sm text-gray-200 uppercase tracking-wider mb-1 font-semibold">{{ opponentName }}</div>
          <div class="text-4xl font-bold text-red-300 drop-shadow-md">{{ stats.gamesLost }}</div>
        </div>
      </div>

      <div class="flex flex-row items-center justify-center mb-6 space-x-6">
        <div class="bg-[#121213] rounded-lg px-6 py-2 text-center border border-gray-800 shadow-lg">
          <div class="text-xs text-gray-400 font-medium uppercase">Time</div>
          <div class="text-lg font-bold text-green-50">{{ stats.time }}</div>
        </div>
        <div class="bg-[#121213] rounded-lg px-6 py-2 text-center border border-gray-800 shadow-lg">
          <div class="text-xs text-gray-400 font-medium uppercase">Reward</div>
          <div id="reward-amount" class="text-lg font-bold text-yellow-400">{{ stats.reward }}</div>
        </div>
      </div>

      <div class="w-full max-w-lg bg-[#121213] border border-gray-800 rounded-lg p-4 mb-6 flex flex-col h-56">

        <div class="flex flex-row items-center justify-between mb-2 border-b border-gray-800 pb-2">
          <h3 class="text-gray-200 text-sm font-bold uppercase">Game Breakdown</h3>
          <div class="relative">
            <select v-model="selectedGameIndex"
              class="appearance-none bg-gray-900 text-gray-100 text-xs font-bold py-1 px-3 pr-8 rounded border border-gray-700 focus:outline-none focus:border-gray-500 cursor-pointer hover:bg-gray-800 transition">
              <option v-for="game in gamesList" :key="game.value" :value="game.value">
                {{ game.label }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <div class="flex flex-row justify-between mx-6 mb-2 pt-2 border-b border-gray-800/50 pb-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 uppercase font-bold">Winner</span>
              <span :class="['text-sm font-bold', activeGameResult.winnerColor]">
                {{ activeGameResult.winner }}
              </span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs text-gray-500 uppercase font-bold">Achievement</span>
              <span class="text-sm font-bold text-gray-200">
                {{ activeGameResult.achievement }}
              </span>
            </div>
          </div>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-xs text-gray-500 uppercase border-b border-gray-900">
                <th class="py-1 text-center">#</th>
                <th class="py-1 text-center">{{ myName }}</th>
                <th class="py-1 text-center">{{ opponentName }}</th>
                <th class="py-1 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trick in activeGameTricks" :key="trick.trickNumber"
                class="text-sm border-b border-gray-900/50 hover:bg-gray-900/30 transition">

                <td class="py-2 text-center text-gray-500">{{ trick.trickNumber }}</td>

                <td class="py-2">
                  <div class="flex items-center justify-center gap-2">
                    <span :class="['font-bold text-lg', getSuitColor(trick.playerCard.suit)]">
                      {{ trick.playerCard.rank }}{{ getSuitIcon(trick.playerCard.suit) }}
                    </span>
                    <img v-if="trick.winner === 'player'" src="/icons/crown_gold.svg" alt="winner" class="w-5 h-5 mb-1" />
                  </div>
                </td>

                <td class="py-2">
                  <div class="flex items-center justify-center gap-2">
                    <span :class="['font-bold text-lg', getSuitColor(trick.botCard.suit)]">
                      {{ trick.botCard.rank }}{{ getSuitIcon(trick.botCard.suit) }}
                    </span>
                    <img v-if="trick.winner === 'bot'" src="/icons/crown_gold.svg" alt="winner" class="w-5 h-5 mb-1" />
                  </div>
                </td>

                <td class="py-2 text-right text-gray-100 font-mono">
                  {{ trick.points }}
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!activeGameTricks || activeGameTricks.length === 0" class="text-center text-gray-500 mt-4 text-sm">
            No history available for this game.
          </div>
        </div>
      </div>

      <div class="flex flex-row space-x-4 w-full px-3 max-w-lg">
        <button id="btn_playagain" type="button" @click="handlePlayAgain"
          class="w-full sm:w-auto justify-center cursor-pointer font-bold transition bg-yellow-600 px-8 py-3 sm:px-6 sm:py-2 rounded-lg border-yellow-700
          border-b-[4px]
          hover:brightness-110 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed">
          Play Again
        </button>
        <button id="btn_exit" type="button" @click="handleExit"
          class="w-full sm:w-auto justify-center cursor-pointer font-bold transition bg-red-600 px-8 py-3 sm:px-6 sm:py-2 rounded-lg border-red-700
          border-b-[4px]
          hover:brightness-110 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed">
          Exit
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 50, 0, 0.3);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(34, 197, 94, 0.4);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 94, 0.6);
}
</style>
