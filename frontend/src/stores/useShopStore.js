import { defineStore } from 'pinia';
import { useUserStore } from "@/stores/useUserStore.js";
import api from "@/services/api.js";

export const useShopStore = defineStore('shop', {
  state: () => ({
    skinCatalog: [
      { id: 'blue', name: 'Blue', price: 50 },
      { id: 'pink', name: 'Pink', price: 50 },
      { id: 'rainbow', name: 'LGTV+', price: 1 },
      { id: 'medieval', name: 'Medieval', price: 250 },
      { id: 'we_know', name: 'We Know', price: 100 },
      { id: 'ipl', name: 'IPL', price: 80 },
      { id: 'cr7', name: 'The Goat', price: 500 },
      { id: 'sans', name: 'Sans', price: 500 },
      { id: 'faker', name: 'Faker', price: 250 },
    ],
    avatarCatalog: [
      { id: 'chupaki', name: 'Chupaki', price: 100 },
      { id: 'jack', name: 'Jack', price: 100 },
      { id: 'johnny', name: 'Johnny', price: 100 },
      { id: 'lili', name: 'Lili', price: 100 },
      { id: 'magnus', name: 'Magnus', price: 100 },
      { id: 'narnia', name: 'Narnia', price: 100 },
      { id: 'teya', name: 'Teya', price: 100 },
      { id: 'volskaya', name: 'Volskaya', price: 100 },
    ],

    // Valor em percentagem (%)
    coinsPurchaseBonus: 10,
    coinsCatalog: [
      { id: '10_pack', name: '10 coins', quantity: 10, price: 1, hasBonus: false },
      { id: '50_pack', name: '50 coins', quantity: 50, price: 5, hasBonus: false },
      { id: '100_pack', name: '100 coins', quantity: 100, price: 10, hasBonus: true },
      { id: '200_pack', name: '200 coins', quantity: 200, price: 20, hasBonus: true },
      { id: '300_pack', name: '300 coins', quantity: 300, price: 30, hasBonus: true },
      { id: '500_pack', name: '500 coins', quantity: 500, price: 50, hasBonus: true },
    ]

  }),
  getters: {
    // Verificar se o user tem a skin
    isSkinOwned: () => (skinId) => {
      const userStore = useUserStore();

      // Se o array estiver undefined, mete o array como vazio ou retorna falso
      return userStore.ownedSkins?.includes(skinId) || false;
    },
    isAvatarOwned: () => (avatarId) => {
      const userStore = useUserStore();
      return userStore.ownedAvatars?.includes(avatarId) || false;
    },
    getSkinPreview: () => (skinId) => {
      return new URL(`../assets/cards/back/${skinId}.png`, import.meta.url).href;
    },
    getAvatarPreview: () => (avatarId) => {
      return new URL(`../assets/avatars/${avatarId}.jpeg`, import.meta.url).href;
    }
  },
  actions: {
    async purchaseSkin(skin) {
      const userStore = useUserStore();
      if (this.isSkinOwned(skin.id)) return;
      try {
        const response = await api.post('/shop/buy/skin', {
          skin_id: skin.id,
          cost: skin.price
        });

        userStore.updateSkinBalance(
          response.data.new_balance,
          response.data.owned_skins
        );

      } catch (error) {

        // Se o backend devolver "Already Owned", forçar o UI a concordar
        if (error.response && error.response.status === 409) {
          console.warn("Skin already owned.");
          userStore.addSkinToInventory(skin.id);
        } else {
          console.error("Purchase failed", error);
        }
      }
    },
    async purchaseAvatar(avatar) {
      const userStore = useUserStore();
      if (this.isAvatarOwned(avatar.id)) return;
      try {
        const response = await api.post('/shop/buy/avatar', {
          avatar_id: avatar.id,
          cost: avatar.price
        });

        userStore.updateAvatarBalance(
          response.data.new_balance,
          response.data.owned_avatars
        );

      } catch (error) {

        // Se o backend devolver "Already Owned", forçar o UI a concordar
        if (error.response && error.response.status === 409) {
          console.warn("Avatar already owned.");
          userStore.addAvatarToInventory(avatar.id);
        } else {
          console.error("Purchase failed", error);
        }
      }
    },
    async purchaseCoins(type, reference, value) {
      const userStore = useUserStore();

      try {
        const response = await api.post('/debit', {
          type: type,
          reference: reference,
          value: value
        });

        if (response.data.new_balance !== undefined) {
          userStore.updateCoinsBalance(response.data.new_balance);;
        } else {
          await userStore.fetchProfile();
        }
        return response;

      } catch (error) {
        console.error("Purchase failed", error);
        throw error;
      }
    },
    async equipSkin(skinId) {
      const userStore = useUserStore();

      // Verificar se a front é do sans ou não
      let frontSkin = 'white';
      if (skinId === 'sans') {
        frontSkin = 'sans';
      }

      userStore.activeSkinBack = skinId;
      userStore.activeSkinFront = frontSkin;

      try {
        await api.patch('/users/me/skin', {
          skin_back: skinId,
          skin_front: frontSkin
        });
      } catch (error) {
        console.error("Failed to save skin", error);
      }
    },
    async equipAvatar(avatarId) {
      const userStore = useUserStore();

      userStore.activeAvatar = avatarId;

      try {
        await api.patch('/users/me/avatar', {
          avatar: avatarId ?? ""
        });
      } catch (error) {
        console.error("Failed to save avatar", error);
      }
    },
  },
});
