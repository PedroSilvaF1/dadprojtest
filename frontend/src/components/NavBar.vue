<template>
  <nav class="bg-red-700 h-20 shadow-lg relative z-40">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 h-full">

      <RouterLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img src="@/assets/logo.svg" class="h-12 w-auto" alt="Logo" />
        <span class="self-center text-2xl font-bold whitespace-nowrap text-yellow-100">
          Bisca
        </span>
      </RouterLink>

      <div class="hidden md:flex flex-row gap-2">
        <button
          v-for="item in filteredNavItems"
          :key="item.name"
          @click="selectItem(item.name)"
          class="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-sm border-0 outline-none"
          :class="selected === item.name
            ? 'bg-red-600 text-yellow-100 shadow-inner translate-y-[1px]'
            : 'text-yellow-100/80 hover:bg-red-800 hover:text-yellow-100'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </button>
      </div>

      <div class="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">

        <template v-if="auth.isAuthenticated && userStore.type === 'P'">
          <CoinsBalance :custom="true" class="mr-4" />

        </template>
        <template v-else-if="!auth.isAuthenticated">
          <div class="flex flex-row gap-3">
            <button
              v-if="!isAuthPage"
              @click="goLogin"
              class="cursor-pointer font-bold transition-all bg-red-600 text-yellow-100 px-6 py-2 rounded-lg border-red-800
                     border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
                     active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
            >
              Login
            </button>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>
<script setup>
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/useAuthStore"
import { useUserStore } from '@/stores/useUserStore';
import CoinsBalance from "@/components/CoinsBalance.vue";
import { BarChart3, History, ShoppingBag, Gamepad2, Trophy, User, UserPen } from 'lucide-vue-next';

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const userStore = useUserStore();

const props = defineProps({
  selected: {
    type: String,
    default: 'GAME'
  }
})

const emit = defineEmits(['update:selected'])

const allNavItems = [
  { name: 'HISTORY', icon: History, label: 'History' },
  { name: 'STORE', icon: ShoppingBag, label: 'Store' },
  { name: 'GAME', icon: Gamepad2, label: 'Game' },
  { name: 'SCORE', icon: Trophy, label: 'Score' },
  { name: 'STATS', icon: BarChart3, label: 'Stats' },
  { name: 'ADMIN', icon: UserPen, label: 'Admin' },
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

const isAuthPage = computed(() => {
  return ['/login', '/register'].includes(route.path)
})

const goLogin = () => router.push("/login")

function selectItem(name) {
  emit('update:selected', name)
}
</script>
