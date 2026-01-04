<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { useGameStore } from "@/stores/useGameStore";
import { useSocketStore } from "@/stores/socket";
import { useShopStore } from "@/stores/useShopStore";

import PlayerGameStat from '@/components/PlayerGameStat.vue';
import TurnAlert from '@/components/alerts/TurnAlert.vue';
import CoinsBalance from "@/components/CoinsBalance.vue";
import SettingsDialog from "@/components/dialogs/SettingsDialog.vue";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const gameStore = useGameStore();
const socketStore = useSocketStore();
const shopStore = useShopStore();

const showSettings = ref(false);
const turnTime = ref(20);
let timerInterval = null;

const game = computed(() => gameStore.multiplayerGame);

// ID CORRIGIDO: Usa o ID do socket e força String para comparações seguras
const myID = computed(() => socketStore.socketUserId);

onMounted(() => {
    if (game.value?.status === 'FINISHED') gameStore.clearMultiplayerState();
    startLocalTimer();
});

onUnmounted(() => {
    if(timerInterval) clearInterval(timerInterval);
});

// Lógica de Comparação (Forçando String para evitar erros 5 vs "5")
const iamP1 = computed(() => String(game.value?.player1) === String(myID.value));
const opponentID = computed(() => iamP1.value ? game.value?.player2 : game.value?.player1);

const myStats = computed(() => ({
    name: userStore.nickname || 'Eu',
    points: game.value?.points?.[myID.value] || 0,
    marks: iamP1.value ? (game.value?.player1_marks || 0) : (game.value?.player2_marks || 0),
    avatar: userStore.activeAvatar ? shopStore.getAvatarPreview(userStore.activeAvatar) : (userStore.avatar || '/icons/null_profile.png')
}));

const opponentStats = computed(() => ({
    name: 'Oponente',
    points: game.value?.points?.[opponentID.value] || 0,
    marks: iamP1.value ? (game.value?.player2_marks || 0) : (game.value?.player1_marks || 0),
    avatar: '/icons/bot.jpg'
}));

// Mão do Jogador (Procura por ID number ou string)
const myHand = computed(() => {
    if (!game.value?.hands) return [];
    return game.value.hands[String(myID.value)] || game.value.hands[myID.value] || [];
});

const isMyTurn = computed(() => String(game.value?.currentPlayer) === String(myID.value));

// Imagens Seguras
const cardImages = import.meta.glob('@/assets/cards/front/white/*.png', { eager: true });
const backImageModule = import.meta.glob('@/assets/cards/back/*.png', { eager: true });
const backValues = Object.values(backImageModule);
const deckImage = backValues.length > 0 ? backValues[0].default : ''; 

const getCardImage = (card) => {
    if (!card || !card.suit || !card.rank) return '';
    const suitMap = { 'H': 'hearts', 'h': 'hearts', 'D': 'diamonds', 'd': 'diamonds', 'C': 'clubs', 'c': 'clubs', 'S': 'spades', 's': 'spades' };
    const suit = suitMap[card.suit] || card.suit.toLowerCase();
    const rank = card.rank.toString().toUpperCase();
    const path = `/src/assets/cards/front/white/${suit}_${rank}.png`;
    return cardImages[path] ? cardImages[path].default : '';
};

// Mensagens
const turnMessage = computed(() => {
    if (game.value?.status === 'FINISHED') {
        if(game.value.winner === 'DRAW') return "Empate!";
        return String(game.value.winner) === String(myID.value) ? "Vitória!" : "Derrota!";
    }
    return isMyTurn.value ? "A TUA VEZ!" : "VEZ DO OPONENTE";
});

watch(() => game.value?.currentPlayer, () => {
    turnTime.value = 20;
    startLocalTimer();
});

const startLocalTimer = () => {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if(turnTime.value > 0 && game.value?.status === 'PLAYING') turnTime.value--;
    }, 1000);
};

const playCard = (card) => {
    // Se não é minha vez OU se a mesa já tem 2 cartas, não faz nada
    if (!isMyTurn.value || game.value.currentTrick.length >= 2) return; 
    
    socketStore.emitPlayCard(game.value.id, card);
};
const leaveGame = () => {
    if(confirm("Sair do jogo?")) {
        socketStore.emitLeaveGame(game.value.id);
        gameStore.clearMultiplayerState();
        router.push('/game');
    }
};

const toggleSettings = () => showSettings.value = !showSettings.value;
const timerProgress = computed(() => ((20 - turnTime.value) / 20) * 100);
const timerColor = computed(() => turnTime.value <= 5 ? '#EF4444' : turnTime.value <= 10 ? '#EAB308' : '#22C55E');
</script>

