<script setup>
import { computed, ref, watch } from "vue";
import api from '../services/api';
import { useShopStore } from "@/stores/useShopStore";
import { useHistoryStore } from '@/stores/useHistoryStore.js';
import { useStatsGameStore } from '@/stores/useStatsGameStore.js';
import { useAdminStore } from "@/stores/useAdminStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import AvatarUpload from '@/components/AvatarUpload.vue';
import { Ban, CheckCircle, Trash2, User, ShieldUser, ArrowLeftRight, UserSearch, ChartNoAxesGantt, ChartColumnBig } from 'lucide-vue-next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "vue-chartjs";

const authStore = useAuthStore();
const adminStore = useAdminStore();
const shopStore = useShopStore();
const historyStore = useHistoryStore();
const gameStore = useStatsGameStore();

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const customTab = ref("users");
const searchQuery = ref("");
const viewMatchHistory = ref(false);
const viewStats = ref(false);
const viewTransactions = ref(false);
const usersList = ref([]);
const isLoading = ref(false);

// Estado do Dialog
const showDialog = ref(false);
const dialogMessage = ref("");
const dialogAction = ref(null);

// Variáveis para o formulario de criar admin
const name = ref("");
const nickname = ref("");
const email = ref("");
const password = ref("");
const avatarFile = ref(null);

// Chave para forçar o reset do componente de upload
const avatarUploadKey = ref(0);

const submit = async () => {
  try {
    await adminStore.createAdmin({
      name: name.value,
      nickname: nickname.value,
      email: email.value,
      password: password.value,
      avatar: avatarFile.value
    });

    await adminStore.fetchAdmins();

    // Form Clear
    name.value = "";
    nickname.value = "";
    email.value = "";
    password.value = "";
    avatarFile.value = null;

    // forçar o componente AvatarUpload a limpar a pré-visualização
    avatarUploadKey.value++;

  } catch (error) {
    console.error("Error creating admin:", error);
  }
};

const selectedUser = ref(null);
let debounceTimer = null;

const createdAtLabel = computed(() => {
  const raw = adminStore.userStats?.user?.created_at || selectedUser.value?.created_at;
  if (!raw) return null;
  return new Date(raw).toLocaleDateString('pt-PT');
});

