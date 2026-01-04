<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/useUserStore.js";
import { useShopStore } from "@/stores/useShopStore.js";
import { McCoinLine } from '@kalimahapps/vue-icons';

// Imagens dos métodos de pagamento
import mbwayImage from '@/assets/images/payment_methods/mbway.svg';
import multibancoImage from '@/assets/images/payment_methods/multibanco.svg';
import visaImage from '@/assets/images/payment_methods/visa.svg';
import paypalImage from '@/assets/images/payment_methods/paypal.svg';
import ibanImage from '@/assets/images/payment_methods/iban.svg';

const router = useRouter();
const userStore = useUserStore();
const shopStore = useShopStore();

const selectedPack = ref(null);
const selectedPaymentMethod = ref('MBWAY');
const paymentReference = ref('');
const loading = ref(false);
const message = ref({ text: '', type: '' });

// Métodos de pagamento
const paymentMethods = [
  { id: 'MBWAY', label: 'MB WAY', placeholder: '9xxxxxxxxx (9 digits)', image: mbwayImage, limit: 5 },
  { id: 'MB', label: 'Multibanco', placeholder: '12345-123456789 (Entity-Ref)', image: multibancoImage, limit: 20},
  { id: 'VISA', label: 'Visa', placeholder: '4xxxxxxxxxxxxxxx (16 digits)', image: visaImage, limit: 30 },
  { id: 'IBAN', label: 'IBAN', placeholder: 'PT50...', image: ibanImage, limit: 50 },
  { id: 'PAYPAL', label: 'PayPal', placeholder: 'email@example.com', image: paypalImage, limit: 10 },
];

// Filtrar os métodos de acordo com o preço
const filteredPaymentMethods = computed(() => {
  if (!selectedPack.value) return paymentMethods;
  return paymentMethods.filter(method => method.limit >= selectedPack.value.price);
});

const currentPlaceholder = computed(() => {
  const method = paymentMethods.find(m => m.id === selectedPaymentMethod.value);
  return method ? method.placeholder : '';
});

// Selecionar um pack
const selectPack = (pack) => {
  selectedPack.value = pack;
  message.value = { text: '', type: '' };

  // Check se o método de pagamento atual é válido para o pack selecionado
  const currentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod.value);

  if (!currentMethod || currentMethod.limit < pack.price) {

    // Se for invalido, trocar para o primeiro metodo disponivel
    const available = paymentMethods.filter(m => m.limit >= pack.price);
    if (available.length > 0) {
      selectedPaymentMethod.value = available[0].id;
    } else {
      // Se nenhum método estiver disponivel, então o preço é demasiado alto
      selectedPaymentMethod.value = '';
    }
  }
};

// Seleciona um método de pagamento
const selectMethod = (methodId) => {
  selectedPaymentMethod.value = methodId;
  paymentReference.value = '';
  message.value = { text: '', type: '' };
};

const handlePurchase = async () => {
  if (!selectedPack.value || !paymentReference.value) {
    message.value = { text: 'Please fill in all fields.', type: 'error' };
    return;
  }

  // Dá clear às mensagens anteriores
  loading.value = true;
  message.value = { text: '', type: '' };

  try {
    await shopStore.purchaseCoins(
      selectedPaymentMethod.value,
      paymentReference.value,
      selectedPack.value.price
    );

    message.value = { text: 'Purchase successful! Coins added to your account.', type: 'success' };

    paymentReference.value = '';
    setTimeout(() => {
      selectedPack.value = null;
      message.value = { text: '', type: '' };
    }, 2000);
  } catch (error) {
    console.error(error);
    const errorMsg = error.response?.data?.message || 'Transaction failed. Please check your reference and try again.';
    message.value = { text: errorMsg, type: 'error' };
  } finally {
    loading.value = false;
  }
}

// Go back
const goBack = () => {
  router.push('/home');
};
</script>

