<template>
  <div
    v-if="visible"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
  >
    <div class="relative inline-block">
      <!-- Caixa preta -->
      <div class="bg-black text-white px-6 py-3 font-bold rounded-xl text-lg shadow-lg">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseAlert",
  props: {
    message: String,
    visible: Boolean,
  }
}
</script>