const formatLabel = (isoDate) => {
  if (!isoDate) return '';
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[1]}/${parts[2]}`;
};

const coinsActivity = computed(() => adminStore.userStats?.stats?.coins_activity || []);
const coinsChartData = computed(() => ({
  labels: coinsActivity.value.map(item => formatLabel(item.date)),
  datasets: [
    {
      label: "Coins In",
      data: coinsActivity.value.map(item => item.coins_in),
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.2)",
      tension: 0.3,
      fill: true
    },
    {
      label: "Coins Out",
      data: coinsActivity.value.map(item => item.coins_out),
      borderColor: "#f97316",
      backgroundColor: "rgba(249,115,22,0.2)",
      tension: 0.3,
      fill: true
    }
  ]
}));

const coinsChartOptions = {
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

const getSuitIcon = (suit) => {
  const icons = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  return icons[suit] || suit;
};

const getSuitColor = (suit) => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-400' : 'text-gray-200';
};

const getMatchReward = (match) => {
  if (!selectedUser.value) return 0;

  // Se o selectedUser não for o winner, reward é 0
  if (match.winner_user_id !== selectedUser.value.id) return 0;

  let userPoints = match.player1_user_id === selectedUser.value.id ? match.player1_points : match.player2_points;

  if (userPoints === 120) return 6; // Bandeira
  if (userPoints >= 91) return 4;   // Capote
  return 3;                         // Win
};

const getUserAvatar = (user) => {
  // Ver se o utilizador tem um avatar custom ativo
  if (user.custom && user.custom.active_avatar) {
    return shopStore.getAvatarPreview(user.custom.active_avatar);
  }

  if (user.avatar_url) {
    return user.avatar_url;
  }

  // Ver se o utilizador tem uma foto carregada
  if (user.photo_avatar_filename) {
    return `/storage/photos_avatars/${user.photo_avatar_filename}`;
  }

  // Fallback para default null
  return "/icons/null_profile.png";
};

const fetchUsers = async () => {
  // Limpar a lista se a query estiver vazia
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    usersList.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const response = await api.get('/users', {
      params: { search: searchQuery.value }
    });

    usersList.value = response.data.data;
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    isLoading.value = false;
  }
};

const selectUser = (user) => {
  selectedUser.value = user;
  usersList.value = [];
  searchQuery.value = "";
  viewMatchHistory.value = false;
  viewStats.value = false;
  viewTransactions.value = false;
  adminStore.clearUserStats();
};

const clearSelection = () => {
  selectedUser.value = null;
  viewStats.value = false;
  adminStore.clearUserStats();
};

const toggleMatchHistory = () => {
  viewStats.value = false;
  viewTransactions.value = false;
  viewMatchHistory.value = !viewMatchHistory.value;
};

const toggleStats = () => {
  viewMatchHistory.value = false;
  viewTransactions.value = false;
  viewStats.value = !viewStats.value;
};

const toggleBlock = () => {
  if (!selectedUser.value) return;

  const isBlocking = !selectedUser.value.blocked;
  const actionText = isBlocking ? "block" : "unblock";

  dialogMessage.value = `Are you sure you want to ${actionText} user <span class="text-yellow-300 font-bold">${selectedUser.value.nickname}</span>?`;

  // Configurar Ação (Função anónima que chama a store)
  dialogAction.value = async () => {
    await adminStore.blockUser(selectedUser.value.id);

    // Atualizar UI localmente
    selectedUser.value.blocked = !selectedUser.value.blocked;
    console.log(`User ${actionText}ed!`);
  };

  // Abrir Dialog
  showDialog.value = true;
};

const deleteUser = () => {
  if (!selectedUser.value) return;

  dialogMessage.value = `Are you sure you want to delete user <span class="text-yellow-300 font-bold">${selectedUser.value.nickname}</span>?`;

  // Configurar Ação (Função anónima que chama a store)
  dialogAction.value = async () => {
    await adminStore.deleteUser(selectedUser.value.id);
    console.log("User deleted!");
    clearSelection();
    fetchUsers();
  };

  // Abrir Dialog
  showDialog.value = true;
};

const deleteAdmin = (admin) => {
  if (admin.id === authStore.user.id) {
    alert("You can't delete yourself!");
    return;
  }

  dialogMessage.value = `Are you sure you want to delete administrator <span class="text-yellow-300 font-bold">${admin.nickname || admin.name}</span>?`;

  dialogAction.value = async () => {
    try {
      await adminStore.deleteUser(admin.id);
      await adminStore.fetchAdmins();
      console.log("Admin deleted!");
    } catch (e) {
      console.error(e);
    }
  };

  showDialog.value = true;
};

const toggleTransactions = () => {
  viewMatchHistory.value = false;
  viewStats.value = false;
  viewTransactions.value = !viewTransactions.value;
};

const changeTransactionPage = (page) => {
  if (selectedUser.value) {
    adminStore.fetchUserTransactions(selectedUser.value.id, page);
  }
};

// Observar mudanças na query de pesquisa para buscar utilizadores com debounce
watch(searchQuery, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchUsers();
  }, 300);
});

// Quando mudar de tab, limpar a pesquisa e a lista
watch(customTab, (newVal) => {

  if (newVal === 'users') {
    searchQuery.value = "";
    usersList.value = [];
    selectedUser.value = null;
  } else if (newVal === 'admin_add') {
    adminStore.fetchAdmins();
  }
});

// Lógica para carregar o histórico quando abre a secção
watch(viewMatchHistory, (isOpen) => {
  if (isOpen && selectedUser.value) {

    // Passamos o ID do user selecionado para a store
    historyStore.fetchHistory(1, selectedUser.value.id);
  }
});

watch(viewTransactions, (isOpen) => {
  if (isOpen && selectedUser.value) {
    adminStore.fetchUserTransactions(selectedUser.value.id, 1);
  }
});

watch(viewStats, (isOpen) => {
  if (isOpen && selectedUser.value) {
    adminStore.fetchUserStats(selectedUser.value.id);
  }
});

// Recarregar histórico se os filtros mudarem enquanto a view está aberta
watch(() => historyStore.filters, () => {
  if (viewMatchHistory.value && selectedUser.value) {
    historyStore.fetchHistory(1, selectedUser.value.id);
  }
}, { deep: true }
);
</script>
<template>
  <ConfirmDialog v-if="showDialog" :show="showDialog" :message="dialogMessage" :action="dialogAction"
    @close="showDialog = false" />

  <div class="text-center px-5 py-16">
    <h1 class="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-8">Admin Control Panel</h1>

    <div
      class="relative w-11/12 md:w-3/5 mx-auto bg-black/60 rounded-2xl border border-yellow-700 shadow-xl px-6 py-6 flex flex-col items-center">

      <div class="w-full flex bg-black/40 rounded-xl border border-yellow-700/50 p-1 mb-8">
        <button @click="customTab = 'users'"
          :class="['flex-1 basis-0 py-3 px-2 rounded-lg font-semibold text-xs md:text-base transition-all duration-300 whitespace-nowrap', customTab === 'users' ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg' : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20']">
          <span class="flex items-center justify-center gap-2">
            <User class="hidden md:block w-6 h-6" /> Users
          </span>
        </button>
        <button @click="customTab = 'admin_add'"
          :class="['flex-1 basis-0 py-3 px-2 rounded-lg font-semibold text-xs md:text-base transition-all duration-300 whitespace-nowrap', customTab === 'admin_add' ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg' : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20']">
          <span class="flex items-center justify-center gap-2">
            <ShieldUser class="hidden md:block w-6 h-6" /> Admin
          </span>
        </button>
      </div>

      <div v-if="customTab === 'users'" class="w-full">
        <div class="relative w-full mb-4">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <UserSearch v-if="!isLoading" class="text-yellow-600 w-6 h-6" />
            <span v-else
              class="animate-spin h-5 w-5 border-2 border-yellow-600 border-t-transparent rounded-full"></span>
          </div>
          <input v-model="searchQuery" type="text" placeholder="Search users by nickname, name, or email..."
            class="w-full bg-black/40 border border-yellow-700/50 rounded-xl pl-12 pr-4 py-4 text-yellow-100 placeholder-yellow-700/50 focus:outline-none focus:border-yellow-500 transition-all shadow-inner" />

          <div v-if="usersList.length > 0 || (isLoading && searchQuery)"
            class="absolute top-full left-0 w-full z-50 bg-[#121213] rounded-xl border border-yellow-700/50 overflow-hidden shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar mt-2">
            <ul class="divide-y divide-yellow-700/20">
              <li v-for="user in usersList" :key="user.id" @click="selectUser(user)"
                class="px-4 py-3 hover:bg-yellow-900/20 transition-colors flex items-center gap-4 group cursor-pointer">
                <div
                  class="w-10 h-10 rounded-full bg-yellow-900/50 border border-yellow-700/50 overflow-hidden flex-shrink-0 group-hover:border-yellow-500 transition-colors">
                  <img :src="getUserAvatar(user)" class="w-full h-full object-cover"
                    @error="$event.target.src = '/icons/null_profile.png'" />
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-yellow-100 group-hover:text-white transition-colors">{{ user.nickname ||
                    user.name }}</div>
                  <div class="text-xs text-yellow-600 group-hover:text-yellow-500"><span v-if="user.email">{{ user.email
                  }}</span></div>
                </div>
              </li>
              <li v-if="usersList.length === 0 && !isLoading"
                class="px-4 py-4 text-center text-yellow-700 italic text-sm">No users found.</li>
            </ul>
          </div>
        </div>

        <transition name="fade">
          <div v-if="selectedUser">
            <div
              class="w-full bg-gradient-to-b from-yellow-900/10 to-black border border-yellow-600/50 rounded-xl p-6 mt-4 shadow-lg flex flex-col items-center">
              <div class="flex flex-col md:flex-row items-center gap-6 mb-8 w-full">
                <div class="relative">
                  <img :src="getUserAvatar(selectedUser)"
                    class="w-24 h-24 rounded-full border-4 border-yellow-600 shadow-xl object-cover"
                    @error="$event.target.src = '/icons/null_profile.png'" />
                </div>
                <div class="text-center md:text-left flex-1">
                  <h3 class="text-2xl font-bold text-white">{{ selectedUser.nickname }}</h3>
                  <p class="text-yellow-500 text-sm mb-1">{{ selectedUser.name }}</p>
                  <p class="text-gray-400 text-xs font-mono mb-3">{{ selectedUser.email }}</p>
                  <p v-if="createdAtLabel" class="text-gray-500 text-xs mb-3">Created: {{ createdAtLabel }}</p>
                  <div class="flex gap-2 justify-center md:justify-start">
                    <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      :class="selectedUser.type === 'A' ? 'bg-purple-900/50 text-purple-200 border border-purple-700' : 'bg-blue-900/50 text-blue-200 border border-blue-700'">
                      {{ selectedUser.type === 'A' ? 'Admin' : 'Player' }}
                    </span>
                    <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      :class="selectedUser.blocked ? 'bg-red-900/50 text-red-200 border border-red-700' : 'bg-green-900/50 text-green-200 border border-green-700'">
                      {{ selectedUser.blocked ? 'Blocked' : 'Active' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid md:grid-cols-4 gap-4 w-full">
                <button @click="toggleMatchHistory"
                  class="flex flex-row align-middle items-center justify-center mb-2 md:mb-0 w-full h-full bg-red-700 hover:bg-red-800 text-yellow-100 px-3 py-2 rounded-full font-semibold border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
                  <ChartNoAxesGantt class="w-6 h-6" />
                  <span class="text-xs font-bold uppercase ms-1">View Matches</span>
                </button>
                <button @click="toggleStats"
                  class="flex flex-row align-middle items-center justify-center mb-2 md:mb-0 w-full h-full bg-red-700 hover:bg-red-800 text-yellow-100 px-3 py-2 rounded-full font-semibold border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
                  <ChartColumnBig class="w-6 h-6" />
                  <span class="text-xs font-bold uppercase ms-1">View Stats</span>
                </button>
                <button @click="toggleTransactions"
                  class="flex flex-row align-middle items-center justify-center mb-2 md:mb-0 w-full h-full bg-red-700 hover:bg-red-800 text-yellow-100 px-3 py-2 rounded-full font-semibold border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
                  <ArrowLeftRight class="w-6 h-6" />
                  <span class="text-xs font-bold uppercase ms-1">View Transactions</span>
                </button>
                <button @click="toggleBlock"
                  class="flex flex-row align-middle items-center justify-center mb-2 md:mb-0 w-full h-full text-yellow-100 px-3 py-2 rounded-full font-semibold border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                  :class="selectedUser.blocked ? 'bg-orange-700 hover:bg-orange-800' : 'bg-red-700 hover:bg-red-800'">
                  <component :is="selectedUser.blocked ? CheckCircle : Ban" class="w-6 h-6" /> <span
                    class="text-xs font-bold uppercase ms-1">{{ selectedUser.blocked ? 'Unblock' : 'Block' }}</span>
                </button>
                <button @click="deleteUser"
                  class="flex flex-row align-middle items-center justify-center mb-2 md:mb-0 w-full h-full bg-red-700 hover:bg-red-800 text-yellow-100 px-3 py-2 rounded-full font-semibold border border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95">
                  <Trash2 class="w-6 h-6" /> <span class="text-xs font-bold uppercase ms-1">Delete</span>
                </button>
              </div>
            </div>

            <div v-if="viewStats"
              class="w-full bg-[#0a0a0a]/80 border border-yellow-600/50 rounded-xl p-4 mt-4 shadow-lg flex flex-col items-center">
              <h3 class="text-lg font-bold text-yellow-300 mb-4">{{ selectedUser.nickname }}'s Stats</h3>

              <div v-if="adminStore.userStatsLoading" class="p-2 text-gray-400 text-center text-xs italic">
                Loading stats...
              </div>
              <div v-else-if="adminStore.userStatsError" class="p-2 text-red-300 text-center text-xs italic">
                {{ adminStore.userStatsError }}
              </div>
              <div v-else-if="adminStore.userStats && adminStore.userStats.stats"
                class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full text-left text-xs">
                <div class="bg-black/40 border border-yellow-800/40 rounded-lg p-3">
                  <div class="text-yellow-400/80 uppercase text-[10px]">Matches Played</div>
                  <div class="text-yellow-100 text-lg font-bold">{{ adminStore.userStats.stats.total_matches }}</div>
                </div>
                <div class="bg-black/40 border border-yellow-800/40 rounded-lg p-3">
                  <div class="text-yellow-400/80 uppercase text-[10px]">Match Wins</div>
                  <div class="text-green-300 text-lg font-bold">{{ adminStore.userStats.stats.match_wins }}</div>
                </div>
                <div class="bg-black/40 border border-yellow-800/40 rounded-lg p-3">
                  <div class="text-yellow-400/80 uppercase text-[10px]">Games Played</div>
                  <div class="text-yellow-100 text-lg font-bold">{{ adminStore.userStats.stats.total_games }}</div>
                </div>
                <div class="bg-black/40 border border-yellow-800/40 rounded-lg p-3">
                  <div class="text-yellow-400/80 uppercase text-[10px]">Game Wins</div>
                  <div class="text-green-300 text-lg font-bold">{{ adminStore.userStats.stats.game_wins }}</div>
                </div>
                <div class="bg-black/40 border border-yellow-800/40 rounded-lg p-3">
                  <div class="text-yellow-400/80 uppercase text-[10px]">Capotes</div>
                  <div class="text-yellow-100 text-lg font-bold">{{ adminStore.userStats.stats.capotes }}</div>
                </div>
                <div class="bg-black/40 border border-yellow-800/40 rounded-lg p-3">
                  <div class="text-yellow-400/80 uppercase text-[10px]">Bandeiras</div>
                  <div class="text-yellow-100 text-lg font-bold">{{ adminStore.userStats.stats.bandeiras }}</div>
                </div>
              </div>
              <div v-if="coinsActivity.length" class="w-full mt-4">
                <h4 class="text-yellow-200 text-sm font-semibold mb-2">Coins Activity (Last 30 Days)</h4>
                <div class="h-56">
                  <Line :data="coinsChartData" :options="coinsChartOptions" />
                </div>
              </div>
            </div>

            <div v-if="viewMatchHistory"
              class="w-full bg-[#0a0a0a]/80 border border-yellow-600/50 rounded-xl p-4 mt-4 shadow-lg flex flex-col items-center">
              <h3 class="text-lg font-bold text-yellow-300 mb-4">{{ selectedUser.nickname }}'s Match History</h3>

              <div class="w-full mb-4 space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <div class="flex flex-col text-[10px] md:text-xs">
                    <label class="mb-0.5 text-yellow-200 text-left">From</label>
                    <input v-model="historyStore.filters.date_from" type="date"
                      class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1 text-yellow-50 text-[10px] md:text-xs focus:outline-none" />
                  </div>
                  <div class="flex flex-col text-[10px] md:text-xs">
                    <label class="mb-0.5 text-yellow-200 text-left">To</label>
                    <input v-model="historyStore.filters.date_to" type="date"
                      class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1 text-yellow-50 text-[10px] md:text-xs focus:outline-none" />
                  </div>
                  <div class="flex flex-col text-[10px] md:text-xs">
                    <label class="mb-0.5 text-yellow-200 text-left">Result</label>
                    <select v-model="historyStore.filters.result"
                      class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1 text-yellow-50 text-[10px] md:text-xs focus:outline-none">
                      <option value="ALL">All</option>
                      <option value="WIN">Wins</option>
                      <option value="LOSS">Losses</option>
                      <option value="DRAW">Draw</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="flex flex-col text-[10px] md:text-xs">
                    <label class="mb-0.5 text-yellow-200 text-left">Achievement</label>
                    <select v-model="historyStore.filters.achievement"
                      class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1 text-yellow-50 text-[10px] md:text-xs focus:outline-none">
                      <option value="ALL">All</option>
                      <option value="Capote">Capote</option>
                      <option value="Bandeira">Bandeira</option>
                    </select>
                  </div>
                  <div class="flex flex-col text-[10px] md:text-xs">
                    <label class="mb-0.5 text-yellow-200 text-left">Sort</label>
                    <select v-model="historyStore.filters.sort"
                      class="bg-black/60 border border-yellow-700 rounded-lg px-2 py-1 text-yellow-50 text-[10px] md:text-xs focus:outline-none">
                      <option value="DESC">Newest</option>
                      <option value="ASC">Oldest</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="w-full bg-black/40 rounded-lg border border-yellow-800/50 overflow-hidden">
                <div v-if="historyStore.loading" class="p-2 text-gray-400 text-center text-xs italic">Loading...</div>
                <div v-else-if="!historyStore.matches || historyStore.matches.length === 0"
                  class="p-4 text-center text-xs text-yellow-200/60">
                  No matches found.
                </div>
                <div v-else>
                  <div v-for="match in historyStore.matches" :key="match.id"
                    class="border-b border-yellow-800/40 last:border-0">

                    <button
                      class="w-full flex flex-col md:flex-row md:items-center justify-between gap-1 px-3 py-2 text-left hover:bg-yellow-900/10 transition"
                      @click="historyStore.toggleMatch(match.id)">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-yellow-100 w-32">{{ match.ended_at ? new
                          Date(match.ended_at).toLocaleString('pt-PT') : 'N/A' }}</span>

                        <span
                          :class="['text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                            match.winner_user_id === selectedUser.id ? 'bg-green-700 text-green-50'
                              : (match.winner_user_id === null ? 'bg-gray-600 text-gray-200' : 'bg-red-700 text-red-50')]">
                          {{ match.winner_user_id === selectedUser.id ? 'Win' : (match.winner_user_id === null ? 'Draw'
                            : 'Loss') }}
                        </span>

                        <span class="text-xs font-bold text-yellow-200 ml-1">
                          {{ match.player1_user_id === selectedUser.id ? match.player1_points : match.player2_points }}
                          -
                          {{ match.player1_user_id === selectedUser.id ? match.player2_points : match.player1_points }}
                        </span>
                      </div>
                      <div class="flex gap-3 text-[10px] text-yellow-100/70">
                        <span v-if="match.total_time !== null">
                          Dur: <span class="font-semibold text-yellow-100">{{ Math.max(1, Math.round(match.total_time /
                            60)) }}m</span>
                        </span>
                        <span>
                          Coins: <span :class="getMatchReward(match) > 0 ? 'text-yellow-300' : 'text-gray-400'">{{
                            getMatchReward(match) > 0 ? '+' : '' }}{{ getMatchReward(match) }}</span>
                        </span>
                      </div>
                    </button>

                    <transition name="fade">
                      <div v-if="historyStore.expandedMatchId === match.id"
                        class="bg-black/50 px-3 py-2 border-t border-yellow-800/30">
                        <div v-if="gameStore.loading" class="text-xs text-yellow-200/50 italic">Loading games...</div>
                        <div v-else v-for="game in gameStore.games" :key="game.id"
                          class="mb-1 last:mb-0 border border-yellow-800/20 rounded-lg overflow-hidden bg-black/20">

                          <button class="w-full flex justify-between items-center px-3 py-2 hover:bg-white/5 transition"
                            @click="gameStore.toggleGame(match.id, game.id)">
                            <div class="flex items-center gap-2 text-xs text-yellow-100">
                              <span class="text-yellow-100/80">{{ game.ended_at ? new
                                Date(game.ended_at).toLocaleString() : '...' }}</span>
                              <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                :class="game.is_draw ? 'bg-gray-600 text-gray-100' : (game.winner_user_id === selectedUser.id ? 'bg-green-700 text-green-50' : 'bg-red-700 text-red-50')">
                                {{ game.is_draw ? 'Draw' : (game.winner_user_id === selectedUser.id ? 'Win' : 'Loss') }}
                              </span>
                            </div>
                            <div class="flex items-center gap-3">
                              <span v-if="game.total_time != null" class="text-[10px] text-yellow-100/70">{{ Math.max(1,
                                Math.round(game.total_time / 60)) }} min</span>
                              <span class="text-xs font-bold text-yellow-100">
                                {{ game.player1_user_id === selectedUser.id ? game.player1_points : game.player2_points
                                }} -
                                {{ game.player1_user_id === selectedUser.id ? game.player2_points : game.player1_points
                                }}
                              </span>
                              <span v-if="gameStore.getGameLabel(game, selectedUser.id)"
                                :class="['text-[10px] font-bold uppercase', gameStore.getGameLabel(game, selectedUser.id) === 'Capote' ? 'text-yellow-400' : 'text-red-400']">
                                {{ gameStore.getGameLabel(game, selectedUser.id) }}
                              </span>
                            </div>
                          </button>

                          <div v-if="gameStore.expandedGameKey === (match.id + '-' + game.id)"
                            class="bg-black/40 p-2 border-t border-yellow-800/10">
                            <div v-if="game.tricks && game.tricks.length > 0" class="overflow-x-auto">
                              <table class="w-full text-left text-[10px] md:text-xs">
                                <thead>
                                  <tr class="text-gray-500 uppercase border-b border-gray-700">
                                    <th class="py-1 text-center">#</th>
                                    <th class="py-1 text-center">User</th>
                                    <th class="py-1 text-center">Opp.</th>
                                    <th class="py-1 text-right">Pts</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="trick in game.tricks" :key="trick.trickNumber"
                                    class="border-b border-gray-800/30">
                                    <td class="py-1 text-center text-gray-500">{{ trick.trickNumber }}</td>
                                    <td class="py-1 text-center">
                                      <span :class="['font-bold', getSuitColor(trick.playerCard.suit)]">{{
                                        trick.playerCard.rank }}{{ getSuitIcon(trick.playerCard.suit) }}</span>
                                      <span v-if="trick.winner === 'player' || trick.winner === selectedUser.id"
                                        class="text-yellow-400 ml-1">👑</span>
                                    </td>
                                    <td class="py-1 text-center">
                                      <span :class="['font-bold', getSuitColor(trick.botCard.suit)]">{{
                                        trick.botCard.rank }}{{ getSuitIcon(trick.botCard.suit) }}</span>
                                      <span
                                        v-if="trick.winner === 'bot' || (trick.winner !== 'player' && trick.winner !== selectedUser.id)"
                                        class="text-yellow-400 ml-1">👑</span>
                                    </td>
                                    <td class="py-1 text-right text-gray-300">{{ trick.points }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div v-else class="text-xs text-gray-500 italic text-center py-1">No tricks available.</div>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>

                <div v-if="historyStore.lastPage > 1" class="flex justify-center gap-2 p-2 bg-black/30 text-xs">
                  <button @click="historyStore.changeMatchesPage(historyStore.currentPage - 1, selectedUser.id)"
                    :disabled="historyStore.currentPage <= 1"
                    class="px-2 py-0.5 bg-gray-800 rounded text-yellow-100 disabled:opacity-50 hover:bg-gray-700">Prev</button>
                  <span class="text-yellow-200">{{ historyStore.currentPage }} / {{ historyStore.lastPage }}</span>
                  <button @click="historyStore.changeMatchesPage(historyStore.currentPage + 1, selectedUser.id)"
                    :disabled="historyStore.currentPage >= historyStore.lastPage"
                    class="px-2 py-0.5 bg-gray-800 rounded text-yellow-100 disabled:opacity-50 hover:bg-gray-700">Next</button>
                </div>
              </div>
            </div>
            <div v-if="viewTransactions"
              class="w-full bg-[#0a0a0a]/80 border border-yellow-600/50 rounded-xl p-4 mt-4 shadow-lg flex flex-col items-center">

              <h3 class="text-lg font-bold text-yellow-300 mb-4">{{ selectedUser.nickname }}'s Transactions</h3>

              <div class="w-full bg-black/40 rounded-lg border border-yellow-800/50 overflow-hidden">
                <div v-if="adminStore.loading" class="p-2 text-gray-400 text-center text-xs italic">Loading...</div>

                <div v-else-if="!adminStore.userTransactions || adminStore.userTransactions.length === 0"
                  class="p-4 text-center text-xs text-yellow-200/60">
                  No transactions found.
                </div>

                <div v-else>
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr
                        class="bg-yellow-900/20 text-yellow-500 text-[10px] md:text-xs uppercase tracking-wider border-b border-yellow-800/30">
                        <th class="py-2 px-3">Date</th>
                        <th class="py-2 px-3 hidden sm:table-cell">Type</th>
                        <th class="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody class="text-yellow-100 text-xs divide-y divide-yellow-800/20">
                      <tr v-for="tx in adminStore.userTransactions" :key="tx.id"
                        class="hover:bg-white/5 transition-colors">

                        <td class="py-2 px-3 whitespace-nowrap">
                          <div class="flex flex-col">
                            <span class="font-medium">{{ new Date(tx.transaction_datetime).toLocaleDateString()
                              }}</span>
                            <span class="text-[10px] text-gray-500">{{ new
                              Date(tx.transaction_datetime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'})
                              }}</span>
                            <span class="text-[10px] text-yellow-500/80 sm:hidden mt-0.5">{{ tx.type_name }}</span>
                          </div>
                        </td>

                        <td class="py-2 px-3 hidden sm:table-cell">
                          {{ tx.type_name }}
                        </td>

                        <td class="py-2 px-3 text-right font-bold"
                          :class="tx.coins > 0 ? 'text-green-400' : 'text-red-400'">
                          {{ tx.coins > 0 ? '+' : '' }}{{ tx.coins }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-if="adminStore.userTransactionsMeta && adminStore.userTransactionsMeta.last_page > 1"
                  class="flex justify-center gap-2 p-2 bg-black/30 text-xs border-t border-yellow-800/30">
                  <button @click="changeTransactionPage(adminStore.userTransactionsMeta.current_page - 1)"
                    :disabled="adminStore.userTransactionsMeta.current_page <= 1"
                    class="px-2 py-0.5 bg-gray-800 rounded text-yellow-100 disabled:opacity-50 hover:bg-gray-700">Prev</button>
                  <span class="text-yellow-200 self-center">{{ adminStore.userTransactionsMeta.current_page }} / {{
                    adminStore.userTransactionsMeta.last_page }}</span>
                  <button @click="changeTransactionPage(adminStore.userTransactionsMeta.current_page + 1)"
                    :disabled="adminStore.userTransactionsMeta.current_page >= adminStore.userTransactionsMeta.last_page"
                    class="px-2 py-0.5 bg-gray-800 rounded text-yellow-100 disabled:opacity-50 hover:bg-gray-700">Next</button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <div v-if="customTab === 'admin_add'" class="w-full flex flex-col md:flex-row gap-6 mb-3">
        <div class="w-full md:w-auto flex-shrink-0 flex flex-col items-center md:items-start">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6 text-center w-full">
            Create Admin
          </h2>
          <form @submit.prevent="submit" class="text-gray-100 space-y-3 w-full sm:w-80 text-left">
            <div class="flex justify-center mb-4">
              <AvatarUpload :key="avatarUploadKey" @file-selected="(file) => avatarFile = file" size-class="w-32 h-32"
                button-class="w-14 h-14" icon-size="w-6 h-6" />
            </div>
            <div>
              <label for="name" class="block text-sm font-medium">Name</label>
              <input v-model="name" type="text" id="name" required
                class="mt-1.5 sm:mt-2 px-3 py-2.5 sm:py-2 block w-full bg-[#525252] rounded-md border border-[#403f3f] shadow-sm focus:outline-none focus:ring-1 focus:border-gray-800 focus:ring-gray-800 text-sm sm:text-base" />
            </div>
            <div>
              <label for="nickname" class="block text-sm font-medium">Nickname</label>
              <input v-model="nickname" type="text" id="nickname" required
                class="mt-1.5 sm:mt-2 px-3 py-2.5 sm:py-2 block w-full bg-[#525252] rounded-md border border-[#403f3f] shadow-sm focus:outline-none focus:ring-1 focus:border-gray-800 focus:ring-gray-800 text-sm sm:text-base" />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium">Email</label>
              <input v-model="email" type="email" id="email" required
                class="mt-1.5 sm:mt-2 px-3 py-2.5 sm:py-2 block w-full bg-[#525252] rounded-md border border-[#403f3f] shadow-sm focus:outline-none focus:ring-1 focus:border-gray-800 focus:ring-gray-800 text-sm sm:text-base" />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium">Password</label>
              <input v-model="password" type="password" id="password" required
                class="mt-1.5 sm:mt-2 px-3 py-2.5 sm:py-2 block w-full bg-[#525252] rounded-md border border-[#403f3f] shadow-sm focus:outline-none focus:ring-1 focus:border-gray-800 focus:ring-gray-800 text-sm sm:text-base" />
            </div>
            <div class="flex w-full justify-center pt-2">
              <button :disabled="adminStore.loading" type="submit"
                class="w-full mt-1 md:mt-11 justify-center cursor-pointer font-bold transition bg-red-600 px-8 py-3 sm:px-6 sm:py-2 rounded-lg border-red-700 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed">
                Create
              </button>
            </div>
            <p v-if="adminStore.error" class="text-red-500 text-sm text-center pt-2">{{ adminStore.error }}</p>
          </form>
        </div>
        <div class="flex-1 w-full flex flex-col h-full">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6 text-center">
            Current Admins
          </h2>

          <div class="flex-1 w-full flex flex-col h-full overflow-hidden">
            <div
              class="w-full bg-black/60 rounded-2xl border border-yellow-700 shadow-xl p-4 flex flex-col max-h-[600px]">

              <div v-if="adminStore.loading && adminStore.admins.length === 0"
                class="text-yellow-400 text-sm italic text-center p-4">Loading admins...</div>
              <div v-else-if="!adminStore.loading && adminStore.admins.length === 0"
                class="text-yellow-600 text-sm italic text-center p-4">No administrators found.</div>

              <div v-else class="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                <div v-for="admin in adminStore.admins" :key="admin.id"
                  class="flex items-center w-full justify-between bg-black/40 border border-yellow-700/40 rounded-lg px-4 py-3 hover:bg-yellow-900/10 transition group">

                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      class="w-10 h-10 rounded-full bg-yellow-900/30 border border-yellow-700/30 overflow-hidden flex-shrink-0">
                      <img :src="getUserAvatar(admin)" class="w-full h-full object-cover"
                        @error="$event.target.src = '/icons/null_profile.png'" />
                    </div>

                    <div class="flex flex-col text-left min-w-0 flex-1">
                      <span
                        class="text-sm font-semibold text-yellow-100 group-hover:text-white transition-colors truncate">
                        {{ admin.name }}
                      </span>
                      <span class="text-xs text-yellow-600 font-mono truncate">
                        {{ admin.email }}
                      </span>
                    </div>
                  </div>

                  <button
                    class="flex-shrink-0 p-2 ml-2 rounded-full bg-red-700/80 hover:bg-red-800 border border-red-900 shadow-md transition active:scale-95"
                    title="Delete admin" @click="deleteAdmin(admin)">
                    <Trash2 class="w-4 h-4 text-yellow-100" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(161, 98, 7, 0.5);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(161, 98, 7, 0.8);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
