<script setup>
import redCard from "@/assets/cards/back/red.png";
import { computed, ref, onMounted } from "vue";
import { useShopStore } from "@/stores/useShopStore.js";
import { useUserStore } from "@/stores/useUserStore.js";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useRouter } from "vue-router";
import { ArrowLeftRight } from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const userStore = useUserStore();
const shopStore = useShopStore();

const customTab = ref("avatars");
const currentTxPage = ref(1);

const currentProfileImage = computed(() => {
  if (userStore.activeAvatar) {
    return shopStore.getAvatarPreview(userStore.activeAvatar);
  }
  return userStore.avatar || "/icons/null_profile.png";
});

// Filtrar as skins e avatar que apenas o utilizador comprou
const myOwnedDecks = computed(() => {
  return shopStore.skinCatalog.filter(skin => shopStore.isSkinOwned(skin.id));
});
const myOwnedAvatars = computed(() => {
  return shopStore.avatarCatalog.filter(avatar => shopStore.isAvatarOwned(avatar.id));
});

// Prevenir quando a opção none é escolhida para não fazer pedido patch desnecessáriamente
const handleEquipAvatar = (avatarId) => {
  if (avatarId === null && !userStore.activeAvatar) return;
  if (avatarId !== null && userStore.activeAvatar === avatarId) return;
  shopStore.equipAvatar(avatarId);
};

const handleEquipSkin = (skinId) => {
  const targetSkinId = skinId || 'red';
  if (userStore.activeSkinBack === targetSkinId) return;
  shopStore.equipSkin(targetSkinId);
};

