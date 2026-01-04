import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';

// Layout
import AppLayout from '@/views/layouts/AppLayout.vue';

import LoginView from '@/views/LoginView.vue';
import GameHubView from '@/views/GameHubView.vue';
import HistoryView from '@/views/HistoryView.vue';
import StoreView from '@/views/StoreView.vue';
import AdminView from '@/views/AdminView.vue';
import ProfileView from '@/views/ProfileView.vue';
import LeaderboardView from '@/views/ScoreboardView.vue';
import StatsView from '@/views/StatsView.vue';

import GameplayView from '@/views/GameplayView.vue';
import MatchResultView from '@/views/MatchResultView.vue';
import BuyCoinsView from '@/views/BuyCoinsView.vue';
import EditProfileView from '@/views/EditProfileView.vue';
import RegisterView from "@/views/RegisterView.vue";
import VerifyEmailView from '@/views/VerifyEmailView.vue';
import VerifiedView from '@/views/VerifiedView.vue';

// --- NOVAS VIEWS MULTIPLAYER ---
import MultiplayerLobbyPage from '@/views/MultiplayerLobbyPage.vue';
import MultiplayerGamePage from '@/views/MultiplayerGamePage.vue';

const routes = [
  {
    path: '/login',
    name: 'LOGIN',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'REGISTER',
    component: RegisterView,
  },
  {
    path: '/verify-email',
    name: 'VERIFY_EMAIL',
    component: VerifyEmailView,
  },
  {
    path: '/verified',
    name: 'VERIFIED',
    component: VerifiedView,
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'ROOT',
        redirect: () => {
          const auth = useAuthStore();
          if (auth.isAuthenticated) {
             const userStore = useUserStore();
             return userStore.type === 'A' ? { name: 'ADMIN' } : { name: 'GAME' };
          }

          // O default é ser player
          return { name: 'GAME' };
        }
      },
      {
        path: 'game',
        name: 'GAME',
        component: GameHubView
      },
      // --- ROTA DO LOBBY (Dentro do Layout) ---
      {
        path: 'lobby',
        name: 'multiplayer-lobby',
        component: MultiplayerLobbyPage
      },
      {
        path: 'history',
        name: 'HISTORY',
        component: HistoryView
      },
      {
        path: 'store',
        name: 'STORE',
        component: StoreView
      },
      {
        path: 'score',
        name: 'SCORE',
        component: LeaderboardView
      },
      {
        path: 'stats',
        name: 'STATS',
        component: StatsView
      },
      {
        path: 'admin-control-panel',
        name: 'ADMIN',
        component: AdminView
      },
      {
        path: 'profile',
        name: 'PROFILE',
        component: ProfileView
      },
    ]
  },

  // --- ROTA DO JOGO MULTIPLAYER (Sem Layout, Ecrã Cheio) ---
  {
    path: '/multiplayer',
    name: 'multiplayer',
    component: GameplayView,
    meta: { requiresAuth: true }
  },

  // Single Player Routes
  {
    path: '/match',
    name: 'match',
    component: GameplayView,
    meta: { requiresAuth: true }
  },
  {
    path: '/practice-match',
    name: 'practice-match',
    component: GameplayView
  },
  {
    path: '/match-result',
    name: 'match-result',
    component: MatchResultView,
    meta: { requiresAuth: true }
  },
  {
    path: '/coins-shop',
    name: 'coins-shop',
    component: BuyCoinsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-profile',
    name: 'edit-profile',
    component: EditProfileView,
    meta: { requiresAuth: true }
  },

  // Catch all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  const userStore = useUserStore();

  if (to.name === 'LOGIN' && auth.isAuthenticated) {
    if (!userStore.type) {
      await userStore.fetchProfile();
    }

    if (userStore.type === 'A') {
      next({ name: 'ADMIN' });
    } else {
      next({ name: 'GAME' });
    }
    return;
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'LOGIN' });
    return;
  }

  if (auth.isAuthenticated && !userStore.type) {
    await userStore.fetchProfile();
  }

  next();
});

export default router;
