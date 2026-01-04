import { defineStore } from 'pinia';
import api from '../services/api';
import {useStatsGameStore} from "@/stores/useStatsGameStore.js";

export const useHistoryStore = defineStore('history', {
  state: () => ({
    mode: 'matches',
    matches: [],
    standaloneGames: [],
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1,
    expandedMatchId: null,
    filters: {
      date_from: '',
      date_to: '',
      result: 'ALL',
      achievement: 'ALL',
      sort: 'DESC'
    }
  }),

  actions: {
    setMode(mode) {
      if (!['matches', 'standalone'].includes(mode)) return;

      const stats = useStatsGameStore();

      this.mode = mode;
      this.currentPage = 1;
      this.lastPage = 1;
      this.total = 0;

      this.expandedMatchId = null;

      stats.expandedGameKey = null;
      stats.expandedStandaloneGameId = null;

      stats.games = [];

      this.matches = [];
      this.standaloneGames = [];

      this.fetchHistory(1);
    },

    async fetchHistory(page = 1, userId = null) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          page: page,
          mode: this.mode,
          ...(userId && { user_id: userId }),
          ...(this.filters.date_from && { date_from: this.filters.date_from }),
          ...(this.filters.date_to && { date_to: this.filters.date_to }),
          ...(this.filters.result !== 'ALL' && { result: this.filters.result }),
          ...(this.filters.achievement !== 'ALL' && { achievement: this.filters.achievement }),
          sort: this.filters.sort
        };

        const response = await api.get('/matches', { params });

        if (this.mode === 'matches') {
          this.matches = response.data.data;
          this.standaloneGames = [];
        } else {
          this.standaloneGames = response.data.data;
          this.matches = [];
        }

        this.total = response.data.total;
        this.currentPage = response.data.current_page;
        this.lastPage = response.data.last_page;
      } catch (err) {
        this.error = 'Erro ao carregar histórico.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    changeMatchesPage(page, userId = null) {
      if (page < 1 || page > this.lastPage || this.loading) return;

      this.fetchHistory(page, userId);
    },

    async toggleMatch(matchId) {
      if (this.mode !== 'matches') return; // segurança

      const stats = useStatsGameStore();

      stats.expandedStandaloneGameId = null;

      if (this.expandedMatchId === matchId) {
        this.expandedMatchId = null;
        stats.expandedGameKey = null;
        stats.games = [];
        return;
      }

      stats.expandedGameKey = null;
      this.expandedMatchId = matchId;

      await stats.fetchGames(matchId, this.filters.result, this.filters.achievement);
    },

    getGameModeLabel(type) {
      if (type === '3' || type === 3) return 'Bisca 3';
      if (type === '9' || type === 9) return 'Bisca 9';
      return 'Bisca';
    }
  }
});
