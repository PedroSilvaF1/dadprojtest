<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-[#121213] text-gray-300 rounded-xl shadow-lg p-6 w-full max-w-sm relative border border-gray-800">

      <!-- Title -->
      <h3 class="text-center text-xl font-bold mb-3">
        Insufficient Coins
      </h3>

      <p class="text-center text-md font-regular">You can't bluff your way out of the entry fee. The Bot doesn't play for charity!</p>

      <!-- Warning Icon -->
      <div class="flex justify-center mb-4">
        <img :src="buyCoinsImg" width="120" height="100" alt="Card Leaving the Game" />
      </div>


      <!-- Buttons -->
      <div class="flex items-center space-x-3 justify-center">

        <!-- Send to the coins-shop route -->
        <button id="buy-coins" @click="buyCoins()" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-gray-600 px-8 py-3 sm:px-6 sm:py-3 rounded-lg
          border-gray-700 border-b-[4px]
          hover:bg-gray-500 hover:border-gray-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-gray-900/50">
          Buy coins
        </button>

        <!-- Close the dialog -->
        <button id="close" @click="$emit('close')" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-8 py-3 sm:px-6 sm:py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          Close
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRouter } from "vue-router";
import buyCoinsImg from '@/assets/images/buy_coins.png';
const router = useRouter();

const buyCoins = async () => {
  router.push("/coins-shop");
};
</script>
