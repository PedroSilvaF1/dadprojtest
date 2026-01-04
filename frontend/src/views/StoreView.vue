<script setup>
import {McCoinLine} from "@kalimahapps/vue-icons";
import { ref } from "vue";
import {useUserStore} from "@/stores/useUserStore.js";
import {useShopStore} from "@/stores/useShopStore.js";
import {useAuthStore} from "@/stores/useAuthStore.js";
import {useRouter} from "vue-router";

const userStore = useUserStore();
const shopStore = useShopStore();
const auth = useAuthStore();
const router = useRouter();

const showBuyCoins = ref(false);

const goToCoinsShop = () => {
  router.push({ path: '/coins-shop' });
};

// Comprar skins e avatars
const handlePurchaseSkin = async (skin) => {
  if (userStore.coins < skin.price) {
    showBuyCoins.value = true;
    return;
  }
  await shopStore.purchaseSkin(skin);
};

const handlePurchaseAvatar = async (avatar) => {
  if (userStore.coins < avatar.price) {
    showBuyCoins.value = true;
    return;
  }
  await shopStore.purchaseAvatar(avatar);
};
</script>
<template>

  <!-- STORE -->
  <div class="text-center px-5 py-16">
    <h1 class="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-8">Card Store</h1>
    <h2 class="text-3xl md:text-4xl font-semibold text-yellow-200 mb-6">Skins</h2>

    <!-- Skins/Decks -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-5 w-11/12 md:w-3/5 mx-auto">
      <div v-for="skin in shopStore.skinCatalog" :key="skin.id"
           class="bg-black/60 border rounded-2xl p-4 shadow-md transition-all flex flex-col items-center justify-between border-yellow-700 hover:shadow-lg hover:scale-105">

        <div class="mb-3 relative w-24 h-36">
          <img :src="shopStore.getSkinPreview(skin.id)" class="w-full h-full object-contain drop-shadow-lg"
               alt="skin" />
        </div>

        <h3 class="font-semibold text-yellow-100 text-lg mb-1">{{ skin.name }}</h3>

        <div class="w-full mt-2">
          <button v-if="shopStore.isSkinOwned(skin.id)" disabled
                  class="w-full bg-gray-700 text-gray-300 border border-gray-500 px-4 py-1.5 rounded-full cursor-not-allowed text-sm font-bold uppercase tracking-wide">
            Purchased
          </button>

          <button v-else @click="handlePurchaseSkin(skin)"
                  class="w-full bg-red-700 hover:bg-red-600 text-yellow-100 px-4 py-1.5 rounded-full transition flex items-center justify-center gap-2">
            <span>Buy</span>
            <div class="flex items-center gap-1 bg-black/30 px-2 rounded-lg">
              <span class="font-bold">{{ skin.price }}</span>
              <McCoinLine class="w-3 h-3 text-yellow-400" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <h2 class="text-3xl md:text-4xl font-semibold text-yellow-200 mb-6 mt-6">Avatars</h2>

    <!-- Avatars -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-5 w-11/12 md:w-3/5 mx-auto">
      <div v-for="avatar in shopStore.avatarCatalog" :key="avatar.id"
           class="bg-black/60 border rounded-2xl p-4 shadow-md transition-all flex flex-col items-center justify-between border-yellow-700 hover:shadow-lg hover:scale-105">

        <div class="mb-3 relative w-24 h-36">
          <img :src="shopStore.getAvatarPreview(avatar.id)" class="w-full h-full object-contain drop-shadow-lg"
               alt="avatar" />
        </div>

        <h3 class="font-semibold text-yellow-100 text-lg mb-1">{{ avatar.name }}</h3>

        <div class="w-full mt-2">
          <button v-if="shopStore.isAvatarOwned(avatar.id)" disabled
                  class="w-full bg-gray-700 text-gray-300 border border-gray-500 px-4 py-1.5 rounded-full cursor-not-allowed text-sm font-bold uppercase tracking-wide">
            Purchased
          </button>

          <button v-else @click="handlePurchaseAvatar(avatar)"
                  class="w-full bg-red-700 hover:bg-red-600 text-yellow-100 px-4 py-1.5 rounded-full transition flex items-center justify-center gap-2">
            <span>Buy</span>
            <div class="flex items-center gap-1 bg-black/30 px-2 rounded-lg">
              <span class="font-bold">{{ avatar.price }}</span>
              <McCoinLine class="w-3 h-3 text-yellow-400" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <h2 v-if="userStore.type === 'P'" class="text-3xl md:text-4xl font-semibold text-yellow-200 mb-6 mt-6">No
      Coins? No Problem!</h2>

    <button v-if="userStore.type === 'P'" @click="goToCoinsShop()" :disabled="auth.loading" id="btn_login"
            type="submit"
            class="w-full sm:w-auto justify-center cursor-pointer font-bold transition bg-red-600 px-8 py-3 sm:px-6 sm:py-2 rounded-lg border-red-700
          border-b-[4px]
          hover:brightness-110 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed">
      Buy Coins
    </button>
  </div>
</template>
