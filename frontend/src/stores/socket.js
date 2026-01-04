import { defineStore } from 'pinia';
import { io } from "socket.io-client";
import { useAuthStore } from './useAuthStore';
import { useGameStore } from './useGameStore';
import { useUserStore } from './useUserStore';
import router from '@/router'; 

export const useSocketStore = defineStore('socket', {
    state: () => ({
        socket: null,
        inQueue: false,
        socketUserId: null,
        currentMatchSocketId: null,
        recordedGameIds: [],
        achievementShownGameIds: [],
        matchStartAt: null,
    }),
    actions: {
        init() {
            if (this.socket) return;

            const authStore = useAuthStore();
            const userStore = useUserStore();

            const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
            this.socket = io(socketUrl);

            this.socket.on("connect", async () => {
            console.log("[Socket] Connected:", this.socket.id);
           
            const authStore = useAuthStore();
            const userStore = useUserStore();

            if (authStore.isAuthenticated && (!userStore.nickname || !userStore.user?.photo_filename)) {
                console.log("[Socket] Perfil incompleto. A carregar dados da API...");
                try {
                    await userStore.fetchProfile();
                    console.log("[Socket] Perfil carregado com sucesso!");
                } catch (e) {
                    console.error("[Socket] Falha ao carregar perfil:", e);
                }
            }

            if (authStore.user || userStore.nickname) {

                console.log("🔍 [DEBUG USER OBJECT]:", userStore.user);
                const realID = userStore.id || authStore.user?.id;
                const realName = userStore.nickname || authStore.user?.nickname || 'Player'; 
                
                const realPhoto = 
                    userStore.user?.photo_filename ||  
                    userStore.avatar ||                
                    authStore.user?.photo_filename || 
                    null;
                console.log(`[Socket] 🚀 A enviar JOIN como: ${realName} (Foto: ${realPhoto})`);

                this.socketUserId = realID; 

                this.socket.emit("join", {
                    id: realID,
                    name: realName,
                    photo: realPhoto
                });
            }
        });

            // --- EVENTOS ---
            this.socket.on("queue-joined", () => {
                console.log("Entrei na fila!"); 
                this.inQueue = true;
            });

            this.socket.on("game-start", async (game) => {
                const gameStore = useGameStore();
                const userStore = useUserStore(); 
                this.inQueue = false;

                if (game.matchId && this.currentMatchSocketId !== game.matchId) {
                    this.currentMatchSocketId = game.matchId;
                    this.recordedGameIds = [];
                    this.achievementShownGameIds = [];
                    this.matchStartAt = Date.now();
                    gameStore.matchHistory = [];
                    gameStore.matchOver = false;
                    gameStore.playerMarks = 0;
                    gameStore.botMarks = 0;
                }

                gameStore.setMultiplayerGame(game);
                router.push('/multiplayer');

                const myId = String(this.socketUserId);
                const opponentId = String(game.player1) === myId ? String(game.player2) : String(game.player1);
                gameStore.multiplayerPlayerName = game.names?.[myId] || userStore.nickname || 'Player';
                gameStore.multiplayerOpponentName = game.names?.[opponentId] || 'Opponent';
                gameStore.multiplayerFormat = game.format || 'match';

                const isPlayer1 = game.player1 == this.socketUserId;
                if (isPlayer1){
                    console.log(`[Socket] Sou o Player 1 (${userStore.nickname})`);
                    if (!gameStore.currentMatchId) {
                        const payload = {
                            type : game.type,
                            stake : 2,
                            opponent_id : game.player2
                        };

                        const matchId = await userStore.persistMatch(payload);

                        if (matchId) {
                            console.log("Match DB criada com ID:", matchId);
                            this.socket.emit("match-created-db", { 
                                gameSocketId: game.id, 
                                dbMatchId: matchId 
                            });
                            gameStore.currentMatchId = matchId;
                        }
                    }
                } else {
                    console.log(`[Socket] Sou o Player 2 (${userStore.nickname})`);
                }
            });

        this.socket.on("update-match-id", (dbMatchId) => {
            const gameStore = useGameStore();
            console.log("Recebi o ID da Match da BD:", dbMatchId);
            gameStore.currentMatchId = dbMatchId;
        });

            

            this.socket.on("game-change", (game) => {
                const gameStore = useGameStore();
                gameStore.setMultiplayerGame(game);

                if (game.status === 'FINISHED' && game.id && !this.recordedGameIds.includes(game.id)) {
                    this.recordedGameIds.push(game.id);

                    const myId = String(this.socketUserId);
                    const p1Id = String(game.player1);
                    const p2Id = String(game.player2);
                    const opponentId = (myId === p1Id) ? p2Id : p1Id;
                    const myPoints = game.points?.[myId] || 0;
                    const opponentPoints = game.points?.[opponentId] || 0;

                    const tricks = (game.tricksHistory || []).map((trick) => {
                        const p1 = trick.player1;
                        const p2 = trick.player2;
                        let myCard = null;
                        let opponentCard = null;

                        if (String(p1.player) === myId) myCard = p1.card;
                        if (String(p2.player) === myId) myCard = p2.card;
                        if (String(p1.player) === opponentId) opponentCard = p1.card;
                        if (String(p2.player) === opponentId) opponentCard = p2.card;

                        return {
                            trickNumber: trick.trickNumber,
                            playerCard: myCard || p1.card,
                            botCard: opponentCard || p2.card,
                            winner: String(trick.winner) === myId ? 'player' : 'bot',
                            points: trick.points
                        };
                    });

                    gameStore.matchHistory.push({
                        gameNumber: gameStore.matchHistory.length + 1,
                        playerPoints: myPoints,
                        botPoints: opponentPoints,
                        tricks: tricks
                    });
                }

                if (game.status === 'FINISHED' && game.id && !this.achievementShownGameIds.includes(game.id)) {
                    this.achievementShownGameIds.push(game.id);

                    const myId = String(this.socketUserId);
                    const p1Id = String(game.player1);
                    const p2Id = String(game.player2);
                    const opponentId = (myId === p1Id) ? p2Id : p1Id;
                    const myPoints = game.points?.[myId] || 0;
                    const opponentPoints = game.points?.[opponentId] || 0;

                    if (myPoints > opponentPoints) {
                        let achievement = null;
                        if (myPoints === 120) achievement = 'Bandeira';
                        else if (myPoints >= 91) achievement = 'Capote';
                        else if (myPoints >= 61) achievement = 'Risca';

                        if (achievement) {
                            gameStore.showAchievementAlert(achievement);
                        }
                    }
                }
            });
            
            this.socket.on("game-error", (msg) => alert(msg));

            this.socket.on("match-over", async (match) => {
                const gameStore = useGameStore();
                const authStore = useAuthStore();
                const userStore = useUserStore();

                const myId = String(this.socketUserId);
                const player1Id = String(match.player1?.id || match.player1);
                const player2Id = String(match.player2?.id || match.player2);
                const myMarks = (player1Id === myId) ? match.player1_marks : match.player2_marks;
                const opponentMarks = (player1Id === myId) ? match.player2_marks : match.player1_marks;

                gameStore.playerMarks = myMarks || 0;
                gameStore.botMarks = opponentMarks || 0;
                gameStore.matchOver = true;
                if (this.matchStartAt) {
                    gameStore.matchDuration = Math.floor((Date.now() - this.matchStartAt) / 1000);
                }
                gameStore.stopAllTimers();

                if (!gameStore.isPractice && gameStore.currentMatchId && authStore.isAuthenticated) {
                    const payload = gameStore.endGamePayload();
                    await userStore.editMatch(gameStore.currentMatchId, payload);
                }

                router.push('/match-result');
            });
        },

        emitPlay(mode = '9', format = 'match') {
            if (!this.socket) {
                console.log("Socket desligado. A iniciar...");
                this.init();
            }
            
            // Pequeno delay para garantir que a conexão estabelece
            setTimeout(() => {
                if (this.socket) {
                    this.socket.emit("join-queue", { mode: String(mode), format });
                }
            }, 500);
        },

        emitPlayCard(gameID, card) { 
            console.log(`[SocketStore] A tentar enviar carta... GameID: ${gameID}`, card);
            if (this.socket) {
                this.socket.emit("play-card", gameID, card); 
                console.log("[SocketStore] Evento 'play-card' emitido!");
            } else {
                console.error("[SocketStore] ERRO: Socket não existe ou está desligado!");
            }
        },
        
        emitLeaveGame(gameID) { 
            if (this.socket) {
                this.socket.emit("leave-game", gameID); 
                this.inQueue = false;
            }
        }
    }
});
