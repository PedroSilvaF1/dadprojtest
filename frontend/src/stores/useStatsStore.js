import { defineStore } from 'pinia';
import api from '@/services/api';

const formatLabel = (isoDate) => {
  if (!isoDate) return '';
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[1]}/${parts[2]}`;
};

export const useStatsStore = defineStore('stats', {
  state: () => ({
    totals: { players: 0, matches: 0, games: 0 },
    activity: [],
    isLoading: false,
    hasError: false,
    adminMetric: 'achievements',
    adminUsers: [],
    adminLoading: false,
    adminError: null
  }),
  getters: {
    adminOptions() {
      return [
        { value: 'achievements', label: 'Achievements' },
        { value: 'coins_out', label: 'Coins Spent' }
      ];
    },
    adminMetricLabel() {
      return this.adminOptions.find(opt => opt.value === this.adminMetric)?.label || 'Value';
    },
    adminSummary(state) {
      const values = state.adminUsers.map(item => Number(item.value) || 0);
      const count = values.length;
      const total = values.reduce((sum, value) => sum + value, 0);
      const avg = count ? total / count : 0;
      const sorted = [...values].sort((a, b) => a - b);
      const median = count
        ? (count % 2 === 0
          ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
          : sorted[(count - 1) / 2])
        : 0;
      const max = count ? sorted[count - 1] : 0;
      return { count, total, avg, median, max };
    },
    adminHistogram(state) {
      const values = state.adminUsers.map(item => Number(item.value) || 0);
      if (values.length === 0) {
        return { labels: [], data: [] };
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) {
        return { labels: [`${min}`], data: [values.length] };
      }

      const binCount = Math.min(6, Math.max(1, Math.ceil(Math.sqrt(values.length))));
      const range = max - min + 1;
      const binSize = Math.max(1, Math.ceil(range / binCount));
      const labels = [];
      const data = new Array(binCount).fill(0);

      for (let i = 0; i < binCount; i += 1) {
        const start = min + i * binSize;
        const end = i === binCount - 1 ? max : start + binSize - 1;
        labels.push(`${start}-${end}`);
      }

      values.forEach((value) => {
        const index = Math.min(
          Math.floor((value - min) / binSize),
          binCount - 1
        );
        data[index] += 1;
      });

      return { labels, data };
    },
    lineData(state) {
      const labels = state.activity.map(item => formatLabel(item.date));
      return {
        labels,
        datasets: [
          {
            label: "Matches",
            data: state.activity.map(item => item.matches),
            borderColor: "#f97316",
            backgroundColor: "rgba(249,115,22,0.2)",
            tension: 0.3,
            fill: true
          },
          {
            label: "Games",
            data: state.activity.map(item => item.games),
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.2)",
            tension: 0.3,
            fill: true
          }
        ]
      };
    },
    lineOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: "#fef9c3" },
            grid: { color: "rgba(250,204,21,0.1)" }
          },
          y: {
            ticks: { color: "#fef9c3" },
            grid: { color: "rgba(250,204,21,0.1)" },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            labels: { color: "#fde68a" }
          }
        }
      };
    },
    barData() {
      const histogram = this.adminHistogram;
      return {
        labels: histogram.labels,
        datasets: [
          {
            label: `${this.adminMetricLabel} Distribution`,
            data: histogram.data,
            backgroundColor: "rgba(59,130,246,0.6)",
            borderColor: "#60a5fa",
            borderWidth: 1
          }
        ]
      };
    },
    barOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: "#fef9c3" },
            grid: { color: "rgba(250,204,21,0.1)" }
          },
          y: {
            ticks: { color: "#fef9c3" },
            grid: { color: "rgba(250,204,21,0.1)" },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            labels: { color: "#fde68a" }
          }
        }
      };
    }
  },
  actions: {
    async fetchPublicStats() {
      this.isLoading = true;
      this.hasError = false;
      try {
        const response = await api.get('/stats/public');
        this.totals = response.data.totals || { players: 0, matches: 0, games: 0 };
        this.activity = response.data.activity || [];
      } catch (error) {
        console.error('Failed to load stats:', error);
        this.hasError = true;
        this.totals = { players: 0, matches: 0, games: 0 };
        this.activity = [];
      } finally {
        this.isLoading = false;
      }
    },
    async fetchAdminUsersStats(metric = 'achievements') {
      this.adminLoading = true;
      this.adminError = null;
      this.adminMetric = metric;
      try {
        const response = await api.get('/stats/admin/users', { params: { metric } });
        this.adminUsers = response.data.users || [];
      } catch (error) {
        console.error('Failed to load admin stats:', error);
        this.adminUsers = [];
        this.adminError = 'Failed to load admin stats.';
      } finally {
        this.adminLoading = false;
      }
    },
    async setAdminMetric(metric, isAdmin) {
      this.adminMetric = metric;
      if (isAdmin) {
        await this.fetchAdminUsersStats(metric);
      }
    },
    async initStats(isAdmin) {
      await this.fetchPublicStats();
      if (isAdmin) {
        await this.fetchAdminUsersStats(this.adminMetric);
      }
    }
  }
});
