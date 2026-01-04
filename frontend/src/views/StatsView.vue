<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useStatsStore } from "@/stores/useStatsStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const statsStore = useStatsStore();
const authStore = useAuthStore();
const userStore = useUserStore();
const {
  totals,
  isLoading,
  hasError,
  adminMetric,
  adminLoading,
  adminError,
  adminOptions,
  adminSummary,
  adminMetricLabel,
  lineData,
  lineOptions,
  barData,
  barOptions
} = storeToRefs(statsStore);

const isAdmin = computed(() => authStore.isAuthenticated && userStore.type === 'A');
const chartKey = ref(0);
const handleResize = () => {
  chartKey.value += 1;
};
const formatNumber = (value, digits = 0) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
};

const adminMetricModel = computed({
  get() {
    return adminMetric.value;
  },
  set(value) {
    statsStore.setAdminMetric(value, isAdmin.value);
  }
});

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  if (authStore.isAuthenticated && !userStore.type) {
    await userStore.fetchProfile();
  }
  await statsStore.initStats(isAdmin.value);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="text-center px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16 overflow-x-hidden">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-200 mb-6 drop-shadow-[0_0_8px_rgba(255,255,150,0.3)]">
      Stats
    </h1>

    <div class="w-full max-w-5xl mx-auto grid gap-6">
      <section class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        <div class="bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-4 sm:p-5">
          <div class="text-[11px] uppercase text-yellow-400/80">Total Players</div>
          <div class="text-2xl sm:text-3xl font-bold text-yellow-200 mt-2">{{ totals.players }}</div>
        </div>
        <div class="bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-4 sm:p-5">
          <div class="text-[11px] uppercase text-yellow-400/80">Total Matches</div>
          <div class="text-2xl sm:text-3xl font-bold text-yellow-200 mt-2">{{ totals.matches }}</div>
        </div>
        <div class="bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-4 sm:p-5">
          <div class="text-[11px] uppercase text-yellow-400/80">Total Games</div>
          <div class="text-2xl sm:text-3xl font-bold text-yellow-200 mt-2">{{ totals.games }}</div>
        </div>
      </section>

      <section class="bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-4 sm:p-5 md:p-6 min-w-0">
        <h2 class="text-lg sm:text-xl font-semibold text-yellow-200 mb-4">Last 30 Days Activity</h2>

        <div v-if="isLoading" class="h-56 sm:h-64 flex items-center justify-center text-yellow-200/60 italic">
          Loading stats...
        </div>
        <div v-else-if="hasError" class="h-56 sm:h-64 flex items-center justify-center text-red-200/80 italic">
          Could not load stats.
        </div>
        <div v-else class="h-56 sm:h-64 min-w-0">
          <Line :key="chartKey" :data="lineData" :options="lineOptions" />
        </div>
      </section>

      <section v-if="isAdmin" class="bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-4 sm:p-5 md:p-6 min-w-0">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 class="text-lg sm:text-xl font-semibold text-yellow-200">Admin Insights</h2>
          <select v-model="adminMetricModel"
            class="bg-black/60 border border-yellow-700 rounded-lg px-3 py-2 text-yellow-50 text-sm focus:outline-none w-full md:w-auto">
            <option v-for="option in adminOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div v-if="adminLoading" class="h-56 sm:h-64 flex items-center justify-center text-yellow-200/60 italic">
          Loading admin stats...
        </div>
        <div v-else-if="adminError" class="h-56 sm:h-64 flex items-center justify-center text-red-200/80 italic">
          {{ adminError }}
        </div>
        <div v-else class="grid gap-4">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="bg-black/40 rounded-xl border border-yellow-700/60 p-4">
              <div class="text-[10px] uppercase text-yellow-400/70">Users Counted</div>
              <div class="text-2xl font-semibold text-yellow-100 mt-1">
                {{ formatNumber(adminSummary.count) }}
              </div>
            </div>
            <div class="bg-black/40 rounded-xl border border-yellow-700/60 p-4">
              <div class="text-[10px] uppercase text-yellow-400/70">Total {{ adminMetricLabel }}</div>
              <div class="text-2xl font-semibold text-yellow-100 mt-1">
                {{ formatNumber(adminSummary.total) }}
              </div>
            </div>
            <div class="bg-black/40 rounded-xl border border-yellow-700/60 p-4">
              <div class="text-[10px] uppercase text-yellow-400/70">Avg per User</div>
              <div class="text-2xl font-semibold text-yellow-100 mt-1">
                {{ formatNumber(adminSummary.avg, 1) }}
              </div>
            </div>
            <div class="bg-black/40 rounded-xl border border-yellow-700/60 p-4">
              <div class="text-[10px] uppercase text-yellow-400/70">Max {{ adminMetricLabel }}</div>
              <div class="text-2xl font-semibold text-yellow-100 mt-1">
                {{ formatNumber(adminSummary.max) }}
              </div>
            </div>
          </div>

          <div>
            <div class="text-sm text-yellow-200/80 mb-2">
              Distribution of {{ adminMetricLabel }} (users grouped by value)
            </div>
            <div class="h-56 sm:h-64 min-w-0">
              <Bar :key="chartKey" :data="barData" :options="barOptions" />
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
