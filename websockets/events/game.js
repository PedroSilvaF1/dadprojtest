import { createGame, playCard, resolveTrick, forfeitGame } from "../state/game.js";


const waitingSocketsByKey = new Map();
const gameTimers = new Map();
const matches = new Map();
const gameToMatch = new Map();
const socketToMatch = new Map();
let currentMatchID = 0;

const MARKS_TO_WIN = 4;
const NEXT_GAME_DELAY = 2000;

const giveMarks = (points) => {
    if (points === 120) return 4;
    if (points >= 91) return 2;
    if (points >= 61) return 1;
    return 0;
};

const createMatch = (player1, player2, type, format, sockets) => {
    currentMatchID += 1;
    const match = {
        id: currentMatchID,
        type,
        format,
        player1,
        player2,
        player1_marks: 0,
        player2_marks: 0,
        roomID: `match-${currentMatchID}`,
        sockets
    };
    matches.set(match.id, match);
    return match;
};

const getRoomForGame = (gameID) => {
    const matchId = gameToMatch.get(gameID);
    const match = matchId ? matches.get(matchId) : null;
    return match?.roomID;
};

const initGameForMatch = (match) => {
    let game = createGame(match.type || '9', match.player1);

    game.names = {
        [match.player1.id]: match.player1.name,
        [match.player2.id]: match.player2.name
    };
    game.photos = {
        [match.player1.id]: match.player1.photo,
        [match.player2.id]: match.player2.photo
    };

    game.player2 = match.player2.id;
    game.hands[match.player2.id] = [];
    game.collected[match.player2.id] = [];
    game.points[match.player2.id] = 0;

    if (!game.hands[match.player1.id]) game.hands[match.player1.id] = [];

    const handSize = String(game.type) === '3' ? 3 : 9;
    while (game.hands[match.player1.id].length < handSize && game.deck.length > 0) {
        game.hands[match.player1.id].push(game.deck.pop());
    }

    while (game.hands[match.player2.id].length < handSize && game.deck.length > 0) {
        game.hands[match.player2.id].push(game.deck.pop());
    }

    const startingPlayer = Math.random() < 0.5 ? match.player1.id : match.player2.id;
    game.currentPlayer = startingPlayer;
    game.currentLeader = startingPlayer;
    game.status = 'PLAYING';
    game.matchId = match.id;
    game.player1_marks = match.player1_marks;
    game.player2_marks = match.player2_marks;
    game.format = match.format || 'match';

    gameToMatch.set(game.id, match.id);
    match.currentGameId = game.id;
    return game;
};

