<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/useUserStore';
import { useAuthStore } from '@/stores/useAuthStore';
import AvatarUpload from '@/components/AvatarUpload.vue';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

// References
const activeTab = ref('profile');
const avatarUploadRef = ref(null); // To access clearPreview

// Estado do Dialog
const showDialog = ref(false);
const dialogMessage = ref("");
const dialogAction = ref(null);

// Profile form data
const profileForm = ref({
  name: '',
  nickname: '',
  email: ''
});

// Avatar handling
const selectedAvatar = ref(null); // From Grid selection
const avatarFile = ref(null);     // From Upload

// Password form data
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Form states
const isProfileSaving = ref(false);
const isPasswordSaving = ref(false);
const profileMessage = ref({ type: '', text: '' });
const passwordMessage = ref({ type: '', text: '' });

// Top Preview (Display logic: File > Grid Selection > Store > Default)
const displayAvatar = computed(() => {
  // If we have a file, the AvatarUpload component handles its own preview,
  // but for the top big preview we need to rely on the fact that if a file is chosen,
  // the user sees it in the upload section.
  // However, for the Top Big Header, we usually show the Store avatar or Grid selection.
  if (selectedAvatar.value) return selectedAvatar.value;
  return userStore.avatar || "/icons/null_profile.png";
});

const populateForm = () => {
  profileForm.value.name = userStore.name || '';
  profileForm.value.nickname = userStore.nickname || '';
  profileForm.value.email = userStore.email || '';
  if (!selectedAvatar.value) {
    selectedAvatar.value = userStore.avatar;
  }
};

onMounted(async () => {
  if (!userStore.id) {
    await userStore.fetchProfile();
  }
  populateForm();
});

watch(() => userStore.name, (newVal) => {
  if (newVal) populateForm();
});

const handleFileSelection = (file) => {
  avatarFile.value = file;
  // If file uploaded, clear grid selection
  selectedAvatar.value = null;
};

const saveProfile = async () => {
  isProfileSaving.value = true;
  profileMessage.value = { type: '', text: '' };

  try {
    const formData = new FormData();
    formData.append('name', profileForm.value.name);
    formData.append('nickname', profileForm.value.nickname);
    formData.append('email', profileForm.value.email);

    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value);
    } else if (selectedAvatar.value && selectedAvatar.value !== userStore.avatar) {
      formData.append('avatar_url', selectedAvatar.value);
    }

    await userStore.updateProfile(formData);

    profileMessage.value = { type: 'success', text: 'Perfil atualizado com sucesso!' };

    // Reset states
    avatarFile.value = null;
    selectedAvatar.value = userStore.avatar;

    // Clear component preview
    if (avatarUploadRef.value) {
      avatarUploadRef.value.clearPreview();
    }

  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Erro ao atualizar perfil';
    profileMessage.value = { type: 'error', text: errorMsg };
  } finally {
    isProfileSaving.value = false;
  }
};

// ... (changePassword and goBack functions remain exactly the same as provided) ...
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordMessage.value = { type: 'error', text: 'As passwords não coincidem.' };
    return;
  }
  if (passwordForm.value.newPassword.length < 3) {
    passwordMessage.value = { type: 'error', text: 'A password deve ter pelo menos 6 caracteres.' };
    return;
  }
  isPasswordSaving.value = true;
  passwordMessage.value = { type: '', text: '' };
  try {
    await userStore.changePassword({
      current_password: passwordForm.value.currentPassword,
      new_password: passwordForm.value.newPassword,
      new_password_confirmation: passwordForm.value.confirmPassword
    });
    passwordMessage.value = { type: 'success', text: 'Password alterada com sucesso!' };
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Erro ao mudar password';
    passwordMessage.value = { type: 'error', text: errorMsg };
  } finally {
    isPasswordSaving.value = false;
  }
};

const deleteAccount = () => {

  if (!passwordForm.value.currentPassword) {
    passwordMessage.value = { type: 'error', text: 'Please enter your password to confirm deletion.' };
    return;
  }

  // TODO
  dialogMessage.value = `This action is permanent and cannot be undone. Are you sure you want to delete your account?`;

  // Configurar Ação (Função anónima que chama a store)
  dialogAction.value = async () => {
    isPasswordSaving.value = true;
    passwordMessage.value = { type: '', text: '' };

    try {
      await userStore.deleteAccount(passwordForm.value.currentPassword);
      await authStore.logout();
      router.push('/')
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error deleting account.';
      passwordMessage.value = { type: 'error', text: errorMsg };
    } finally {
      isPasswordSaving.value = false;
    }
  }
  showDialog.value = true;
};

const goBack = () => {
  router.push('/home');
};
</script>

