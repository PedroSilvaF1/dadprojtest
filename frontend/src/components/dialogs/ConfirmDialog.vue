<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-[#121213] text-gray-300 rounded-xl shadow-lg p-6 w-full max-w-sm relative border border-gray-800">

      <p class="text-center text-md font-regular mb-3" v-html="message"></p>

      <div class="flex items-center space-x-3 justify-center">
        <button id="yes" @click="handleConfirm" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-14 py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          Yes
        </button>

        <button id="close" @click="$emit('close')" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-14 py-3 rounded-lg
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
const props = defineProps({
  message: {
    type: String,
    required: false
  },
  action: {
    type: Function,
    required: false
  },
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

const handleConfirm = () => {
  if (props.action) {
    props.action(); // Executa a função da store passada pelo pai
  }
  emit('close'); // Fecha o modal
};
</script>
