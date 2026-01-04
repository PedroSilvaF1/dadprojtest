<script setup>
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import { useLeaderboardStore } from "@/stores/useLeaderboardStore.js";
import { useUserStore } from "@/stores/useUserStore.js";
import { useAuthStore } from "@/stores/useAuthStore.js";

const router = useRouter();
const auth = useAuthStore();
const leaderboardStore = useLeaderboardStore();
const userStore = useUserStore();

const setLeaderboardType = (type) => {
  // Chama a store pedindo a página 1 do novo tipo
  leaderboardStore.fetchLeaderboard(type, 1);
  if (auth.isAuthenticated) {
    leaderboardStore.fetchMyRank(type);
  }
};

onMounted(() => {
  leaderboardStore.fetchLeaderboard();
  if (auth.isAuthenticated) {
    leaderboardStore.fetchMyRank('match_wins');
  }
});
</script>
<template>
  <div class="text-center px-5 py-16">
    <h1 class="text-4xl md:text-5xl font-extrabold text-yellow-200 mb-6 drop-shadow-[0_0_8px_rgba(255,255,150,0.3)]">
      Scoreboard
    </h1>

    <div class="w-11/12 md:w-4/5 lg:w-3/5 mx-auto grid md:grid-cols-3 gap-6 md:gap-8 text-left items-start">

      <section v-if="auth.isAuthenticated && userStore.type !== 'A'"
        class="md:col-span-1 bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-5 md:p-6 h-fit">
        <h2 class="text-xl font-semibold text-yellow-200 mb-4 flex items-center gap-2">
          <span>Personal Bests</span>
        </h2>
        <ul class="space-y-3 text-sm text-yellow-50">
          <li class="flex justify-between border-b border-yellow-800/50 pb-1">
            <span>My Rank</span>
            <div class="flex items-center gap-2">
              <button v-if="leaderboardStore.myRank !== '-'" @click="leaderboardStore.goToMyRank()" class="text-[10px] uppercase font-bold bg-yellow-900/40 hover:bg-yellow-700
                            text-yellow-200 px-2 py-0.5 rounded border border-yellow-800 transition-colors"
                id="btn_find_me" title="Go to my page">
                Find Me
              </button>
              <span class="font-bold text-yellow-300 text-lg">
                #{{ leaderboardStore.myRank }}
              </span>
            </div>
          </li>
          <li class="flex justify-between">
            <span>Total Matches</span>
            <span class="font-semibold">{{ userStore.totalMatches }}</span>
          </li>
          <li class="flex justify-between">
            <span>Total Games</span>
            <span class="font-semibold">{{ userStore.totalGames }}</span>
          </li>
          <li class="flex justify-between">
            <span>Match Wins</span>
            <span class="font-semibold text-green-300">{{ userStore.matchWins }}</span>
          </li>
          <li class="flex justify-between">
            <span>Game Wins</span>
            <span class="font-semibold text-green-300">{{ userStore.gameWins }}</span>
          </li>
          <li class="flex justify-between">
            <span>Capotes</span>
            <span class="font-semibold">{{ userStore.capotes }}</span>
          </li>
          <li class="flex justify-between">
            <span>Bandeiras</span>
            <span class="font-semibold">{{ userStore.bandeiras }}</span>
          </li>
        </ul>
      </section>

      <section v-else class="md:col-span-1 bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-6 flex flex-col items-center justify-center text-center h-fit">
        <h2 class="text-xl font-bold text-yellow-200 mb-4">Track Your Stats</h2>
        <p class="text-gray-400 text-sm mb-6" v-if="!auth.isAuthenticated">
          Login to see your global rank and personal statistics.
        </p>
        <p class="text-gray-400 text-sm mb-6" v-else>
          Personal bests are disabled for admin accounts.
        </p>
        <button v-if="!auth.isAuthenticated" @click="router.push('/login')" class="bg-red-700 hover:bg-red-800 text-yellow-100 font-bold py-2 px-6 rounded-lg transition-all shadow-lg border border-red-800">
          Login
        </button>
      </section>

      <section
        class="md:col-span-2 bg-black/60 rounded-2xl border border-yellow-700 shadow-xl overflow-hidden flex flex-col">
        <div class="flex border-b border-yellow-700">
          <button @click="setLeaderboardType('match_wins')"
            class="flex-1 py-3 text-sm md:text-base font-bold transition-colors hover:bg-yellow-900/30"
            id="btn_most_match_wins"
            :class="leaderboardStore.currentType === 'match_wins' ? 'bg-red-700 text-white' : 'text-yellow-200/70'">
            Most Match Wins
          </button>
          <button @click="setLeaderboardType('game_wins')"
            class="flex-1 py-3 text-sm md:text-base font-bold transition-colors hover:bg-yellow-900/30 border-l border-yellow-700"
            id="btn_most_game_wins"
            :class="leaderboardStore.currentType === 'game_wins' ? 'bg-red-700 text-white' : 'text-yellow-200/70'">
            Most Game Wins
          </button>
        </div>

        <div class="p-4 md:p-6 min-h-[400px]">

          <div v-if="leaderboardStore.isLoading"
            class="flex flex-col items-center justify-center h-40 text-yellow-200/50 italic animate-pulse">
            Loading rankings...
          </div>

          <div v-else-if="!leaderboardStore.users || leaderboardStore.users.length === 0"
            class="flex flex-col items-center justify-center h-40 text-yellow-200/50 italic">
            No players found for this category.
          </div>

          <ul v-else class="space-y-2">
            <li
              class="flex text-xs text-yellow-500/60 uppercase tracking-wider font-bold px-3 pb-2 border-b border-yellow-800">
              <span class="w-10 text-center">#</span>
              <span class="flex-1 ml-2">Player</span>
              <span class="w-20 text-right">Score</span>
            </li>

            <li v-for="(user, index) in leaderboardStore.users" :key="user.id" class="flex items-center bg-black/40 hover:bg-white/5 rounded-lg p-2 transition-colors
                    border border-transparent hover:border-yellow-800" :class="[
                      auth.user && user.id === auth.user.id
                        ? 'bg-yellow-900/40 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                        : 'bg-black/40 border-transparent hover:bg-white/5 hover:border-yellow-800'
                    ]">
              <span class="w-10 text-center font-bold text-yellow-500 text-lg">
                {{ (leaderboardStore.pagination.currentPage - 1) * 10 + index + 1 }}
              </span>

              <div class="flex-1 flex items-center gap-3 ml-2 overflow-hidden">
                <img :src="user.avatar_url || '/icons/null_profile.png'" alt="Avatar"
                  class="w-8 h-8 md:w-10 md:h-10 rounded-full border border-yellow-600 bg-gray-800 object-cover flex-shrink-0">
                <div class="flex flex-col truncate">
                  <span class="text-yellow-100 font-semibold truncate text-sm md:text-base">
                    {{ user.nickname }}
                  </span>
                </div>
              </div>

              <span class="w-24 text-right font-bold text-yellow-300 text-base md:text-lg">
                {{ user.score }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="leaderboardStore.pagination.lastPage > 1"
          class="bg-black/80 p-3 border-t border-yellow-700 flex items-center justify-between">
          <button @click="leaderboardStore.changePage(leaderboardStore.pagination.currentPage - 1)"
            :disabled="leaderboardStore.pagination.currentPage <= 1 || leaderboardStore.isLoading"
            class="text-xs md:text-sm px-3 py-1 rounded bg-yellow-900/40 text-yellow-100 hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
            Previous
          </button>

          <span class="text-xs md:text-sm text-gray-400">
            Page <span class="text-yellow-200 font-bold">{{
              leaderboardStore.pagination.currentPage
              }}</span> of {{ leaderboardStore.pagination.lastPage }}
          </span>

          <button @click="leaderboardStore.changePage(leaderboardStore.pagination.currentPage + 1)"
            :disabled="leaderboardStore.pagination.currentPage >= leaderboardStore.pagination.lastPage || leaderboardStore.isLoading"
            class="text-xs md:text-sm px-3 py-1 rounded bg-yellow-900/40 text-yellow-100 hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
            Next
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