<template>
  <ConfirmDialog v-if="showDialog" :show="showDialog" :message="dialogMessage" :action="dialogAction"
    @close="showDialog = false" />
  <div class="min-h-screen text-white pb-10">
    <div class="sticky top-0 z-50 bg-[#003300]/95 backdrop-blur-sm border-b border-yellow-700/50">
      <div class="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        <button @click="goBack"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-900/30 hover:bg-yellow-800/50 border border-yellow-700/50 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-200" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl md:text-2xl font-bold text-yellow-200">Edit Profile</h1>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6">
      <div class="flex flex-col items-center mb-8">
        <div class="relative mb-3">
          <img :src="displayAvatar" alt="avatar"
            class="w-20 h-20 rounded-full shadow-lg border-4 border-yellow-500/70" />
        </div>
        <p class="text-yellow-100 font-semibold">{{ userStore.nickname || userStore.name }}</p>
      </div>

      <div class="flex bg-black/60 rounded-xl border border-yellow-700/50 p-1 mb-6">
        <button @click="activeTab = 'profile'"
          :class="['flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all duration-300', activeTab === 'profile' ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg' : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20']">
          <span class="flex items-center justify-center gap-2">Profile</span>
        </button>
        <button @click="activeTab = 'account'" v-if="userStore.type === 'P'"
          :class="['flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all duration-300', activeTab === 'account' ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg' : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20']">
          <span class="flex items-center justify-center gap-2">Account</span>
        </button>
        <button @click="activeTab = 'password'"
          :class="['flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all duration-300', activeTab === 'password' ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg' : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20']">
          <span class="flex items-center justify-center gap-2">Password</span>
        </button>
        <button @click="activeTab = 'notifications'"
          :class="['flex-1 py-3 px-4 rounded-lg font-semibold text-sm md:text-base transition-all duration-300', activeTab === 'notifications' ? 'bg-gradient-to-r from-red-700 to-red-800 text-yellow-100 shadow-lg' : 'text-yellow-200/70 hover:text-yellow-100 hover:bg-yellow-900/20']">
          <span class="flex items-center justify-center gap-2">Notifications</span>
        </button>
      </div>

      <transition name="fade" mode="out-in">
        <div v-if="activeTab === 'profile'" key="profile"
          class="bg-black/60 rounded-2xl border border-yellow-700/50 p-6">
          <h2 class="text-lg font-bold text-yellow-200 mb-6 flex items-center gap-2">Personal Information</h2>

          <div v-if="profileMessage.text"
            :class="['mb-4 p-3 rounded-lg text-sm font-medium', profileMessage.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700']">
            {{ profileMessage.text }}</div>

          <div class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-yellow-500 uppercase mb-3 tracking-wider">Avatar</label>
              <div class="flex items-center gap-4 mb-4">

                <AvatarUpload ref="avatarUploadRef" :default-url="selectedAvatar || userStore.avatar"
                  @file-selected="handleFileSelection" size-class="w-16 h-16" button-class="w-7 h-7"
                  icon-size="w-3.5 h-3.5" />

                <div class="flex-1">
                  <p class="text-sm text-gray-300">Upload a custom image</p>
                </div>
              </div>
            </div>

            <hr class="border-gray-700/50" />

            <div>
              <label class="block text-xs font-bold text-yellow-500 uppercase mb-2 tracking-wider">Name</label>
              <input v-model="profileForm.name" type="text" placeholder="Your full name"
                class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-bold text-yellow-500 uppercase mb-2 tracking-wider">Nickname</label>
              <input v-model="profileForm.nickname" type="text" placeholder="Your display name"
                class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-bold text-yellow-500 uppercase mb-2 tracking-wider">Email</label>
              <input v-model="profileForm.email" type="email" placeholder="your@email.com"
                class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
            </div>
          </div>

          <button @click="saveProfile" :disabled="isProfileSaving"
            class="mt-6 w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-red-900/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            <span v-if="isProfileSaving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>

        <div v-else-if="activeTab === 'account' && userStore.type === 'P'" key="account"
          class="bg-black/60 rounded-2xl border border-yellow-700/50 p-6">
          <h2 class="text-lg font-bold text-yellow-200 mb-6 flex items-center gap-2">Delete Account</h2>

          <div v-if="passwordMessage.text"
            :class="['mb-4 p-3 rounded-lg text-sm font-medium', passwordMessage.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700']">
            {{ passwordMessage.text }}
          </div>

          <div class="space-y-5">
            <p class="text-gray-400 text-sm">To delete your account securely, please enter your current password below.
            </p>
            <input v-model="passwordForm.currentPassword" type="password" placeholder="Enter your current password"
              class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
          </div>

          <button @click="deleteAccount" :disabled="isPasswordSaving"
            class="mt-6 w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-red-900/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            <span v-if="isPasswordSaving">Processing...</span>
            <span v-else>Delete Account</span>
          </button>
        </div>

        <div v-else-if="activeTab === 'password'" key="password"
          class="bg-black/60 rounded-2xl border border-yellow-700/50 p-6">
          <h2 class="text-lg font-bold text-yellow-200 mb-6 flex items-center gap-2">Change Password</h2>
          <div v-if="passwordMessage.text"
            :class="['mb-4 p-3 rounded-lg text-sm font-medium', passwordMessage.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700']">
            {{ passwordMessage.text }}</div>
          <div class="space-y-5">
            <input v-model="passwordForm.currentPassword" type="password" placeholder="Enter your current password"
              class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
            <input v-model="passwordForm.newPassword" type="password" placeholder="Enter your new password"
              class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
            <input v-model="passwordForm.confirmPassword" type="password" placeholder="Confirm your new password"
              class="w-full bg-black/60 border border-yellow-700/50 rounded-xl p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all" />
          </div>
          <button @click="changePassword" :disabled="isPasswordSaving"
            class="mt-6 w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-red-900/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            <span v-if="isPasswordSaving">Updating...</span>
            <span v-else>Update Password</span>
          </button>
        </div>

        <div v-else-if="activeTab === 'notifications'" key="notifications"
          class="bg-black/60 rounded-2xl border border-yellow-700/50 p-6">
          <h2 class="text-lg font-bold text-yellow-200 mb-6 flex items-center gap-2">Push Notifications</h2>
          <div class="space-y-4">
            <button @click="userStore.subscribeToPush()"
              class="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-700 to-yellow-800 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-6 rounded-xl shadow-lg">Enable
              Push Notifications</button>
            <button @click="userStore.sendTestNotification()"
              class="w-full flex items-center justify-center gap-3 bg-black/30 hover:bg-black/50 text-yellow-200 border border-yellow-700/50 font-semibold py-3 px-6 rounded-xl">Send
              Test Notification</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
