<template>
  <div
    v-if="visible"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
  >
    <div class="relative inline-block">

      <!-- Caixa preta -->
      <div class="bg-black/80 text-white px-6 py-3 font-bold rounded-xl text-lg shadow-lg">
        {{ message }}
      </div>

      <!-- Mão (posição dinâmica acima/abaixo) -->
      <img
        :src="imageSrc"
        :alt="imageAlt"
        width="64"
        class="absolute left-1/2 -translate-x-1/2"
        :style="imageDirection === 'down'
          ? 'top: 100%; margin-top: 4px;'
          : 'bottom: 100%; margin-bottom: 4px;'"
      />

    </div>
  </div>
</template>

<script>
export default {
  props: {
    message: String,
    imageSrc: String,
    imageAlt: String,
    visible: Boolean,
    imageDirection: String
  }
}
</script>
