
<script setup>
import { ref } from "vue";
import { Motion } from "motion-v";
import { useGameStore } from '@/stores/useGameStore';
import Card from './Card.vue';

const selectedCard = ref(null);

const gameStore = useGameStore();
function play(card) {
  gameStore.playCard(card)
}

const getSuitIcon = (suit) => {
  const icons = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return icons[suit] || suit;
};

const overlap = 50;

function getOffset(index, total) {
  const center = (total - 1) / 2;
  return `${(index - center) * -overlap}%`;
}

function onCardClick(card) {
  if (!gameStore.isCardPlayable(card)) return;

  if (selectedCard.value === card) {
    play(card);
    selectedCard.value = null;
  } else {
    selectedCard.value = card;
  }
}

const getCardFilter = (card) => {
  return gameStore.isCardPlayable(card)
    ? 'grayscale(0%) brightness(100%)'
    : 'grayscale(100%) brightness(50%)';
};
</script>

<template>
  <div class="game-table relative w-full h-full user-select-none">

    <!-- Bot Hand -->
    <div id="bot-hand" class="absolute top-0 left-0 right-2 flex justify-center mt-4 pointer-events-none">
      <div class="relative flex justify-center overflow-visible">
        <div v-for="(card, index) in gameStore.botHand" :key="card.rank + card.suit"
          class="pointer-events-auto w-16 md:w-28 shrink-0"
          :style="{ transform: `translateX(${getOffset(index, gameStore.botHand.length)})` }">

          <Card :card="card" :index="index" :faceUp="false" :clickable="false" :scale="1" />
        </div>
      </div>
    </div>

    <!-- Playground -->
    <div id="playground" class="absolute inset-0 flex gap-2 justify-center items-center">
      <Card v-for="(card, i) in gameStore.table" :key="card.rank + card.suit" :card="card" :index="i" :faceUp="true"
        :clickable="false" :scale="1"
        :show-undo="gameStore.isUndoActive && gameStore.currentLeader === 'player' && i === 0 && gameStore.undoCounter < 3"
        @undo="gameStore.undoLastMove()" />
    </div>

    <!-- Deck + Trump Card -->
    <div class="absolute left-0 md:left-[15%] lg:left-[20%] top-1/2 -translate-y-1/2 z-20
         flex flex-col items-center gap-2
         bg-[#121213] backdrop-blur-sm
         rounded-r-2xl md:rounded-2xl
         pl-1 pr-1 py-5
         border-r md:border border-white/20
         transition-all duration-300 origin-left md:origin-center md:scale-125">

      <!-- Deck -->
      <p class="text-xs text-white/70 me-2 md:me-0 mb-1 font-bold uppercase tracking-wider">Deck</p>
      <div id="deck" class="relative mt-2 ms-1 md:ms-0 w-[74px] h-[110px] md:h-[120px]">
        <Card v-if="gameStore.deck.length > 0" :card="gameStore.deck[0]" :index="0" :faceUp="false" :clickable="false"
          class="absolute inset-0" :style="{ transform: 'translateY(0px)' }" />
        <Card v-if="gameStore.deck.length > 1" :card="gameStore.deck[1]" :index="0" :faceUp="false" :clickable="false"
          class="absolute inset-0" :style="{ transform: 'translateY(-2px)' }" />
        <Card v-if="gameStore.deck.length > 2" :card="gameStore.deck[2]" :index="0" :faceUp="false" :clickable="false"
          class="absolute inset-0" :style="{ transform: 'translateY(-4px)' }" />
        <Card v-if="gameStore.deck.length > 3" :card="gameStore.deck[3]" :index="0" :faceUp="false" :clickable="false"
          class="absolute inset-0" :style="{ transform: 'translateY(-6px)' }" />
        <Card v-if="gameStore.deck.length > 4" :card="gameStore.deck[4]" :index="0" :faceUp="false" :clickable="false"
          class="absolute inset-0" :style="{ transform: 'translateY(-8px)' }" />

        <div v-if="gameStore.deck.length > 0"
          class="absolute inset-0 z-30 me-2 md:me-0 flex items-center justify-center opacity-85 pointer-events-none"
          :style="{ transform: 'translateY(-10px)' }">
          <div class="bg-black text-white text-sm font-bold px-2 py-0.5 rounded border border-white/20 shadow-md">
            {{ gameStore.deck.length }}
          </div>
        </div>
      </div>

      <!-- Trump Card -->
      <div v-if="gameStore.trumpSuit"
        class="flex flex-col w-[74px] h-[110px] md:h-[120px] items-center gap-2 ms-3 mb-6">
        <p class="text-xs text-white/70 font-bold mb-1 uppercase tracking-wider text-center me-4 md:me-3">
          Trump<br />Card
        </p>

        <div id="trumpCard" class="relative w-full h-full flex items-center justify-center me-1 md:me-3">
          <Card v-if="gameStore.trumpCard" :card="gameStore.trumpCard" :index="0" :faceUp="true" :clickable="false"
            class="absolute inset-0" />

          <div v-else
            class="w-full h-[100px] me-2 md:me-0 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5">
            <span class="text-4xl font-bold text-gray-200">
              {{ getSuitIcon(gameStore.trumpSuit) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute right-0 md:right-[15%] lg:right-[20%] top-1/2 -translate-y-1/2 z-20
         flex flex-col items-center gap-2
         bg-[#121213] backdrop-blur-sm
         rounded-l-2xl md:rounded-2xl
         pl-3 pr-1 py-4
         border-l md:border border-white/20
         transition-all duration-300 origin-right md:origin-center md:scale-125">

      <p class="text-xs text-white/70 font-bold mb-3 me-2 uppercase tracking-wider">Bot</p>

      <div class="relative w-[74px] h-[110px] md:h-[120px] md:me-2">
        <Card v-for="(card, i) in gameStore.botPile.slice(0, 5)" :key="'b' + i" :card="card" :index="0" :faceUp="false"
          :clickable="false" class="absolute inset-0" :style="{ transform: `translateY(-${i * 2}px)` }" />
      </div>

      <div class="relative w-full h-[110px] md:h-[120px] mt-2 md:me-2">
        <Card v-for="(card, i) in gameStore.playerPile.slice(0, 5)" :key="'p' + i" :card="card" :index="0"
          :faceUp="false" :clickable="false" class="absolute inset-0"
          :style="{ transform: `translateY(-${i * 2}px)` }" />
      </div>

      <p class="text-xs text-white/70 font-bold me-2 uppercase tracking-wider">You</p>
    </div>
    <div id="player-hand" class="absolute bottom-0 left-0 right-0 flex justify-center mb-4 pointer-events-none">
      <div class="relative flex justify-center overflow-visible">
        <div v-for="(card, index) in gameStore.playerHand" :key="card.rank + card.suit"
          class="pointer-events-auto w-16 md:w-28 will-change-transform transform-gpu shrink-0"
          :class="{ 'selected-card': selectedCard === card }"
          :style="{ transform: `translateX(${getOffset(index, gameStore.playerHand.length)})` }"
          @click="onCardClick(card)">
          <Motion :initial="{
            y: 0,
            scale: 1,
            filter: getCardFilter(card)
          }" :animate="{
            y: selectedCard === card ? -20 : 0,
            scale: selectedCard === card ? 1.05 : 1,
            filter: getCardFilter(card)
          }" :transition="{
              type: 'spring',
              stiffness: 300,
              damping: 20
            }">
            <Card :card="card" :index="index" :faceUp="true" :clickable="true"
              :disabled="!gameStore.isCardPlayable(card)" />
          </Motion>
        </div>
      </div>
    </div>
  </div>
</template>