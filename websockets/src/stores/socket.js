import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import { useAuthStore } from './auth';
import { useGameStore } from './game'; // Assumindo que criou esta store separada

export const useSocketStore = defineStore('socket', () => {
    const socket = inject('socket');
    const authStore = useAuthStore();
    const gameStore = useGameStore();
    const joined = ref(false);

    const emitJoin = (user) => {
        if (joined.value) return;
        console.log('[Socket] Joining Server');
        socket.emit('join', user);
        joined.value = true;
    };

    const emitLeave = () => {
        socket.emit('leave');
        console.log('[Socket] Leaving Server');
        joined.value = false;
    };

    // Métodos de Jogo [cite: 148, 251-256]
    const emitGetGames = () => {
        socket.emit('get-games');
    };

    const emitJoinGame = (game) => {
        console.log(`[Socket] Joining Game ${game.id}`);
        // Nota: authStore.currentUser.id vem do getter criado no passo 26
        socket.emit('join-game', game.id, authStore.currentUser.id);
    };

    const emitFlipCard = (gameID, card) => {
        socket.emit('flip-card', gameID, card);
    };

    const handleConnection = () => {
        socket.on('connect', () => {
            console.log(`[Socket] Connected ${socket.id}`);
            if (authStore.isLoggedIn && !joined.value) {
                emitJoin(authStore.currentUser);
            }
        });

        socket.on('disconnect', () => {
            joined.value = false;
            console.log('[Socket] Disconnected');
        });

        // Eventos de Jogo [cite: 150, 260]
        socket.on('games', (games) => {
            console.log(`[Socket] server emited games game count ${games.length}`);
            gameStore.setGames(games);
        });

        socket.on('game-change', (game) => {
            gameStore.setMultiplayerGame(game);
        });
    };

    return {
        joined,
        emitJoin,
        emitLeave,
        emitGetGames,
        emitJoinGame,
        emitFlipCard,
        handleConnection
    };
});