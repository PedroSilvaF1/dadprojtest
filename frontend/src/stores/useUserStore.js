import { defineStore } from 'pinia';
import api from '../services/api';
import { useGameStore } from '@/stores/useGameStore.js';

// Função auxiliar para converter a chave
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useUserStore = defineStore('profile', {
  state: () => ({
    id: null,
    name: '',
    nickname: '',
    type: '',
    blocked: 0,
    email: '',
    avatar: '',
    coins: 0,
    transactions: [],
    transactionsMeta: null, // Para a paginação
    totalMatches: 0,
    totalGames: 0,
    wins: 0,
    matchWins: 0,
    gameWins: 0,
    capotes: 0,
    bandeiras: 0,
    isLoading: false,

    // Setup das skins default
    activeSkinBack: 'red',
    activeSkinFront: 'white',
    activeAvatar: null,
    ownedSkins: ['red'],
    ownedAvatars: []
  }),
  actions: {
    async fetchProfile() {
      this.isLoading = true;
      try {
        const response = await api.get('/users/me');

        this.id = response.data.id;
        this.name = response.data.name;
        this.nickname = response.data.nickname;
        this.type = response.data.type;
        this.blocked = response.data.blocked;
        this.email = response.data.email;
        this.avatar = response.data.photo_avatar;
        this.coins = response.data.coins || 0;
        this.totalMatches = response.data.total_matches || 0;
        this.totalGames = response.data.total_games || 0;
        this.wins = response.data.wins || 0;
        this.matchWins = response.data.total_match_wins || this.wins || 0;
        this.gameWins = response.data.total_game_wins || 0;
        this.capotes = response.data.total_capotes || 0;
        this.bandeiras = response.data.total_bandeiras || 0;

        if (response.data.custom) {
          this.activeSkinBack = response.data.custom.active_skin_back || 'red';
          this.activeSkinFront = response.data.custom.active_skin_front || 'white';
          this.activeAvatar = response.data.custom.active_avatar;
          this.ownedSkins = response.data.custom.owned_skins || ['red'];
          this.ownedAvatars = response.data.custom.owned_avatars || [];
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchTransactions(page = 1) {
      try {
        const response = await api.get(`/users/me/transactions?page=${page}`);
        this.transactions = response.data.data;
        this.transactionsMeta = {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total
        };
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    },
    async subscribeToPush() {
      try {
        // Registar o Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        // 2. Pedir permissão ao utilizador
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Precisas de permitir notificações!');
          return;
        }

        // Criar a subscrição
        const pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
        });

        // Enviar para o Backend
        // O JSON.stringify é importante para formatar as chaves corretamente
        await api.post('/notifications/subscribe', JSON.parse(JSON.stringify(pushSubscription)));

        alert('Notificações ativadas com sucesso!');

      } catch (error) {
        console.error('Erro ao subscrever notificações:', error);
      }
    },

    async sendTestNotification() {
      try {
        await api.post('/notifications/test');
      } catch (error) {
        console.error('Erro ao testar notificação:', error);
        alert('Erro ao enviar teste. Verifica a consola.');
      }
    },

    // Fazer um put para editar o status da match
    async editMatch(matchId, resultData) {
      const gameStore = useGameStore();

      if (!gameStore.isPractice) {
        try {
          // Mandar dados para o backend
          const response = await api.put(`/matches/${matchId}`, resultData);

          // Dar update às moedas
          if (response.data.new_balance !== undefined) {
            this.coins = response.data.new_balance;
          }

          // Atualizar tudo de forma assincrona
          await Promise.all([
            this.fetchProfile()  // Atualiza o "Total Wins", "Capotes", "Bandeiras" no topo
          ]);

          console.log("Match ended successfully:", response.data);

        } catch (error) {
          console.error("Failed to start match:", error);
        }
      }
    },
    // Criar a match com status Started
    async persistMatch(resultData) {
      const gameStore = useGameStore();

      if (!gameStore.isPractice) {
        try {

          // Mandar dados para o backend
          const response = await api.post("/matches", resultData);

          // dar update às moedas
          if (response.data.new_balance !== undefined) {
            this.coins = response.data.new_balance;
          }

          console.log("Match started successfully, ID:", response.data.id);
          return response.data.id;
        } catch (error) {
          console.error("Failed to save match:", error);
        }
      }
    },
    async payForUndo() {
      if (!this.id) return false;

      try {
        const response = await api.patch(`/coins/${this.id}/undo`);

        if (response.data.coins_balance !== undefined) {
          this.coins = response.data.coins_balance;
        }

        console.log("Undo Payment Successful. New Balance", response.data.coins_balance);
        return true;
      } catch (error) {
        console.error("Failed to pay for undo:", error);
        return false;
      }
    },
    addSkinToInventory(skinId) {
      if (!this.ownedSkins) {
        this.ownedSkins = ['red'];
      }
      if (!this.ownedSkins.includes(skinId)) {
        this.ownedSkins.push(skinId);
      }
    },
    addAvatarToInventory(avatarId) {
      if (!this.ownedAvatars) this.ownedAvatars = [];
      if (!this.ownedAvatars.includes(avatarId)) {
        this.ownedAvatars.push(avatarId);
      }
    },
    updateCoinsBalance(newBalance) {
      this.coins = newBalance;
    },
    updateSkinBalance(newBalance, newSkins) {
      this.coins = newBalance;
      this.ownedSkins = newSkins;
    },

    updateAvatarBalance(newBalance, newAvatars) {
      this.coins = newBalance;
      this.ownedAvatars = newAvatars;
    },
    async updateProfile(formData) {
      try {
        const response = await api.post('/users/me', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.name = response.data.user.name;
        this.nickname = response.data.user.nickname;
        this.email = response.data.user.email;
        if (response.data.photo_avatar) {
          this.avatar = response.data.photo_avatar;
        }

        return true;
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      }
    },

    async changePassword(passwordData) {
      try {
        await api.patch('/users/me/password', passwordData);
        return true;
      } catch (error) {
        console.error('Erro ao mudar password:', error);
        throw error;
      }
    },
    async deleteAccount(password) {
      await api.delete('/users/me', {
        data: { password: password }
      });
    },
    reset() {
      this.id = null;
      this.name = '';
      this.nickname = '';
      this.avatar = '';
      this.coins = 0;
      this.totalMatches = 0;
      this.totalGames = 0;
      this.wins = 0;
      this.matchWins = 0;
      this.gameWins = 0;
      this.capotes = 0;
      this.bandeiras = 0;
      this.isLoading = false;
    }
  }
}
)
