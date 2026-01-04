<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSocketStore } from '@/stores/socket';
import { useGameStore } from '@/stores/useGameStore';
import { useAuthStore } from '@/stores/useAuthStore';

const router = useRouter();
const socketStore = useSocketStore();
const gameStore = useGameStore();
const authStore = useAuthStore();

// Lista de jogos que vem da Store
const games = computed(() => gameStore.games);

onMounted(() => {
    // Pede a lista de jogos ao servidor assim que abre a página
    socketStore.emitGetGames();
});

const createGame = () => {
    // Cria um jogo de Bisca (9 cartas por defeito)
    socketStore.emitCreateGame('9'); 
};

const joinGame = (gameID) => {
    socketStore.emitJoinGame(gameID);
    // O redirecionamento para o jogo acontece automaticamente 
    // quando o servidor responde com 'game-change' (ver socket.js)
    router.push('/multiplayer');
};

const isMyGame = (game) => {
    return game.player1 === authStore.userId || game.player2 === authStore.userId;
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-yellow-500">Lobby Multiplayer</h1>

      <div class="bg-gray-800 p-6 rounded-lg mb-8 flex justify-between items-center">
        <div>
            <h2 class="text-xl font-bold">Criar Novo Jogo</h2>
            <p class="text-gray-400">Inicia uma partida de Bisca e aguarda um oponente.</p>
        </div>
        <button 
            @click="createGame" 
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
            + Criar Jogo
        </button>
      </div>

      <h2 class="text-xl font-bold mb-4">Jogos Disponíveis</h2>
      
      <div v-if="games.length === 0" class="text-center py-12 bg-gray-800 rounded-lg text-gray-400">
          Não há jogos ativos. Cria um para começar!
      </div>

      <div v-else class="grid gap-4">
        <div v-for="game in games" :key="game.id" class="bg-gray-700 p-4 rounded-lg flex justify-between items-center border-l-4"
             :class="game.status === 'PLAYING' ? 'border-red-500' : 'border-blue-500'">
            
            <div>
                <div class="font-bold text-lg">Jogo #{{ game.id }} (Bisca de {{ game.type }})</div>
                <div class="text-sm text-gray-300">
                    Estado: <span class="font-mono">{{ game.status }}</span>
                </div>
            </div>

            <div class="flex gap-2">
                <button 
                    v-if="isMyGame(game)"
                    @click="router.push('/multiplayer')"
                    class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
                >
                    Voltar ao Jogo
                </button>

                <button 
                    v-else-if="game.status === 'PENDING' && !isMyGame(game)"
                    @click="joinGame(game.id)"
                    class="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-500 text-black font-bold"
                >
                    Entrar (Join)
                </button>

                <div v-else-if="game.status === 'PLAYING'" class="text-red-400 font-bold px-4 py-2">
                    A Decorrer
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>