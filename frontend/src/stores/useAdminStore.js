import { defineStore } from 'pinia'
import api from '../services/api'

export const useAdminStore = defineStore("admin", {
  state: () => ({
    admins: [],

    // transações de user que foi fetched
    userTransactions: [],
    userTransactionsMeta: null,
    userStats: null,
    userStatsLoading: false,
    userStatsError: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAdmins() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/users/admins');
        this.admins = response.data;
        return this.admins;
      } catch (error) {
        console.error("Error fetching admins:", error);
        this.error = "Failed to load administrators.";
      } finally {
        this.loading = false;
      }
    },
    async createAdmin(payload) {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('name', payload.name);
        formData.append('nickname', payload.nickname);
        formData.append('email', payload.email);
        formData.append('password', payload.password);
        formData.append('type', 'A');

        if (payload.avatar) {
          formData.append('avatar', payload.avatar);
        }

        const response = await api.post('/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          this.error = e.response.data.message;
        } else {
          this.error = "Failed to create administrator.";
        }
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async blockUser(userId) {
      try {
        const response = await api.patch(`/users/${userId}/block`);
        return response.data;
      } catch (error) {
        console.error("Error blocking user:", error);
        throw error;
      }
    },
    async deleteUser(userId) {
      try {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
      }
    },
    async fetchUserTransactions(userId, page = 1) {
      this.loading = true;
      try {
        const response = await api.get(`/users/${userId}/transactions?page=${page}`);
        this.userTransactions = response.data.data;
        this.userTransactionsMeta = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total
        };
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.error = "Failed to load transactions.";
      } finally {
        this.loading = false;
      }
    },
    async fetchUserStats(userId) {
      this.userStatsLoading = true;
      this.userStatsError = null;
      try {
        const response = await api.get(`/users/${userId}/stats`);
        this.userStats = response.data;
      } catch (error) {
        console.error("Error fetching user stats:", error);
        this.userStats = null;
        this.userStatsError = "Failed to load user stats.";
      } finally {
        this.userStatsLoading = false;
      }
    },
    clearUserStats() {
      this.userStats = null;
      this.userStatsLoading = false;
      this.userStatsError = null;
    }
  },
});
