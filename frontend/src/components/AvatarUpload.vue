<script setup>
import { ref, computed } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const props = defineProps({
  defaultUrl: {
    type: String,
    default: null
  },
  sizeClass: {
    type: String,
    default: 'w-32 h-32'
  },
  buttonClass: {
    type: String,
    default: 'w-14 h-14'
  },
  iconSize: {
    type: String,
    default: 'w-6 h-6'
  }
});

const emit = defineEmits(['file-selected']);

const fileInput = ref(null);
const previewUrl = ref(null);

const showCropper = ref(false);
const imageToCrop = ref(null);
const cropperRef = ref(null);

// Prioridade: Pré-visualização de novo upload -> Propriedade padrão -> Imagem de fallback
const displayImage = computed(() => {
  if (previewUrl.value) return previewUrl.value;
  if (props.defaultUrl) return props.defaultUrl;
  return '/icons/null_profile.png';
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Emitir ficheiro para elemento pai
    const reader = new FileReader();
    reader.onload = (e) => {
      imageToCrop.value = e.target.result;
      showCropper.value = true;
    };
    reader.readAsDataURL(file);
  }
  // Resetar o valor do input para permitir o re-upload do mesmo ficheiro
  event.target.value = '';
};

const handleCrop = () => {
  const { canvas } = cropperRef.value.getResult();
  if (canvas) {
    canvas.toBlob((blob) => {
      // 1. Criar URL de pré-visualização
      previewUrl.value = URL.createObjectURL(blob);

      // 2. Converter blob para File
      const file = new File([blob], "avatar_cropped.png", { type: "image/png" });

      // 3. Emitir ficheiro para o componente pai
      emit('file-selected', file);

      // 4. Fechar o cropper
      showCropper.value = false;
    }, 'image/png');
  }
};

const cancelCrop = () => {
  showCropper.value = false;
  imageToCrop.value = null;
};

// Expor uma função para limpar a pré-visualização
const clearPreview = () => {
  previewUrl.value = null;
  if (fileInput.value) {
    fileInput.value.value = ''
  };
};

defineExpose({ clearPreview });
</script>
<template>
  <div class="relative">
    <img
      :src="displayImage"
      alt="Avatar"
      :class="[sizeClass, 'rounded-full border-3 border-yellow-500 object-cover bg-black']"
    />

    <button
      type="button"
      @click="triggerFileInput"
      :class="[buttonClass, 'absolute -bottom-1 -right-1 bg-yellow-600 hover:bg-yellow-500 rounded-full flex items-center justify-center border-2 border-black transition-colors z-10']"
    >
      <svg xmlns="http://www.w3.org/2000/svg" :class="[iconSize, 'text-black']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <div v-if="showCropper" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div class="bg-[#1a1a1a] border border-yellow-700/50 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
        <h3 class="text-yellow-100 text-lg font-bold text-center">Adjust Image</h3>

        <div class="overflow-hidden rounded-lg border border-gray-700">
          <Cropper
            ref="cropperRef"
            class="h-64 w-full bg-black"
            :src="imageToCrop"
            :stencil-props="{ aspectRatio: 1/1 }"
          />
        </div>

        <div class="flex gap-3 justify-end mt-2">
          <button
            @click="cancelCrop"
            type="button"
            class="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition font-semibold"
          >
            Cancel
          </button>
          <button
            @click="handleCrop"
            type="button"
            class="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-md transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
