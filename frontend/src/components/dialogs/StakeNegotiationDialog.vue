<template>
  <div v-if="show" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div
      class="bg-[#121213] text-gray-300 rounded-xl shadow-2xl p-6 w-full max-w-2xl relative border border-gray-800 flex flex-col">

      <h3 class="text-xl font-bold text-yellow-500 mb-6 text-center tracking-widest uppercase">Stake Negotiation</h3>

      <div class="flex flex-col md:flex-row gap-6 mb-8">

        <div class="flex-1 bg-black/40 border border-yellow-700/50 rounded-lg p-4 flex flex-col items-center relative">
          <span class="text-yellow-200 font-bold mb-2">YOU</span>

          <div class="mb-2 flex items-center justify-center gap-2">
            <input v-model.number="localStake" type="number" min="0" max="100"
              class="bg-transparent border-none text-center text-5xl font-bold text-white focus:ring-0 focus:outline-none p-0 appearance-none hover:text-yellow-100 transition-colors w-20"
              @input="emitUpdate" />
            <McCoinLine class="w-10 h-10 text-yellow-500 mb-1" />
          </div>

          <div class="w-full px-2">
            <input type="range" v-model.number="localStake" min="3" max="100" step="1" class="w-full range-slider"
              @input="emitUpdate" />
          </div>
        </div>

        <div class="flex items-center justify-center">
          <span class="text-2xl font-black text-gray-600 italic">VS</span>
        </div>

        <div class="flex-1 bg-black/40 border border-gray-700/50 rounded-lg p-4 flex flex-col items-center opacity-80">
          <span class="text-gray-300 font-bold mb-2">{{ opponentName || 'Opponent' }}</span>

          <div class="mb-2 flex items-center justify-center gap-2">
            <input :value="opponentStake" type="number" disabled
              class="bg-transparent border-none text-center text-5xl font-bold text-gray-500 p-0 appearance-none cursor-not-allowed w-20" />
            <McCoinLine class="w-10 h-10 text-gray-600 mb-1" />
          </div>

          <div class="w-full px-2">
            <input type="range" :value="opponentStake" min="3" max="100" disabled
              class="w-full range-slider range-slider-opponent" />
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <button @click="handleConfirm" type="button" class="w-full sm:w-auto flex-1 justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-6 py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          Confirm Stake
        </button>

        <button @click="handleCancel" type="button" class="w-full sm:w-auto flex-1 justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-6 py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          Cancel Match
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { McCoinLine } from '@kalimahapps/vue-icons';

const props = defineProps({
  show: { type: Boolean, required: true },
  opponentName: { type: String, default: "Player 2" },
  opponentStake: { type: Number, default: 3 },
  initialStake: { type: Number, default: 3 }
});

const emit = defineEmits(['confirm', 'cancel', 'update:stake']);

const localStake = ref(props.initialStake);

const validateInput = () => {
  if (localStake.value === "") return;

  if (localStake.value > 100) localStake.value = 100;
  if (localStake.value < 3) localStake.value = 3;
};

const emitUpdate = () => {
  validateInput();
  emit('update:stake', localStake.value);
};

const handleConfirm = () => {
  emit('confirm', localStake.value);
};

const handleCancel = () => {
  emit('cancel');
};

watch(() => props.initialStake, (newVal) => {
  localStake.value = newVal;
});
</script>

<style scoped>
.range-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: #374151;
  outline: none;
  cursor: pointer;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #EAB308;
  border: 2px solid #CA8A04;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
  transition: transform 0.1s;
  margin-top: -8px;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.range-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #EAB308;
  border: 2px solid #CA8A04;
  border-radius: 50%;
  cursor: pointer;
}

.range-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  cursor: pointer;
  background: #374151;
  border-radius: 5px;
}

.range-slider-opponent {
  background: #1F2937;
  cursor: not-allowed;
}

.range-slider-opponent::-webkit-slider-thumb {
  background: #DC2626;
  border: 2px solid #991B1B;
  box-shadow: none;
  cursor: not-allowed;
}

.range-slider-opponent::-moz-range-thumb {
  background: #DC2626;
  border: 2px solid #991B1B;
  cursor: not-allowed;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Remove arrows from number input (Firefox) */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