<template>
  <div v-if="game && game.id" class="relative w-screen h-[100dvh] overflow-hidden bg-[#0e4918]">

    <button @click="leaveGame" class="absolute top-4 left-4 z-50 bg-red-600 p-2 rounded-lg border-b-4 border-red-800 hover:brightness-110 shadow-lg"><img src="/icons/exit_path.svg" class="w-6 h-6" /></button>
    <button @click="toggleSettings" class="absolute top-4 right-4 z-50 bg-red-600 p-2 rounded-lg border-b-4 border-red-800 hover:brightness-110 shadow-lg"><img src="/icons/settings.svg" class="w-6 h-6" /></button>
    <SettingsDialog v-if="showSettings" @close="showSettings = false"/>

    <div class="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <TurnAlert 
            :visible="true" 
            :message="turnMessage" 
            :image-src="isMyTurn ? '/icons/clock.png' : '/icons/wait.png'"
            :image-direction="isMyTurn ? 'left' : 'right'"
        />
    </div>

    <div class="flex flex-col items-center justify-between w-full h-full pointer-events-auto relative py-4">
      
      <PlayerGameStat id="opponent"
        :playerName="opponentStats.name"
        :currentPlayer="!isMyTurn ? 'bot' : ''" 
        :gamePoints="opponentStats.points"
        :photo-path="opponentStats.avatar"
        :marks="opponentStats.marks"
        class="mt-2 scale-90 origin-top" 
      />

      <div class="flex-1 w-full flex items-center justify-center relative my-4">
         
         <div class="absolute left-4 md:left-20 flex flex-col items-center scale-75 md:scale-100 origin-left">
             <div v-if="game.trumpCard" class="relative mb-2 transition-all">
                 <img :src="getCardImage(game.trumpCard)" class="w-20 md:w-24 shadow-xl rounded rotate-90" />
             </div>
             <div v-if="game.deck.length > 0" class="relative -mt-12 w-20 md:w-24 h-28 md:h-36 shadow-xl rounded">
                <img v-if="deckImage" :src="deckImage" class="w-full h-full rounded border-2 border-white"/>
                <div v-else class="w-full h-full bg-blue-900 border-2 border-white flex items-center justify-center text-white font-bold">{{ game.deck.length }}</div>
             </div>
         </div>

         <div class="flex gap-4 md:gap-8 items-center justify-center z-10">
             <div v-for="(play, i) in game.currentTrick" :key="i" class="transform transition-all duration-300 animate-in zoom-in fade-in slide-in-from-bottom-4">
                 <img :src="getCardImage(play.card)" class="w-24 md:w-32 shadow-2xl rounded-lg border border-black/20" />
             </div>
         </div>
      </div>

      <div class="relative w-full flex flex-col items-center mb-2">
        
        <div class="absolute bottom-[100%] flex justify-center -space-x-6 md:-space-x-8 w-full px-4 overflow-visible z-30 mb-4">
            <div v-for="(card, i) in myHand" :key="i" 
                 class="relative transition-all duration-200 hover:-translate-y-8 hover:z-50 cursor-pointer transform hover:scale-110"
                 @click="playCard(card)">
                <img :src="getCardImage(card)" class="w-24 md:w-32 shadow-lg rounded-lg border border-gray-800 bg-white" :class="{'brightness-50': !isMyTurn}" />
            </div>
        </div>

        <div v-if="game.status === 'PLAYING'" class="absolute top-1/2 -left-[60px] md:-left-[100px] -translate-y-1/2 scale-75 z-40 grid place-content-center rounded-full shadow-2xl w-[90px] h-[90px]"
             :style="{ background: `conic-gradient(#D7D7D7 ${timerProgress}%, ${timerColor} 0)` }">
          <div class="flex items-center justify-center rounded-full bg-gray-900 w-[75px] h-[75px]">
              <span class="text-3xl font-bold text-white">{{ turnTime }}</span>
          </div>
        </div>

        <PlayerGameStat id="player"
          :playerName="myStats.name"
          :photo-path="myStats.avatar"
          :currentPlayer="isMyTurn ? 'player' : ''"
          :gamePoints="myStats.points"
          :marks="myStats.marks"
        />
        
        <div class="absolute top-1/2 -right-[50px] md:-right-[80px] -translate-y-4 z-40 scale-75 md:scale-100">
           <CoinsBalance custom/>
        </div>
      </div>
    </div>
  </div>
</template>