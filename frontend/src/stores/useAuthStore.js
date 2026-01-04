import { defineStore } from 'pinia';
import api from '@/services/api';


export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/login', { email, password });
        const data = response.data;
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
      } catch (e) {

        if (e.response && e.response.data && e.response.data.message) {
          this.error = e.response.data.message;
        } else {
        this.error = "Login failed";
        }
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async register(payload) {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('name', payload.name);
        formData.append('nickname', payload.nickname);
        formData.append('email', payload.email);
        formData.append('password', payload.password);

        if (payload.avatar) {
          formData.append('avatar', payload.avatar);
        }

        const response = await api.post('/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          this.error = e.response.data.message;
        } else {
          this.error = "Registration failed";
        }
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async checkUnique(field, value) {
      try {
        const response = await api.get('/users/check-unique', {
          params: { field, value }
        });
        return response.data.is_unique;
      } catch (e) {
        console.error("Error checking uniqueness:", e);
      }
    },
    async logout() {
      try {
        if (this.token) {
          await api.post('/logout');
        }
      } catch (e) {
        console.debug('Logout error:', e);
      }
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
})