<template>
  <div class="min-h-screen text-center pb-28 text-white relative overflow-hidden bg-black/90">

    <div class="pt-8 px-5 flex items-center justify-between max-w-4xl mx-auto">
      <div class="w-16"></div>
      <h1 class="text-3xl font-extrabold text-yellow-300 drop-shadow-[0_0_10px_rgba(255,255,150,0.4)]">
        Coin Shop
      </h1>
      <div class="w-16"></div>
    </div>

    <div class="mt-6 flex gap-2 justify-center">
      <button @click="goBack" class="text-yellow-600 bg-transparent hover:text-gray-900 hover:bg-yellow-600 transition flex border border-yellow-600 py-2 px-4 rounded-full items-center gap-1 font-semibold">
        ← Back
      </button>
      <div class="bg-black/60 border border-yellow-600 rounded-full px-6 py-2 flex items-center gap-2 shadow-lg">
        <span class="text-gray-300 text-sm uppercase tracking-wide">Current Balance:</span>
        <span class="text-xl font-bold text-yellow-100">{{ userStore.coins }}</span>
        <McCoinLine class="w-5 h-5 text-yellow-400" />
      </div>
    </div>

    <div class="mt-8 w-11/12 md:w-3/5 mx-auto">

      <section class="mb-10">
        <h2 class="text-left text-xl font-semibold text-yellow-200 mb-4 pl-2 border-l-4 border-yellow-600">
          1. Select Coin Pack
        </h2>

        <div class="flex flex-wrap justify-center gap-4">
          <div v-for="pack in shopStore.coinsCatalog" :key="pack.id" @click="selectPack(pack)"
            class="w-[calc(50%-0.5rem)] md:w-[calc(33.33%-0.7rem)] cursor-pointer relative rounded-2xl p-4 transition-all duration-300 flex flex-col items-center justify-between border-2 hover:scale-105"
            :class="selectedPack?.id === pack.id
              ? 'bg-yellow-900/30 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
              : 'bg-black/60 border-yellow-800 hover:border-yellow-600'">
            <div v-if="pack.hasBonus"
              class="absolute -top-3 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              BONUS
            </div>

            <div class="mb-2 text-yellow-200">
              <McCoinLine class="w-12 h-12 drop-shadow-lg mx-auto" />
            </div>

            <h3 class="font-bold text-yellow-50 text-xl">{{ pack.quantity }} Coins</h3>

            <div v-if="pack.hasBonus" class="text-xs text-green-400 font-semibold mb-2">
              + {{ (shopStore.coinsPurchaseBonus * pack.quantity) / 100 }} Bonus
            </div>
            <div v-else class="h-4 mb-2"></div>

            <div class="mt-2 bg-yellow-600/20 px-4 py-1 rounded-lg border border-yellow-600/50">
              <span class="font-bold text-yellow-100">{{ pack.price }} €</span>
            </div>
          </div>
        </div>
      </section>

      <transition name="fade">
        <div v-if="selectedPack" class="space-y-10">

          <section>
            <h2 class="text-left text-xl font-semibold text-yellow-200 mb-4 pl-2 border-l-4 border-yellow-600">
              2. Payment Method
            </h2>

            <div class="flex flex-wrap justify-center gap-4 bg-black/40 p-4 rounded-xl border border-yellow-800/50">
              <button v-for="method in filteredPaymentMethods" :key="method.id"
                @click="selectMethod(method.id)"
                class="flex items-center justify-center gap-3 px-6 py-2 rounded-lg font-bold transition duration-200 border-b-4"
                :class="selectedPaymentMethod === method.id
                  ? 'bg-yellow-100 text-gray-900 border-gray-900 shadow-lg scale-105'
                  : 'bg-white text-gray-400 border-gray-900'"
                >
                <img
                  v-if="method.id === 'IBAN'"
                  :src="(hoveredMethod === method.id && selectedPaymentMethod !== method.id) ? method.hoverImage : method.image"
                  :alt="method.label"
                  class="h-6 md:h-12 w-auto object-contain"
                  />
                <img v-else :src="method.image" :alt="method.label" class="h-6 md:h-12 w-auto object-contain" />
                <span
                  v-if="method.id === 'IBAN'"
                  class="text-sm text-black font-extrabold uppercase tracking-wider"
                >
                  {{ method.label }}
                </span>
              </button>
            </div>
          </section>

          <section>
            <h2 class="text-left text-xl font-semibold text-yellow-200 mb-4 pl-2 border-l-4 border-yellow-600">
              3. Payment Details
            </h2>

            <div class="bg-black/60 border border-yellow-700 rounded-2xl p-6 shadow-xl max-w-md mx-auto">
              <div class="text-left mb-2">
                <label class="text-yellow-200 text-sm font-semibold ml-1">Reference / Account</label>
              </div>

              <input v-model="paymentReference" type="text" :placeholder="currentPlaceholder"
                class="w-full bg-black/80 border border-yellow-600 rounded-lg px-4 py-3 text-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-600 transition-all" />

              <div class="mt-6 flex justify-between items-center border-t border-yellow-800/50 pt-4">
                <span class="text-gray-300">Total to pay:</span>
                <span class="text-2xl font-bold text-yellow-100">{{ selectedPack.price }} €</span>
              </div>

              <button @click="handlePurchase" :disabled="loading || !paymentReference"
                class="w-full mt-6 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                <span v-if="!loading">Confirm Purchase</span>
                <span v-else class="animate-pulse">Processing...</span>
              </button>

              <div v-if="message.text" class="mt-4 p-3 rounded-lg text-sm font-semibold"
                :class="message.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-700' : 'bg-red-900/50 text-red-200 border border-red-700'">
                {{ message.text }}
              </div>
            </div>
          </section>

        </div>
      </transition>
    </div>
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
  transform: translateY(0);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