export const handleGameEvents = (io, socket) => {

    const finalizeFinishedGame = (gameID, finishedGame, roomID) => {
        const matchId = gameToMatch.get(gameID);
        const match = matchId ? matches.get(matchId) : null;

        if (match) {
            const p1Points = finishedGame.points?.[match.player1.id] || 0;
            const p2Points = finishedGame.points?.[match.player2.id] || 0;
            const p1Gained = giveMarks(p1Points);
            const p2Gained = giveMarks(p2Points);

            if (p1Points > p2Points && p1Gained > 0) {
                match.player1_marks = Math.min(MARKS_TO_WIN, match.player1_marks + p1Gained);
            } else if (p2Points > p1Points && p2Gained > 0) {
                match.player2_marks = Math.min(MARKS_TO_WIN, match.player2_marks + p2Gained);
            }

            finishedGame.player1_marks = match.player1_marks;
            finishedGame.player2_marks = match.player2_marks;
        }

        io.to(roomID).emit("game-change", finishedGame);

        if (gameTimers.has(gameID)) clearTimeout(gameTimers.get(gameID));

        if (match?.format === 'single') {
            io.to(roomID).emit("match-over", match);
            return;
        }

        if (match && (match.player1_marks >= MARKS_TO_WIN || match.player2_marks >= MARKS_TO_WIN)) {
            io.to(roomID).emit("match-over", match);
            return;
        }

        if (match) {
            setTimeout(() => {
                const nextGame = initGameForMatch(match);
                io.to(roomID).emit("game-start", nextGame);
                resetTurnTimer(nextGame.id, nextGame, roomID);
            }, NEXT_GAME_DELAY);
        }
    };

    const resetTurnTimer = (gameID, game, roomID) => {
        if (gameTimers.has(gameID)) {
            clearTimeout(gameTimers.get(gameID));
            gameTimers.delete(gameID);
        }
        if (game.status !== 'PLAYING') return;

        const timer = setTimeout(() => {
            console.log(`Game ${gameID}: Timeout for user ${game.currentPlayer}`);
            const finishedGame = forfeitGame(gameID, game.currentPlayer, 'timeout');
            const targetRoom = roomID || getRoomForGame(gameID) || `game-${gameID}`;
            io.to(targetRoom).emit("game-alert", { 
                type: 'error', 
                message: 'Tempo esgotado! Vitória atribuída ao adversário.' 
            });
            finalizeFinishedGame(gameID, finishedGame, targetRoom);
            gameTimers.delete(gameID);
        }, 20000); 

        gameTimers.set(gameID, timer);
    };

    const endMatchForForfeit = (gameID, finishedGame, roomID) => {
        const matchId = gameToMatch.get(gameID);
        const match = matchId ? matches.get(matchId) : null;
        if (!match) return;

        if (finishedGame.winner === match.player1.id) {
            match.player1_marks = MARKS_TO_WIN;
        } else if (finishedGame.winner === match.player2.id) {
            match.player2_marks = MARKS_TO_WIN;
        }

        finishedGame.player1_marks = match.player1_marks;
        finishedGame.player2_marks = match.player2_marks;

        io.to(roomID).emit("game-change", finishedGame);
        if (gameTimers.has(gameID)) clearTimeout(gameTimers.get(gameID));
        io.to(roomID).emit("match-over", match);
    };

    socket.on("join-queue", (payload = {}) => {
        const userID = socket.data.userID;
        if (!userID) return;

        const mode = String(payload.mode || '9');
        const format = payload.format || 'match';
        const waitingKey = `${mode}:${format}`;
        const waitingSocket = waitingSocketsByKey.get(waitingKey) || null;

        if (waitingSocket && waitingSocket.id !== socket.id) {
            //console.log(`[Matchmaking] Pairing ${waitingSocket.data.userName} vs ${socket.data.userName}`);

            // --- LOG DE DEBUG 2 ---
        console.log("🔍 [DEBUG SERVER] Criando jogo...");
        console.log("   -> Player 1 (Waiting):", waitingSocket.data.userName, "Foto:", waitingSocket.data.userPhoto);
        console.log("   -> Player 2 (Current):", socket.data.userName, "Foto:", socket.data.userPhoto);
        // ----------------------


            const player1 = { 
                id: waitingSocket.data.userID, 
                name: waitingSocket.data.userName,
                photo: waitingSocket.data.userPhoto 
            };
            const player2 = { 
                id: socket.data.userID, 
                name: socket.data.userName,
                photo: socket.data.userPhoto 
            };
            
            const match = createMatch(player1, player2, mode, format, {
                player1: waitingSocket.id,
                player2: socket.id
            });
            let game = initGameForMatch(match);
            socketToMatch.set(waitingSocket.id, match.id);
            socketToMatch.set(socket.id, match.id);

            console.log("🔍 [DEBUG SERVER] Objeto Game pronto:", {
                names: game.names,
                photos: game.photos
            });

            const roomID = match.roomID;
            waitingSocket.join(roomID);
            socket.join(roomID);

            io.to(roomID).emit("game-start", game);
            resetTurnTimer(game.id, game, roomID);

            waitingSocketsByKey.delete(waitingKey);

        } else {
            waitingSocketsByKey.set(waitingKey, socket);
            socket.data.waitingKey = waitingKey;
            console.log(`[Matchmaking] User ${socket.data.userName} added to queue.`);
            socket.emit("queue-joined");
        }
    });

    socket.on("join", (user) => {
         socket.data.userID = user.id;
        socket.data.userName = user.name;
        socket.data.userPhoto = user.photo; // <--- Guardar a foto na memória
    });

    socket.on("play-card", (gameID, card) => {
        const userID = socket.data.userID;

        console.log(`[SERVER] Recebi jogada! User: ${userID}, Game: ${gameID}`, card); // <--- LOG NOVO
        
        // 1. Joga a carta (mas não resolve a vaza ainda)
        const result = playCard(gameID, userID, card);

        if (result && result.error) {
            console.error(`[SERVER] Jogada rejeitada: ${result.error}`); // <--- LOG NOVO
            socket.emit("game-error", result.error);
        } else if (result) {
            console.log("[SERVER] Jogada aceite. Atualizando todos..."); // <--- LOG NOVO
            
            // Reinicia o timer de inatividade (timeout)
            const roomID = getRoomForGame(gameID) || `game-${gameID}`;
            resetTurnTimer(gameID, result, roomID);
            
            // 2. Envia o estado ATUAL (com as cartas na mesa) para todos verem
            io.to(roomID).emit("game-change", result);
            
            // 3. Verifica se a vaza ficou completa (2 cartas na mesa)
            if (result.currentTrick.length === 2) {
                
                // --- AQUI ESTÁ O TIMER DE 2 SEGUNDOS ---
                setTimeout(() => {
                    // Resolve a vaza (limpa mesa, dá pontos, dá cartas novas)
                    const resolvedGame = resolveTrick(gameID);

                    if (resolvedGame.status === 'FINISHED') {
                        finalizeFinishedGame(gameID, resolvedGame, roomID);
                        return;
                    }

                    // Envia o novo estado limpo
                    io.to(roomID).emit("game-change", resolvedGame);
                    
                    // Reinicia timer de turno para o próximo jogador
                    resetTurnTimer(gameID, resolvedGame, roomID);
                    
                }, 2000); // 2000ms = 2 segundos
            }
        }
    });

    socket.on("leave-game", (gameID) => {
        const matchId = socketToMatch.get(socket.id);
        const match = matchId ? matches.get(matchId) : null;
        const currentGameId = gameID || match?.currentGameId;
        if (!match || !currentGameId) return;

        const roomID = match.roomID;
        const loserID = socket.data.userID;
        socket.leave(roomID);
        const finishedGame = forfeitGame(currentGameId, loserID, 'forfeit');
        if (finishedGame) {
            endMatchForForfeit(currentGameId, finishedGame, roomID);
        }
        socketToMatch.delete(socket.id);
    });

    const handleLeave = () => {
        const waitingKey = socket.data.waitingKey;
        if (waitingKey && waitingSocketsByKey.get(waitingKey)?.id === socket.id) {
            waitingSocketsByKey.delete(waitingKey);
            socket.data.waitingKey = null;
            console.log("[Matchmaking] User removed from queue.");
        }

        const matchId = socketToMatch.get(socket.id);
        const match = matchId ? matches.get(matchId) : null;
        if (match && match.currentGameId) {
            const roomID = match.roomID;
            const loserID = socket.data.userID;
            const finishedGame = forfeitGame(match.currentGameId, loserID, 'disconnect');
            if (finishedGame) {
                endMatchForForfeit(match.currentGameId, finishedGame, roomID);
            }
            socketToMatch.delete(socket.id);
        }
    };

    socket.on("leave-queue", handleLeave);
    socket.on("disconnect", handleLeave);


    socket.on("match-created-db", (data) => {
        // data = { gameSocketId: 1, dbMatchId: 50 }
        const roomID = getRoomForGame(data.gameSocketId) || `game-${data.gameSocketId}`;
        
        // Envia para todos na sala (incluindo o Player 2) qual é o ID real da BD
        io.to(roomID).emit("update-match-id", data.dbMatchId);
    });
};
