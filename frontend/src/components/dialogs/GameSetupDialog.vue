<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-[#121213] text-gray-300 rounded-xl shadow-lg p-6 w-full max-w-md relative border border-gray-800">

      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 class="text-xl font-bold text-white mb-6 text-center tracking-wider">Game Setup</h2>

      <div class="mb-6">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Select Format</label>
        <div class="flex gap-3">
          <button
            @click="selectedFormat = 'match'"
            class="flex-1 py-3 px-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
            :class="selectedFormat === 'match'
              ? 'bg-red-900/20 border-red-600 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
              : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'"
          >
            <span class="font-bold text-sm">Match</span>
            <span class="text-[10px] opacity-70">Series of Games</span>
          </button>

          <button
            @click="selectedFormat = 'single'"
            class="flex-1 py-3 px-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1"
            :class="selectedFormat === 'single'
              ? 'bg-red-900/20 border-red-600 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
              : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'"
          >
            <span class="font-bold text-sm">Single Game</span>
            <span class="text-[10px] opacity-70">Quick Session</span>
          </button>
        </div>
      </div>

      <div class="mb-8">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Game Mode</label>
        <div class="flex gap-3">
          <button
            @click="selectedMode = 3"
            class="flex-1 py-3 px-2 rounded-lg border-2 transition-all"
            :class="selectedMode === 3
              ? 'bg-red-900/20 border-red-600 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
              : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'"
          >
            <span class="font-bold">Bisca de 3</span>
          </button>

          <button
            @click="selectedMode = 9"
            class="flex-1 py-3 px-2 rounded-lg border-2 transition-all relative overflow-hidden"
            :class="selectedMode === 9
              ? 'bg-red-900/20 border-red-600 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.2)]'
              : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'"
          >
            <span class="font-bold relative z-10">Bisca de 9</span>
          </button>
        </div>
      </div>

      <div class="bg-[#1a1a1d] border border-red-900/30 rounded-lg p-3 flex items-center justify-between mb-6 shadow-inner">
        <div class="flex items-center gap-2 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          <span class="font-bold text-sm tracking-wide">Entry Fee</span>
        </div>
        <span v-if="selectedFormat === 'match'" class="font-bold text-red-200 text-lg">3 Coins</span>
        <span v-else class="font-bold text-red-200 text-lg">2 Coins</span>
      </div>

      <button
        @click="handleConfirm"
        class="w-full justify-center cursor-pointer font-bold text-white text-lg uppercase tracking-wider transition-all
        bg-red-600 px-6 py-4 rounded-lg
        border-red-700 border-b-[4px]
        hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
        active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
        shadow-lg shadow-red-900/50"
      >
        Confirm & Start
      </button>

    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'confirm']);

const selectedFormat = ref('match'); // 'match' ou 'single'
const selectedMode = ref(9);

const handleConfirm = () => {
  emit('confirm', {
    format: selectedFormat.value,
    mode: selectedMode.value
  });
};
</script>
