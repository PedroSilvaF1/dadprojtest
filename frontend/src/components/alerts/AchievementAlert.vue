<template>
  <div v-if="visible"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
    <div class="relative flex flex-col items-center justify-center">

      <div class="absolute -top-12 flex gap-2 z-20">
        <motion.img
          v-for="n in starCount"
          :key="n"
          src="/icons/star.svg"
          class="w-10 h-10 drop-shadow-md"
          :initial="{ y: 80, opacity: 0, scale: 0.5 }"
          :animate="{ y: 0, opacity: 1, scale: 1, rotate: 360 }"
          :transition="{
            type: 'spring',
            stiffness: 180,
            damping: 12,
            delay: n * 0.15
          }"
        />
      </div>

      <motion.div
        class="bg-black/90 text-white px-10 py-5 rounded-xl shadow-2xl border border-white/10 relative z-10 min-w-[200px]"
        :initial="{ opacity: 0, scale: 0.9 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ duration: 0.3 }"
      >
        <div class="flex flex-col items-center text-center">

          <span class="text-xs font-extrabold uppercase tracking-widest text-red-600 mb-1">
            Achievement
          </span>

          <span class="text-2xl font-bold">
            {{ achievement }}
          </span>

        </div>
      </motion.div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { motion } from 'motion-v';

const props = defineProps({
  message: String,
  achievement: {
    type: String,
    default: ''
  },
  visible: Boolean
});

const starCount = computed(() => {
  if (!props.achievement) return 0;

  const type = props.achievement.toLowerCase();

  if (type.includes('bandeira')) return 4;
  if (type.includes('capote')) return 2;

  return 1;
});
</script>