const fetchTransactions = async (page) => {
  if (page < 1 || (userStore.transactionsMeta && page > userStore.transactionsMeta.last_page)) return;
  currentTxPage.value = page;
  await userStore.fetchTransactions(page);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const logout = async () => {
  userStore.reset();
  await auth.logout();
  await router.push("/");
};

onMounted(() => {
  if (userStore.type === 'P') {
    fetchTransactions(1);
  }
});
</script>

<template>
  <div class="text-center px-5 py-16">
    <h1 class="text-4xl md:text-5xl font-extrabold text-yellow-200 mb-8">
      Your Profile
    </h1>

    <div class="relative w-11/12 md:w-3/5 mx-auto bg-black/60 rounded-2xl border border-yellow-700
                   shadow-xl px-6 md:px-6 py-6 md:py-6 flex flex-col md:flex-row md:items-start md:gap-8 items-center">

      <div class="w-full flex justify-end mb-4 md:hidden">
        <button @click="logout" class="bg-red-700 hover:bg-red-800 text-yellow-100
               px-4 py-1.5 rounded-full font-semibold border border-yellow-600
               shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
          Sign out
        </button>
      </div>

      <div class="flex flex-col items-center mb-3 md:mb-0 w-full md:w-1/3 md:shrink-0">
        <div class="relative mb-4 w-24 h-24 min-w-24 min-h-24 md:w-48 md:h-48 md:min-w-48 md:min-h-48 flex-none aspect-square rounded-full overflow-hidden border-4 border-yellow-500">
          <img :src="currentProfileImage" alt="avatar"
            class="w-full h-full object-cover shadow-lg" />
        </div>

        <h2 v-if="userStore.nickname === null" class="text-2xl font-semibold text-yellow-100">{{ userStore.name }}
        </h2>
        <h2 v-else class="text-2xl font-semibold text-yellow-100">{{ userStore.nickname }}</h2>
        <p class="text-gray-300 mb-6">
          Wins: <span class="font-semibold text-yellow-300">{{ userStore.wins ?? 0 }}</span>
        </p>

        <div class="w-full flex flex-col md:flex-row gap-3">
          <button @click="router.push('/edit-profile')" class="w-full md:flex-1 mb-4 md:mb-0 bg-red-700 hover:bg-red-800 text-yellow-100 px-3 py-2 rounded-full font-semibold
               border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
            Edit Profile
          </button>

          <button @click="logout" class="hidden md:block w-full md:flex-1 bg-red-700 hover:bg-red-800 text-yellow-100 px-3 py-2 rounded-full font-semibold
               border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
            Sign out
          </button>
        </div>
      </div>

      <div class="w-full md:flex-1">
        <div class="w-full flex bg-black/40 rounded-xl border border-yellow-700/50 p-1 mb-8">
          <button @click="customTab = 'avatars'" :class="[
            'flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all duration-300',
            customTab === 'avatars'
              ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg'
              : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20'
          ]">
            <span class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Avatars
            </span>
          </button>

          <button @click="customTab = 'decks'" :class="[
            'flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all duration-300',
            customTab === 'decks'
              ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg'
              : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20'
          ]">
            <span class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Decks
            </span>
          </button>
        </div>
        <transition name="fade">
          <div v-if="customTab === 'avatars'" key="avatars"
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">

            <div
              class="relative group w-20 h-20 rounded-full border-4 overflow-hidden transition-all duration-300 cursor-pointer flex items-center justify-center bg-gray-900"
              :class="{
                'border-yellow-500 shadow-lg scale-105': !userStore.activeAvatar,
                'border-yellow-800 hover:border-yellow-500': userStore.activeAvatar
              }" @click="handleEquipAvatar(null)">
              <img src="/icons/block.svg" class="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity"
                alt="Default" />
              <div v-if="!userStore.activeAvatar"
                class="absolute top-1 right-1 bg-green-600 text-white text-xs rounded-full px-1.5">✓</div>
            </div>

            <div v-for="avatar in myOwnedAvatars" :key="avatar.id"
              class="relative group w-20 h-20 rounded-full border-4 overflow-hidden transition-all duration-300 cursor-pointer"
              :class="{ 'border-yellow-500 shadow-lg scale-105': userStore.activeAvatar === avatar.id, 'border-yellow-800 hover:border-yellow-500': userStore.activeAvatar !== avatar.id }"
              @click="shopStore.equipAvatar(avatar.id)">
              <img :src="shopStore.getAvatarPreview(avatar.id)" class="w-full h-full object-cover" />
              <div v-if="userStore.activeAvatar === avatar.id"
                class="absolute top-1 right-1 bg-green-600 text-white text-xs rounded-full px-1.5">✓</div>
            </div>
          </div>

          <div v-else key="decks"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">

            <div
              class="relative group bg-black/40 border rounded-2xl p-3 w-32 text-center transition-all duration-300 cursor-pointer flex flex-col items-center"
              :class="{
                'border-yellow-500 shadow-lg scale-105': !userStore.activeSkinBack,
                'border-yellow-800 hover:border-yellow-500': userStore.activeSkinBack
              }" @click="handleEquipSkin(null)">

              <img :src="redCard" class="h-20 object-contain mb-2" alt="Default Skin" />
              <p class="text-yellow-200 font-semibold text-sm">Red</p>

              <div v-if="userStore.activeSkinBack === 'red'"
                class="absolute top-1 right-1 bg-green-600 text-white text-xs rounded-full px-1.5">
                ✓
              </div>

              <div v-if="userStore.activeSkinBack !== 'red'"
                class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
                <span
                  class="bg-yellow-500 text-black font-semibold text-xs px-3 py-1 rounded-full shadow-md">Equip</span>
              </div>
            </div>

            <div v-for="skin in myOwnedDecks" :key="skin.id"
              class="relative group bg-black/40 border rounded-2xl p-3 w-32 text-center transition-all duration-300 cursor-pointer flex flex-col items-center"
              :class="{
                'border-yellow-500 shadow-lg scale-105': userStore.activeSkinBack === skin.id,
                'border-yellow-800 hover:border-yellow-500': userStore.activeSkinBack !== skin.id
              }" @click="handleEquipSkin(skin.id)">

              <img :src="shopStore.getSkinPreview(skin.id)" class="h-20 object-contain mb-2" />
              <p class="text-yellow-200 font-semibold text-sm">{{ skin.name }}</p>

              <div v-if="userStore.activeSkinBack === skin.id"
                class="absolute top-1 right-1 bg-green-600 text-white text-xs rounded-full px-1.5">
                ✓
              </div>

              <div v-if="userStore.activeSkinBack !== skin.id"
                class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
                <span
                  class="bg-yellow-500 text-black font-semibold text-xs px-3 py-1 rounded-full shadow-md">Equip</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
    <div v-if="userStore.type === 'P'" class="relative mt-10 w-11/12 md:w-3/5 mx-auto bg-black/60 rounded-2xl border border-yellow-700
                   shadow-xl px-4 py-6 md:px-6 flex flex-col items-center">
      <h2 class="text-xl md:text-2xl font-semibold text-yellow-100 mb-6 flex items-center gap-2">
        <ArrowLeftRight class="w-6 h-6 text-yellow-500" />
        Transaction History
      </h2>

      <div class="w-full overflow-hidden rounded-lg border border-gray-800">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-yellow-900/20 text-yellow-500 text-xs uppercase tracking-wider">
              <th class="py-3 px-3 md:px-4">Date</th>
              <th class="py-3 px-3 md:px-4 hidden sm:table-cell">Type</th>
              <th class="py-3 px-3 md:px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="text-gray-300 text-sm divide-y divide-gray-800">
            <tr v-if="userStore.transactions.length === 0">
              <td colspan="3" class="py-6 text-center italic text-gray-500">No transactions found.</td>
            </tr>
            <tr v-for="tx in userStore.transactions" :key="tx.id" class="hover:bg-white/5 transition-colors">

              <td class="py-3 px-3 md:px-4 whitespace-nowrap">
                <div class="flex flex-col">
                  <span class="font-medium">{{ new Date(tx.transaction_datetime).toLocaleDateString() }}</span>
                  <span class="text-xs text-gray-500 md:hidden">{{ new
                    Date(tx.transaction_datetime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}) }}</span>

                  <span class="text-xs text-yellow-500/80 sm:hidden mt-1">{{ tx.type_name }}</span>
                </div>
              </td>

              <td class="py-3 px-3 md:px-4 hidden sm:table-cell">
                {{ tx.type_name }}
              </td>

              <td class="py-3 px-3 md:px-4 text-right font-bold text-base"
                :class="tx.coins > 0 ? 'text-green-400' : 'text-red-400'">
                {{ tx.coins > 0 ? '+' : '' }}{{ tx.coins }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="userStore.transactionsMeta && userStore.transactionsMeta.last_page > 1"
        class="flex justify-between items-center gap-4 mt-6 w-full max-w-xs">
        <button @click="fetchTransactions(currentTxPage - 1)" :disabled="currentTxPage <= 1"
          class="px-4 py-2 rounded-lg bg-gray-800 text-yellow-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold uppercase flex-1">
          Prev
        </button>
        <span class="text-yellow-500 font-mono text-sm whitespace-nowrap">
          Page {{ currentTxPage }} of {{ userStore.transactionsMeta.last_page }}
        </span>
        <button @click="fetchTransactions(currentTxPage + 1)"
          :disabled="currentTxPage >= userStore.transactionsMeta.last_page"
          class="px-4 py-2 rounded-lg bg-gray-800 text-yellow-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold uppercase flex-1">
          Next
        </button>
      </div>
    </div>
  </div>
</template>
