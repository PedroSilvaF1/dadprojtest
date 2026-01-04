<template>
  <div class="card"
  :class="[
        { 'cursor-pointer': clickable && !disabled },
        { 'cursor-not-allowed': disabled },
        card.suit
      ]" @click="emitClick" :style="cardStyle">
    <img class="w-16 md:w-24 select-none pointer-events-none" :src="imagePath" alt="card" draggable="false"/>
    <button
      v-if="showUndo"
      @click.stop="emitUndo"
      title="Undo move"
      class="absolute -top-3 -right-3 z-50 bg-gray-500 hover:bg-gray-600 rounded-full p-1 transition-transform hover:scale-110 active:scale-90"
    >
      <img src="/icons/undo.svg" alt="Undo" class="w-8 h-8" />
    </button>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useUserStore } from "@/stores/useUserStore.js";

defineOptions({ name: 'GameCard' })
const props = defineProps({
  card: Object,
  index: Number,
  faceUp: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  },
  scale: {
    type: Number,
    default: 1
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showUndo: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['play', 'undo']);
const userStore = useUserStore();

const imagePath = computed(() => {
  if (!props.faceUp) {
    // Caminho relativo do ficheiro .vue para a pasta assets
    return new URL(`../assets/cards/back/${userStore.activeSkinBack}.png`, import.meta.url).href;
  }
  return new URL(
    `../assets/cards/front/${userStore.activeSkinFront}/${props.card.suit}_${props.card.rank}.png`,
    import.meta.url
  ).href
});

const cardStyle = computed(() => {
  return {
    left: `${props.index * 40}px`,
    transform: `scale(${props.scale})`
  };
});

function emitClick() {
  if (props.clickable && props.faceUp && !props.disabled) {
    emit('play', props.card)
  }
}

function emitUndo() {
  emit('undo');
}
</script>
