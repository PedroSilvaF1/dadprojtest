<template>
  <div class="table-manager w-full h-full">
    
    <GameTableBot 
      v-if="!gameStore.multiplayerGame?.id || gameStore.isPractice" 
    />

    <GameTableOnline 
      v-else 
    />

  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/useGameStore';
import GameTableBot from './GameTableBot.vue';
import GameTableOnline from './GameTableOnline.vue';

const gameStore = useGameStore();
</script>