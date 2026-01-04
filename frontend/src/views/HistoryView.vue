<script setup>
import {onMounted, watch} from "vue";
import {useAuthStore} from "@/stores/useAuthStore.js";
import {useHistoryStore} from '@/stores/useHistoryStore.js';
import {useStatsGameStore} from '@/stores/useStatsGameStore.js';

const auth = useAuthStore();
const historyStore = useHistoryStore();
const gameStore = useStatsGameStore();

// Move helper functions specific to History here
const getSuitIcon = (suit) => {
  const icons = {hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'};
  return icons[suit] || suit;
};

const getSuitColor = (suit) => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-400' : 'text-gray-200';
};

const getMatchReward = (match) => {
  if (match.winner_user_id !== auth.user.id) return 0;

  let myPoints = match.player1_user_id === auth.user.id ? match.player1_points : match.player2_points;

  if (myPoints === 120) return 6; // Bandeira
  if (myPoints >= 91) return 4;   // Capote
  return 3;                       // Win
};

onMounted(() => {
  historyStore.fetchHistory();
});

watch(() => historyStore.filters, () => {
    historyStore.fetchHistory(1);
  }, {deep: true}
);
</script>
<template>
  <!-- HISTORY -->
  <div class="flex flex-col items-center text-center px-5 py-16">
    <h1
      class="text-4xl md:text-5xl font-extrabold text-yellow-200 mb-2 drop-shadow-[0_0_10px_rgba(255,255,150,0.4)]">
      Match History
    </h1>
    <p class="text-lg text-gray-300 mb-6 italic">Review all your Bisca battles.</p>

    <!-- Filters & ordering -->
    <div
      class="w-11/12 md:w-4/5 lg:w-3/5 mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
      <!-- Date from -->
      <div class="flex flex-col text-xs md:text-sm" id="filter_date_from">
        <label class="mb-1 text-yellow-200">From</label>
        <input v-model="historyStore.filters.date_from" type="date"
               class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1.5 text-yellow-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
               id="from_date"/>
      </div>

      <!-- Date to -->
      <div class="flex flex-col text-xs md:text-sm" id="filter_date_to">
        <label class="mb-1 text-yellow-200">To</label>
        <input v-model="historyStore.filters.date_to" type="date"
               class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1.5 text-yellow-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
               id="to_date"/>
      </div>

      <!-- Result filter -->
      <div class="flex flex-col text-xs md:text-sm" id="filter_result">
        <label class="mb-1 text-yellow-200">Result</label>
        <select v-model="historyStore.filters.result"
                class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1.5 text-yellow-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400">
          <option value="ALL">All</option>
          <option value="WIN">Wins</option>
          <option value="LOSS">Losses</option>
          <option value="DRAW">Draw</option>
        </select>
      </div>

      <!-- Achievement filter -->
      <div class="flex flex-col text-xs md:text-sm" id="filter_achievement">
        <label class="mb-1 text-yellow-200">Achievement</label>
        <select v-model="historyStore.filters.achievement"
                class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1.5 text-yellow-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400">
          <option value="ALL">All</option>
          <option value="Capote">Capote</option>
          <option value="Bandeira">Bandeira</option>
        </select>
      </div>

      <!-- Sort direction -->
      <div class="flex flex-col text-xs md:text-sm md:col-span-2 lg:col-span-1"
           id="filter_sort_direction">
        <label class="mb-1 text-yellow-200">Order by date</label>
        <select v-model="historyStore.filters.sort"
                class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1.5 text-yellow-50 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400">
          <option value="DESC">Newest first</option>
          <option value="ASC">Oldest first</option>
        </select>
      </div>
    </div>

    <!-- Matches / Standalone games toggle -->
    <div class="w-11/12 md:w-4/5 lg:w-3/5 mx-auto mb-4">
      <div
        class="inline-flex w-full bg-black/60 border border-yellow-700 rounded-full p-1 shadow">
        <button
          type="button"
          class="flex-1 px-4 py-2 rounded-full text-sm md:text-base font-bold uppercase tracking-wide transition"
          :class="historyStore.mode === 'matches'
                ? 'bg-red-700 text-yellow-100'
                : 'text-yellow-200 hover:bg-yellow-900/15'"
          @click="historyStore.setMode('matches')">
          Matches
        </button>

        <button
          type="button"
          class="flex-1 px-4 py-2 rounded-full text-sm md:text-base font-bold uppercase tracking-wide transition"
          :class="historyStore.mode === 'standalone'
                ? 'bg-red-700 text-yellow-100'
                : 'text-yellow-200 hover:bg-yellow-900/15'"
          @click="historyStore.setMode('standalone')">
          Standalone games
        </button>
      </div>
      <p class="mt-2 text-xs md:text-sm text-yellow-200/70 italic text-left">
              <span v-if="historyStore.mode === 'matches'">
                Showing match results. Tap a match to see its games.
              </span>
        <span v-else>
                Showing standalone games. Tap a game to see its tricks.
              </span>
      </p>
    </div>

    <!-- History list -->
    <div
      class="w-11/12 md:w-4/5 lg:w-3/5 mx-auto bg-black/60 rounded-2xl shadow-xl border border-yellow-600 overflow-hidden">

      <!-- Loading -->
      <div v-if="historyStore.loading" class="p-4 text-gray-400 text-center italic">
        {{ historyStore.mode === 'matches' ? 'Loading matches...' : 'Loading games...' }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="historyStore.mode === 'matches'
              ? (!historyStore.matches || historyStore.matches.length === 0)
              : (!historyStore.standaloneGames || historyStore.standaloneGames.length === 0)"
        class="p-8 text-center"
      >
        <p class="text-yellow-200/80 text-base md:text-lg font-semibold mb-1"
           id="no_matches_found">
          {{
            historyStore.mode === 'matches' ? 'No matches found' : 'No standalone games found'
          }}
        </p>
        <p class="text-yellow-200/60 text-sm">
          {{
            historyStore.mode === 'matches'
              ? 'Start playing to build your match history!'
              : 'Play some multiplayer games to see them here.'
          }}
        </p>
      </div>

      <!-- Content -->
      <div v-else>

        <!-- Matches -->
        <div v-if="historyStore.mode === 'matches'">
          <div v-for="match in historyStore.matches" :key="match.id"
               class="border-b border-yellow-800/70">
            <button
              class="w-full flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 md:px-6 py-3 text-left hover:bg-yellow-900/15 transition"
              @click="historyStore.toggleMatch(match.id)">
              <div class="flex items-center gap-2">

                      <span class="text-sm md:text-base text-yellow-100" id="match_date">
                        {{
                          match.ended_at ? new Date(match.ended_at).toLocaleString('pt-PT') : 'Unknown date'
                        }}
                      </span>
                <span
                  :id="match.winner_user_id === auth.user.id ? 'result_win' : 'result_loss'"
                  class="text-xs md:text-sm px-2 py-0.5 rounded-full font-semibold"
                  :class="match.winner_user_id === auth.user.id ? 'bg-green-700 text-green-50' : 'bg-red-700 text-red-50'">
                        {{ match.winner_user_id === auth.user.id ? 'Win' : 'Loss' }}
                      </span>

                <span class="text-xs md:text-sm px-2 py-0.5 rounded-full font-semibold bg-yellow-800/70 text-yellow-100">
                        {{ historyStore.getGameModeLabel(match.type) }}
                      </span>

                <span class="text-xs md:text-sm font-bold text-yellow-200">
                        {{ match.my_wins }} - {{ match.opponent_wins }}
                      </span>
              </div>

              <div
                class="flex flex-wrap justify-between md:justify-end gap-3 text-xs md:text-sm text-yellow-100">
                      <span v-if="match.total_time !== null">
                        Duration:
                        <span class="font-semibold" id="match_duration">
                          {{ Math.max(1, Math.round(match.total_time / 60)) }} min
                        </span>
                      </span>
                <span>
                        Coins:
                        <span id="match_coins"
                              :class="['font-semibold', getMatchReward(match) > 0 ? 'text-yellow-300' : 'text-gray-400']">
                          {{ getMatchReward(match) > 0 ? '+' : '' }}{{ getMatchReward(match) }}
                        </span>
                      </span>
              </div>
            </button>

            <!-- Games + trick breakdown -->
            <transition name="fade">
              <div v-if="historyStore.expandedMatchId === match.id"
                   class="bg-black/70 px-4 md:px-6 pb-4 pt-1 text-left text-xs md:text-sm text-yellow-50">

                <div v-if="gameStore.loading" class="py-2 text-yellow-200/80 italic">
                  Loading games...
                </div>
                <div v-else-if="gameStore.error" class="py-2 text-red-300 italic">
                  {{ gameStore.error }}
                </div>

                <div v-else-if="Array.isArray(gameStore.games) && gameStore.games.length"
                     class="mt-2 space-y-2">
                  <div v-for="game in gameStore.games" :key="game.id"
                       class="border border-yellow-800/50 rounded-xl overflow-hidden">
                    <button
                      class="w-full flex flex-col md:flex-row md:items-center justify-between gap-2 px-3 md:px-4 py-2 text-left bg-black/40 hover:bg-black/60 transition"
                      @click="gameStore.toggleGame(match.id, game.id)">
                      <div class="flex items-center gap-2">
                              <span class="text-yellow-100" id="game_date">
                                {{
                                  game.ended_at
                                    ? new Date(game.ended_at).toLocaleString()
                                    : (game.began_at ? new Date(game.began_at).toLocaleString() : 'Unknown game date')
                                }}
                              </span>
                        <span
                          class="text-[11px] md:text-xs px-2 py-0.5 rounded-full font-semibold"
                          :class="game.is_draw
                                ? 'bg-gray-600 text-gray-100'
                                : (game.winner_user_id === auth.user.id
                                  ? 'bg-green-700 text-green-50'
                                  : 'bg-red-700 text-red-50')">
                                {{
                            game.is_draw
                              ? 'Draw'
                              : (game.winner_user_id === auth.user.id ? 'Win' : 'Loss')
                          }}
                              </span>

                        <span class="text-[11px] md:text-xs px-2 py-0.5 rounded-full font-semibold bg-yellow-800/70 text-yellow-100">
                                {{ historyStore.getGameModeLabel(game.type) }}
                              </span>
                      </div>

                      <div
                        class="flex flex-wrap justify-between md:justify-end gap-3 text-yellow-100">
                              <span v-if="game.total_time != null">
                                Duration:
                                <span class="font-semibold" id="game_duration">
                                  {{ Math.max(1, Math.round(game.total_time / 60)) }} min
                                </span>
                              </span>
                        <span
                          v-if="game.player1_points != null && game.player2_points != null">
                                Points:
                                <span class="font-semibold" id="game_points">
                                  {{
                                    game.player1_user_id === auth.user.id
                                      ? `${game.player1_points} - ${game.player2_points}`
                                      : `${game.player2_points} - ${game.player1_points}`
                                  }}
                                </span>
                                <span v-if="gameStore.getGameLabel(game, auth.user.id)"
                                      class="ml-4 text-s font-bold text-yellow-300">
                                  {{ gameStore.getGameLabel(game, auth.user.id) }}
                                </span>
                              </span>
                      </div>
                    </button>

                    <!-- tricks table -->
                    <transition name="fade">
                      <div v-if="gameStore.expandedGameKey === (match.id + '-' + game.id)"
                           class="bg-black/80 px-0 pb-3 pt-2 text-left text-[11px] md:text-xs text-yellow-50"
                           id="game_tricks">

                        <div v-if="game.tricks && game.tricks.length > 0"
                             class="overflow-x-auto">
                          <table class="w-full text-left border-collapse">
                            <thead>
                            <tr
                              class="text-[10px] md:text-xs text-gray-500 uppercase border-b border-gray-700">
                              <th class="py-1 text-center w-8">#</th>
                              <th class="py-1 text-center">You</th>
                              <th class="py-1 text-center">Opponent</th>
                              <th class="py-1 text-right pr-4">Pts</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="trick in game.tricks" :key="trick.trickNumber"
                                class="text-sm border-b border-gray-800/50 hover:bg-gray-700/30 transition">
                              <td class="py-2 text-center text-gray-500">{{
                                  trick.trickNumber
                                }}
                              </td>

                              <td class="py-2">
                                <div class="flex items-center justify-center gap-2">
                                        <span
                                          :class="['font-bold text-base md:text-lg', getSuitColor(trick.playerCard.suit)]">
                                          {{ trick.playerCard.rank }}{{
                                            getSuitIcon(trick.playerCard.suit)
                                          }}
                                        </span>
                                  <img
                                    v-if="trick.winner === 'player' || trick.winner === auth.user.id"
                                    src="/icons/crown_gold.svg" alt="winner"
                                    class="w-4 h-4 md:w-5 md:h-5 mb-1"/>
                                </div>
                              </td>

                              <td class="py-2">
                                <div class="flex items-center justify-center gap-2">
                                        <span
                                          :class="['font-bold text-base md:text-lg', getSuitColor(trick.botCard.suit)]">
                                          {{ trick.botCard.rank }}{{
                                            getSuitIcon(trick.botCard.suit)
                                          }}
                                        </span>
                                  <img
                                    v-if="trick.winner === 'bot' || (trick.winner !== 'player' && trick.winner !== auth.user.id)"
                                    src="/icons/crown_gold.svg" alt="winner"
                                    class="w-4 h-4 md:w-5 md:h-5 mb-1"/>
                                </div>
                              </td>

                              <td class="py-2 text-right pr-4 text-gray-100 font-mono">
                                {{ trick.points }}
                              </td>
                            </tr>
                            </tbody>
                          </table>
                        </div>

                        <div v-else class="italic text-yellow-200/70 px-4 py-2">
                          No trick data available for this game.
                        </div>

                      </div>
                    </transition>

                  </div>
                </div>

                <div v-else class="mt-2 italic text-yellow-200/70">
                  {{
                    historyStore.filters.achievement === 'ALL' && historyStore.filters.result === 'ALL'
                      ? 'No games recorded.'
                      : 'No games match the selected filters.'
                  }}
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Standalone games -->
        <div v-else>
          <div v-for="game in historyStore.standaloneGames" :key="game.id"
               class="border-b border-yellow-800/70">
            <button
              class="w-full flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 md:px-6 py-3 text-left hover:bg-yellow-900/15 transition"
              @click="gameStore.toggleStandaloneGame(game.id)">

              <div class="flex items-center gap-2">
                      <span class="text-sm md:text-base text-yellow-100">
                        {{
                          game.ended_at
                            ? new Date(game.ended_at).toLocaleString('pt-PT')
                            : (game.began_at ? new Date(game.began_at).toLocaleString('pt-PT') : 'Unknown date')
                        }}
                      </span>

                <span class="text-xs md:text-sm px-2 py-0.5 rounded-full font-semibold"
                      :class="game.is_draw
                          ? 'bg-gray-600 text-gray-100'
                          : (game.winner_user_id === auth.user.id ? 'bg-green-700 text-green-50' : 'bg-red-700 text-red-50')">
                        {{
                    game.is_draw ? 'Draw' : (game.winner_user_id === auth.user.id ? 'Win' : 'Loss')
                  }}
                      </span>

                <span class="text-xs md:text-sm px-2 py-0.5 rounded-full font-semibold bg-yellow-800/70 text-yellow-100">
                        {{ historyStore.getGameModeLabel(game.type) }}
                      </span>

                <span v-if="gameStore.getGameLabel(game, auth.user.id)"
                      class="text-xs font-bold text-yellow-300">
                        {{ gameStore.getGameLabel(game, auth.user.id) }}
                      </span>
              </div>

              <div
                class="flex flex-wrap justify-between md:justify-end gap-3 text-xs md:text-sm text-yellow-100">
                      <span v-if="game.total_time != null">
                        Duration:
                        <span class="font-semibold">{{
                            Math.max(1, Math.round(game.total_time / 60))
                          }} min</span>
                      </span>

                <span v-if="game.player1_points != null && game.player2_points != null">
                        Points:
                        <span class="font-semibold">
                          {{
                            game.player1_user_id === auth.user.id
                              ? `${game.player1_points} - ${game.player2_points}`
                              : `${game.player2_points} - ${game.player1_points}`
                          }}
                        </span>
                      </span>
              </div>
            </button>

            <!-- standalone tricks -->
            <transition name="fade">
              <div v-if="gameStore.expandedStandaloneGameId === game.id"
                   class="bg-black/80 px-0 pb-3 pt-2 text-left text-[11px] md:text-xs text-yellow-50">

                <div v-if="gameStore.loadingStandalone"
                     class="py-2 text-yellow-200/80 italic px-4">
                  Loading tricks...
                </div>

                <div v-else-if="gameStore.errorStandalone"
                     class="py-2 text-red-300 italic px-4">
                  {{ gameStore.errorStandalone }}
                </div>

                <div v-else-if="gameStore.standaloneTricks?.[game.id]?.length"
                     class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                    <tr
                      class="text-[10px] md:text-xs text-gray-500 uppercase border-b border-gray-700">
                      <th class="py-1 text-center w-8">#</th>
                      <th class="py-1 text-center">You</th>
                      <th class="py-1 text-center">Opponent</th>
                      <th class="py-1 text-right pr-4">Pts</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="trick in gameStore.standaloneTricks[game.id]"
                        :key="trick.trickNumber"
                        class="text-sm border-b border-gray-800/50 hover:bg-gray-700/30 transition">
                      <td class="py-2 text-center text-gray-500">{{ trick.trickNumber }}</td>

                      <td class="py-2">
                        <div class="flex items-center justify-center gap-2">
                                <span
                                  :class="['font-bold text-base md:text-lg', getSuitColor(trick.playerCard.suit)]">
                                  {{ trick.playerCard.rank }}{{
                                    getSuitIcon(trick.playerCard.suit)
                                  }}
                                </span>
                          <img
                            v-if="trick.winner === 'player' || trick.winner === auth.user.id"
                            src="/icons/crown_gold.svg" alt="winner"
                            class="w-4 h-4 md:w-5 md:h-5 mb-1"/>
                        </div>
                      </td>

                      <td class="py-2">
                        <div class="flex items-center justify-center gap-2">
                                <span
                                  :class="['font-bold text-base md:text-lg', getSuitColor(trick.botCard.suit)]">
                                  {{ trick.botCard.rank }}{{ getSuitIcon(trick.botCard.suit) }}
                                </span>
                          <img
                            v-if="trick.winner === 'bot' || (trick.winner !== 'player' && trick.winner !== auth.user.id)"
                            src="/icons/crown_gold.svg" alt="winner"
                            class="w-4 h-4 md:w-5 md:h-5 mb-1"/>
                        </div>
                      </td>

                      <td class="py-2 text-right pr-4 text-gray-100 font-mono">
                        {{ trick.points }}
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else class="italic text-yellow-200/70 px-4 py-2">
                  No trick data available for this game.
                </div>

              </div>
            </transition>

          </div>
        </div>

        <!-- Pagination -->
        <div v-if="historyStore.lastPage > 1"
             class="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-black/50 border-t border-yellow-700">
          <div class="text-xs md:text-sm text-yellow-100">
            Page {{ historyStore.currentPage }} of {{ historyStore.lastPage }} ·
            Total {{ historyStore.mode === 'matches' ? 'matches' : 'games' }}:
            {{ historyStore.total }}
          </div>

          <div class="flex items-center gap-2">
            <button
              class="bg-black/60 hover:bg-black/80 text-yellow-100 px-4 py-1.5 rounded-full border border-yellow-700/80 transition-all disabled:opacity-50"
              :disabled="historyStore.currentPage <= 1 || historyStore.loading"
              @click="historyStore.changeMatchesPage(historyStore.currentPage - 1)">
              Previous
            </button>

            <span class="text-yellow-200 text-xs md:text-sm">
                    Page {{ historyStore.currentPage }} of {{ historyStore.lastPage }}
                  </span>

            <button
              class="bg-red-700 hover:bg-red-800 text-yellow-100 px-4 py-1.5 rounded-full border border-yellow-700 transition-all disabled:opacity-50"
              :disabled="historyStore.currentPage >= historyStore.lastPage || historyStore.loading"
              @click="historyStore.changeMatchesPage(historyStore.currentPage + 1)">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
