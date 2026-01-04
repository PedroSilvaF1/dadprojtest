<template>
  <nav class="fixed bottom-0 left-0 w-full bg-red-700 shadow-lg flex justify-around z-50 md:hidden">
    <button
      v-for="item in filteredNavItems"
      :key="item.name"
      :id="item.label"
      :data-label="item.label"
      :aria-label="`Maps to ${item.label}`"
      @click="selectItem(item.name)"
      class="flex flex-col items-center justify-center text-center px-2 py-2 transition-all duration-300 ease-in-out relative border-0 outline-none"
      :class="selected === item.name
          ? 'bg-red-600 rounded-t-lg flex-grow max-w-[150px]'
          : 'flex-grow max-w-[120px] text-yellow-100'"
    >
      <component :is="item.icon" class="w-6 h-6 pointer-events-none" />

      <transition name="fade">
        <span v-if="selected === item.name" class="text-xs mt-1 font-semibold truncate">
          {{ item.name }}
        </span>
      </transition>

    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { BarChart3, History, ShoppingBag, Gamepad2, Trophy, User, UserPen } from 'lucide-vue-next';
import { useUserStore } from '@/stores/useUserStore';

const userStore = useUserStore();

const props = defineProps({
  selected: {
    type: String,
    default: 'GAME'
  }
})

const emit = defineEmits(['update:selected'])

const internalSelected = computed({
  get() {
    return props.selected
  },
  set(newVal) {
    emit('update:selected', newVal)
  }
})

const allNavItems = [
  { name: 'HISTORY', icon: History, label: 'History' },
  { name: 'STORE', icon: ShoppingBag, label: 'Store' },
  { name: 'GAME', icon: Gamepad2, label: 'Game' },
  { name: 'SCORE', icon: Trophy, label: 'Score' },
  { name: 'STATS', icon: BarChart3, label: 'Stats' },
  { name: 'ADMIN', icon: UserPen, label: 'Admin Control Panel' },
  { name: 'PROFILE', icon: User, label: 'Profile' },
]

const filteredNavItems = computed(() => {

  // Anonimo
  if (!userStore.type) {
    return allNavItems.filter(item => item.name !== 'ADMIN');
  };

  if (userStore.type === 'A') {
    return allNavItems.filter(item =>
      item.name !== 'STORE' && item.name !== 'GAME'
    );
  }

  if (userStore.type === 'P') {
    return allNavItems.filter(item => item.name !== 'ADMIN');
  }
  return allNavItems;
});

function selectItem(name) {
  internalSelected.value = name
}
</script>


<style scoped>
.flex-col > span:first-child {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Mobile active state animation */
.flex-col.bg-red-600.rounded-t-lg > span:first-child {
  transform: translateY(-4px);
}

/* Removed the @media query for desktop specific animations */
</style>
