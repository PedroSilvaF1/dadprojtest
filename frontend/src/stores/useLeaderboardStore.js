import { defineStore } from 'pinia';
import api from '../services/api';

export const useLeaderboardStore = defineStore('leaderboard', {
  state: () => ({
    users: [],
    isLoading: false,
    myRank: '-',
    currentType: 'match_wins',
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0
    }
  }),

  actions: {
    async fetchLeaderboard(type = 'match_wins', page = 1) {
      this.isLoading = true;
      this.currentType = type;

      try {
        const response = await api.get('/leaderboard', { params: { type, page } });

        const result = response.data;

        this.users = result.data;
        this.pagination.currentPage = result.current_page;
        this.pagination.lastPage = result.last_page;
        this.pagination.total = result.total;

      } catch (error) {
        console.error('Erro ao carregar leaderboard:', error);
        this.users = [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyRank(type) {
      // Se não passar tipo, usa o atual
      const rankType = type || this.currentType;

      try {
        const response = await api.get('/leaderboard/my-rank', {
          params: { type: rankType }
        });
        this.myRank = response.data.rank;
      } catch (error) {
        console.error('Erro rank:', error);
        this.myRank = '-';
      }
    },

    goToMyRank() {
      if (!this.myRank || this.myRank === '-') return;

      const rank = parseInt(this.myRank);
      // Tenta usar o valor que veio da API, se não houver usa 10 como fallback
      const itemsPerPage = this.pagination.perPage || 10;

      const targetPage = Math.ceil(rank / itemsPerPage);
      this.fetchLeaderboard(this.currentType, targetPage);
    },

    changePage(page) {
      if (page < 1 || page > this.pagination.lastPage || this.isLoading) return;
      this.fetchLeaderboard(this.currentType, page);
    }
  }
});
