<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-[#121213] text-gray-300 rounded-xl shadow-lg p-6 w-full max-w-sm relative border border-gray-800">
      <!-- Warning Icon -->
      <div class="flex justify-center mb-4">
        <img :src="leaveGameImg" width="120" alt="Card Leaving the Game" />
      </div>

      <!-- Title -->
      <h3 class="text-center text-lg mb-3">
        Are you sure you want to leave the game?
      </h3>

      <!-- Buttons -->
      <div class="flex items-center space-x-3 justify-center">

        <!-- Leave the Game Button (Se fizeres, não terás lugar no céu >:( )) -->
        <button id="yes-leave" @click="leaveGame()" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-gray-600 px-8 py-3 sm:px-6 sm:py-3 rounded-lg
          border-gray-700 border-b-[4px]
          hover:bg-gray-500 hover:border-gray-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-gray-900/50">
          Yes
        </button>

        <!-- Don't leave the game button -->
        <button id="no-leave" @click="$emit('close')" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-8 py-3 sm:px-6 sm:py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          No
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";
import leaveGameImg from '@/assets/images/leave_game.png';
import { useSoundStore } from "@/stores/useSoundStore";
import { useGameStore } from "@/stores/useGameStore";
import { useSocketStore } from "@/stores/socket";

const router = useRouter();
const soundStore = useSoundStore();
const gameStore = useGameStore();
const socketStore = useSocketStore();

const leaveGame = async () => {
  soundStore.stopAll();
  if (gameStore.multiplayerGame?.id) {
    socketStore.emitLeaveGame(gameStore.multiplayerGame.id);
    gameStore.clearMultiplayerState();
    gameStore.matchOver = true;
  } else {
    gameStore.resetGameState();
  }
  router.push("/game");
};
</script>
