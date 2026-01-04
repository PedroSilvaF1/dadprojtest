<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useSocketStore} from './stores/socket';
import { useAuthStore } from './stores/useAuthStore';
import { preloadImages } from '@/utils/imagePreloader';

const socketStore = useSocketStore();
const authStore = useAuthStore();



onMounted(() => {
    // 1. Inicia a conexão
    socketStore.init();

    // 2. BATOTA TEMPORÁRIA (Só para testar se o Login não estiver a funcionar)
    // Se não tiver login feito, fingimos que somos um user aleatório para o socket não falhar
    if (!authStore.user) {
        const fakeUser = {
            id: Math.floor(Math.random() * 1000),
            name: 'Tester ' + Math.floor(Math.random() * 100),
            nickname: 'Tester'
        };
        // Forçamos o envio do evento 'join' manualmente
        socketStore.socket.emit('join', fakeUser);
        console.log("⚠️ Modo de Teste: Login falso ativado para WebSocket");
    }
});
</script>
