<template>
  <div :class="[
    'rounded-full flex items-center gap-2 md:gap-4 shadow-lg transition-all duration-300',
    id === currentPlayer ? 'bg-yellow-500 shadow-yellow-300 scale-105' : 'bg-red-600'
  ]">
    <div class="relative">
      <img :src="photoPath" alt="avatar" class="w-10 h-10 md:w-16 md:h-16 rounded-full shadow-lg" />
    </div>

    <div class="flex flex-col items-start gap-1 md:gap-1.5">
      <h3 class="text-white font-bold text-xs md:text-base whitespace-nowrap">{{ playerName }}</h3>

      <div class="flex gap-3 md:gap-4 me-5 md:me-6">
        <svg v-for="i in 4" :key="i" viewBox="0 0 20 20" class="overflow-visible w-[7px] h-[7px] md:w-[11px] md:h-[11px]">
          <circle
            cx="10"
            cy="10"
            r="7"
            :fill="i <= marks ? 'white' : 'none'"
            :stroke="i <= marks ? 'none' : 'white'"
            stroke-width="3"
          />
        </svg>
      </div>
    </div>

    <div class="w-10 h-10 md:w-16 md:h-16 rounded-full bg-[#121213] flex items-center justify-center shadow-md">
      <p class="text-white text-xs md:text-xl font-bold">
        {{ gamePoints }}
      </p>
    </div>
  </div>
</template>
<script setup>
defineProps({
  id: String,
  gamePoints: Number,
  currentPlayer: String,
  playerName: {
    type: String,
    default: 'Player Name'
  },
  photoPath: {
    type: String,
    default: "/icons/null_profile.png"
  },
  marks: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 4
  }
});
</script>
