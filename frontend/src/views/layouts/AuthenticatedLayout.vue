<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import BottomNav from "@/components/BottomNav.vue";
import BuyCoinsDialog from "@/components/dialogs/BuyCoinsDialog.vue";
import CoinsBalance from "@/components/CoinsBalance.vue";
import { useUserStore } from "@/stores/useUserStore.js";

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const currentRouteName = computed(() => route.name);
const showBuyCoins = ref(false);

const handleNavSelection = (name) => {
  router.push({ name: name });
};

onMounted(async () => {
  if (!userStore.type) {
    await userStore.fetchProfile();
  }

  if (userStore.type === 'A' && route.name === 'GAME') {
    await router.replace({ name: 'ADMIN' });
  }
});

</script>
<template>
  <NavBar
    :selected="currentRouteName"
    @update:selected="handleNavSelection"
    class="hidden md:block"
  />

  <div class="text-center pb-28 md:pb-10 text-white relative overflow-hidden min-h-screen">

    <BuyCoinsDialog v-if="showBuyCoins" @close="showBuyCoins = false" />
    <CoinsBalance v-if="userStore.type === 'P'" class="md:hidden" />

    <transition name="fade" mode="out-in">
      <div :key="route.name" class="relative z-10">
        <RouterView />
      </div>
    </transition>

    <BottomNav
      :selected="currentRouteName"
      @update:selected="handleNavSelection"
      class="md:hidden"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
