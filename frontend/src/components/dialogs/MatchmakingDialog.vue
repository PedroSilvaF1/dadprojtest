<template>
  <div v-if="show" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div
      class="bg-[#121213] text-gray-300 rounded-xl shadow-lg p-8 w-full max-w-sm relative border border-gray-800 flex flex-col items-center justify-center">
      <div class="mb-6 relative">
        <div class="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
        <div
          class="w-16 h-16 border-4 border-t-yellow-500 border-r-yellow-500 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0">
        </div>
      </div>
      <h3 class="text-xl font-bold text-white mb-8" v-html="message || 'Searching for players'"></h3>
      <div class="flex items-center space-x-3 justify-center w-full">
        <button id="cancel" @click="handleCancel" type="button" class="w-full justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-14 py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          Cancel
        </button>
      </div>

    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  message: {
    type: String,
    default: "Searching for players..."
  },
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['cancel']);

const handleCancel = () => {
  emit('cancel'); // Emite o evento para o pai cancelar a busca
};
</script>
<style scoped>
/* Garante a animação caso o Tailwind não tenha o 'animate-spin' configurado */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
