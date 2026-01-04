<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useGameStore } from '@/stores/useGameStore';
import { useSocketStore } from '@/stores/socket';
import Card from './Card.vue';
import { Motion } from "motion-v"; 

const gameStore = useGameStore();
const socketStore = useSocketStore();
const selectedCard = ref(null);


// --- FUNÇÃO TRADUTORA ---
const formatCardForFrontend = (serverCard) => {
    if (!serverCard || !serverCard.suit) return { suit: '', rank: '' };
    
    const suitMap = { 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs', 'S': 'spades' };
    
    return {
        rank: serverCard.rank,
        suit: suitMap[serverCard.suit] || serverCard.suit 
    };
};


// 1. Minha Mão
const onlineHand = computed(() => {
    const game = gameStore.multiplayerGame;
    const myId = socketStore.socketUserId;
    if (game && game.hands && myId && game.hands[myId]) {
        return game.hands[myId].map(card => formatCardForFrontend(card));
    }
    return [];
});

// 2. Mesa
const onlineTable = computed(() => {
    const game = gameStore.multiplayerGame;
    if (game && game.currentTrick) {
        return game.currentTrick.map(item => formatCardForFrontend(item.card));
    }
    return [];
});

// 3. Oponente (Costas das cartas)
const opponentCardCount = computed(() => {
    const game = gameStore.multiplayerGame;
    const myId = socketStore.socketUserId;
    if (game && game.hands) {
        const opponentId = Object.keys(game.hands).find(id => id != myId);
        if (opponentId && game.hands[opponentId]) {
            return game.hands[opponentId].length;
        }
    }
    return 0;
});

// 4. Deck Online
const onlineDeckCount = computed(() => {
    return gameStore.multiplayerGame?.deck?.length || 0;
});

// 5. Trunfo Online
const onlineTrump = computed(() => {
    const card = gameStore.multiplayerGame?.trumpCard;
    return card ? formatCardForFrontend(card) : null;
});

const onlineTrumpSuit = computed(() => {
    return onlineTrump.value?.suit || '';
});

const opponentName = computed(() => {
    const game = gameStore.multiplayerGame;
    const myId = socketStore.socketUserId;

    if (game && game.names) {
        // Procura o ID que não é o meu
        const opponentId = Object.keys(game.names).find(id => id != myId);
        // Retorna o nome ou "Oponente" se falhar
        return game.names[opponentId] || 'Oponente';
    }
    return 'A aguardar...';
});

// --- LÓGICA DE JOGO ---

function onCardClick(frontendCard) {
    const game = gameStore.multiplayerGame;
    const myId = socketStore.socketUserId;

    // DEBUG: Ver porque diz que não é a tua vez
    console.log(`[Click] Turno: ${game.currentPlayer} | Eu: ${myId}`);

    // Nota: Usamos != para permitir comparar "5" (string) com 5 (number)
    if (game.currentPlayer != myId) {
        console.warn(`[Click] Turno errado. É vez de ${game.currentPlayer}, sou ${myId}`);
        return; 
    }
    

    // Traduzir de volta para enviar ao servidor
    const suitReverseMap = { 'hearts': 'H', 'diamonds': 'D', 'clubs': 'C', 'spades': 'S' };
    const serverCard = {
        rank: frontendCard.rank,
        suit: suitReverseMap[frontendCard.suit] || frontendCard.suit
    };

    console.log("[TableOnline] Carta formatada para envio:", serverCard); // <--- LOG NOVO

    const isSameCard = selectedCard.value && 
                       selectedCard.value.rank === frontendCard.rank && 
                       selectedCard.value.suit === frontendCard.suit;

    if (isSameCard) {
        // Se cliquei na MESMA carta que já estava selecionada -> JOGAR
        console.log(`[TableOnline] Confirmando jogada... GameID: ${game.id}`);
        
        if (game.id) {
            socketStore.emitPlayCard(game.id, serverCard);
            selectedCard.value = null; // Limpar seleção
        } else {
            console.error("[TableOnline] ERRO: Game ID não encontrado!");
        }
    } else {
        // Se cliquei numa carta nova -> SELECIONAR
        console.log("[TableOnline] Carta selecionada (clique outra vez para jogar)");
        selectedCard.value = frontendCard;
    }
}

// Funções Visuais
const getSuitIcon = (suit) => {
  const icons = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  return icons[suit] || suit;
};

const overlap = 50;
function getOffset(index, total) {
  const center = (total - 1) / 2;
  return `${(index - center) * -overlap}%`;
}

const getCardFilter = (card) => {
    const game = gameStore.multiplayerGame;
    const myId = socketStore.socketUserId;

    // Se não houver jogo ou ID, bloqueia
    if (!game || !game.currentPlayer || !myId) return 'grayscale(100%) brightness(50%)';

    // Comparação com == para aceitar "5" (string) igual a 5 (number)
    const isMyTurn = game.currentPlayer == myId;

    // Se for a minha vez, cor normal. Se não, cinzento.
    return isMyTurn 
        ? 'grayscale(0%) brightness(100%)' 
        : 'grayscale(100%) brightness(50%)';
};
</script>

<template>
  <div class="game-table relative w-full h-full user-select-none">

    <div id="opponent-hand" class="absolute top-0 left-0 right-2 flex justify-center mt-4 pointer-events-none">
      <div class="relative flex justify-center overflow-visible">
        <div v-for="(n, index) in opponentCardCount" :key="index"
          class="pointer-events-auto w-16 md:w-28 shrink-0"
          :style="{ transform: `translateX(${getOffset(index, opponentCardCount)})` }">
          <Card :card="{suit: '', rank: ''}" :index="index" :faceUp="false" :clickable="false" :scale="1" />
        </div>
      </div>
    </div>

    <div id="playground-multi" class="absolute inset-0 flex gap-2 justify-center items-center">
      <Card 
        v-for="(card, i) in onlineTable" 
        :key="i" 
        :card="card" 
        :index="i" 
        :faceUp="true"
        :clickable="false" 
        :scale="1" 
    />
    </div>

    <div class="absolute left-0 md:left-[15%] lg:left-[20%] top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 bg-[#121213] backdrop-blur-sm rounded-r-2xl md:rounded-2xl pl-1 pr-1 py-5 border-r md:border border-white/20 transition-all duration-300 origin-left md:origin-center md:scale-125">
      
      <p class="text-xs text-white/70 me-2 md:me-0 mb-1 font-bold uppercase tracking-wider">Deck</p>
      <div id="deck" class="relative mt-2 ms-1 md:ms-0 w-[74px] h-[110px] md:h-[120px]">
         <Card v-if="onlineDeckCount > 0" :card="{suit:'', rank:''}" :index="0" :faceUp="false" :clickable="false" class="absolute inset-0" style="transform: translateY(0px)" />
        <Card v-if="onlineDeckCount > 1" :card="{suit:'', rank:''}" :index="0" :faceUp="false" :clickable="false" class="absolute inset-0" style="transform: translateY(-2px)" />
        
        <div v-if="onlineDeckCount > 0" class="absolute inset-0 z-30 me-2 md:me-0 flex items-center justify-center opacity-85 pointer-events-none" style="transform: translateY(-10px)">
          <div class="bg-black text-white text-sm font-bold px-2 py-0.5 rounded border border-white/20 shadow-md">
            {{ onlineDeckCount }}
          </div>
        </div>
      </div>

      <div v-if="onlineTrump" class="flex flex-col w-[74px] h-[110px] md:h-[120px] items-center gap-2 ms-3 mb-6">
        <p class="text-xs text-white/70 font-bold mb-1 uppercase tracking-wider text-center me-4 md:me-3">Trump</p>
        <div id="trumpCard" class="relative w-full h-full flex items-center justify-center me-1 md:me-3">
          <Card :card="onlineTrump" :index="0" :faceUp="true" :clickable="false" class="absolute inset-0" />
        </div>
      </div>
    </div>

    <div id="player-hand" class="absolute bottom-0 left-0 right-0 flex justify-center mb-4 pointer-events-none">
      <div class="relative flex justify-center overflow-visible">
        <div v-for="(card, index) in onlineHand" :key="card.rank + card.suit"
          class="pointer-events-auto w-16 md:w-28 will-change-transform transform-gpu shrink-0"
          :class="{ 'selected-card': selectedCard === card }"
          :style="{ transform: `translateX(${getOffset(index, onlineHand.length)})` }"
          @click="onCardClick(card)">
          
          <Motion 
            :initial="{ 
              y: 0, 
              scale: 1, 
              filter: getCardFilter(card) 
              }" 
            :animate="{ 
              y: selectedCard === card ? -20 : 0, 
              scale: selectedCard === card ? 1.05 : 1,
              filter: getCardFilter(card) 
              }" 
            :transition="{ type: 'spring', stiffness: 300, damping: 20 }">
            
            <Card :card="card" :index="index" :faceUp="true" :clickable="true" />
          
          </Motion>
        </div>
      </div>
    </div>

  </div>
</template>