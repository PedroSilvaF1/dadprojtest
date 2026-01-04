import { defineStore } from 'pinia';
import api from '../services/api';

export const useStatsGameStore = defineStore('statsGame', {
  state: () => ({
    games: [],
    loading: false,
    error: null,
    expandedGameKey: null,

    expandedStandaloneGameId: null,
    standaloneTricks: {},
    loadingStandalone: false,
    errorStandalone: null,
  }),

  actions: {
    async fetchGames(matchId, filterResult = 'ALL', filterAchievement = 'ALL') {
      this.loading = true;
      this.error = null;

      this.games = [];

      try {
        const params = {};

        // Só envia se não for ALL
        if (filterResult !== 'ALL') {
          params.result = filterResult;
        }

        if (filterAchievement !== 'ALL') {
          params.achievement = filterAchievement;
        }

        const response = await api.get(`/matches/${matchId}/games`, { params });

        this.games = response.data;

      } catch (err) {
        console.error(err);
        this.error = 'Erro ao carregar os detalhes da partida.';
      } finally {
        this.loading = false;
      }
    },

    toggleGame(matchId, gameId) {
      const key = `${matchId}-${gameId}`;
      this.expandedGameKey = this.expandedGameKey === key ? null : key;
    },

    async toggleStandaloneGame(gameId) {
      if (this.expandedStandaloneGameId === gameId) {
        this.expandedStandaloneGameId = null;
        return;
      }

      this.expandedStandaloneGameId = gameId;

      if (!this.standaloneTricks[gameId]) {
        await this.fetchStandaloneTricks(gameId);
      }
    },

    async fetchStandaloneTricks(gameId) {
      this.loadingStandalone = true;
      this.errorStandalone = null;

      try {
        const res = await api.get(`/games/${gameId}`);
        this.standaloneTricks[gameId] = res.data.tricks ?? [];

      } catch (err) {
        console.error(err);
        this.errorStandalone = 'Erro ao carregar tricks do jogo.';
        this.standaloneTricks[gameId] = [];
      } finally {
        this.loadingStandalone = false;
      }
    },


    getGameLabel(game, userId) {
      if (game.player1_points == null || game.player2_points == null) return null;

      // 1. Descobrir quais são os MEUS pontos
      let myPoints = 0;
      if (game.player1_user_id === userId) {
        myPoints = game.player1_points;
      } else {
        myPoints = game.player2_points;
      }

      // 2. Aplicar a lógica (Só mostra se for vitória/conquista)
      if (myPoints === 120) return 'Bandeira';
      if (myPoints >= 91) return 'Capote';
      if (myPoints >= 61) return 'Risca';

      // Se tiveres 60 ou menos (Perdeste ou Empate), não mostra nada
      return null;
    }
  }
});
