const games = new Map();
let currentGameID = 0;

// Configuração da Bisca
const SUITS = ['H', 'D', 'C', 'S']; 
const RANKS = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A']; 
const VALUES = {
    '2': 0, '3': 0, '4': 0, '5': 0, '6': 0,
    'Q': 2, 'J': 3, 'K': 4, '7': 10, 'A': 11
};
const POWER = {
    '2': 0, '3': 1, '4': 2, '5': 3, '6': 4,
    'Q': 5, 'J': 6, 'K': 7, '7': 8, 'A': 9
};

export const createGame = (type = '9', user) => {
    currentGameID++;
    let deck = generateDeck();
    const trumpCard = deck.shift(); 
    deck.unshift(trumpCard);

    const game = {
        id: currentGameID,
        type: type,
        player1: user.id,
        player2: null,
        deck: deck,
        trumpCard: trumpCard,
        trumpSuit: trumpCard.suit,
        hands: { [user.id]: [] },
        collected: { [user.id]: [] },
        points: { [user.id]: 0 },
        currentTrick: [],
        tricksHistory: [],
        currentPlayer: user.id,
        currentLeader: user.id, // Adicionado para manter coerência
        status: 'PENDING',
        winner: null,
        winnerReason: null,
        endedAt: null
    };

    games.set(currentGameID, game);
    return game;
};

export const joinGame = (gameID, player2User) => {
    const game = games.get(gameID);
    if (!game || game.player2) return null;

    game.player2 = player2User.id;
    game.hands[game.player2] = [];
    game.collected[game.player2] = [];
    game.points[game.player2] = 0;
    dealCards(game);
    game.status = 'PLAYING';
    return game;
};

const dealCards = (game) => {
    const handSize = (game.type === '3') ? 3 : 9;
    for (let i = 0; i < handSize; i++) {
        if(game.deck.length > 0) game.hands[game.player1].push(game.deck.pop());
        if(game.deck.length > 0) game.hands[game.player2].push(game.deck.pop());
    }
};

export const playCard = (gameID, userID, card) => {
    const game = games.get(gameID);
    
    // --- SEGURANÇA 1: Se o jogo não corre ou a mesa está cheia, rejeita ---
    if (!game || game.status !== 'PLAYING') return null;
    if (game.currentTrick.length >= 2) return { error: "Aguarde o fim da vaza!" }; 
    // ----------------------------------------------------------------------

    if (game.currentPlayer !== userID) return { error: "Não é a tua vez!" };

    const hand = game.hands[userID];
    const cardIndex = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    
    if (cardIndex === -1) return { error: "Não tens essa carta!" };

    if (game.deck.length === 0 && game.currentTrick.length > 0) {
        const leadCard = game.currentTrick[0].card;
        const playedCard = hand[cardIndex];
        const hasSuit = hand.some(c => c.suit === leadCard.suit);
        
        if (hasSuit && playedCard.suit !== leadCard.suit) {
            return { error: "É obrigatório assistir ao naipe!" };
        }
    }

    const playedCard = hand.splice(cardIndex, 1)[0];
    game.currentTrick.push({ player: userID, card: playedCard });

    // --- SEGURANÇA 2: Bloquear o jogo durante o intervalo ---
    if (game.currentTrick.length < 2) {
        // Se ainda só tem 1 carta, passa a vez normalmente
        game.currentPlayer = (game.currentPlayer === game.player1) ? game.player2 : game.player1;
    } else {
        // Se tem 2 cartas, BLOQUEIA O JOGO (ninguém joga)
        // Isto impede cliques extra enquanto o timer de 2s corre
        game.currentPlayer = null; 
    }
    // --------------------------------------------------------

    return game;
};

// --- NOVA FUNÇÃO EXPORTADA ---
// Esta função será chamada pelo timer 2 segundos depois
export const resolveTrick = (gameID) => {
    const game = games.get(gameID);
    if (!game || game.currentTrick.length !== 2) return game;

    const p1 = game.currentTrick[0];
    const p2 = game.currentTrick[1];
    let winner = p1.player;

    // Lógica de quem ganha a vaza
    if (p1.card.suit === p2.card.suit) {
        if (POWER[p2.card.rank] > POWER[p1.card.rank]) winner = p2.player;
    } else if (p2.card.suit === game.trumpSuit) {
        winner = p2.player;
    }

    const points = VALUES[p1.card.rank] + VALUES[p2.card.rank];
    game.points[winner] += points;
    game.collected[winner].push(p1.card, p2.card);

    game.tricksHistory.push({
        trickNumber: game.tricksHistory.length + 1,
        player1: p1,
        player2: p2,
        winner: winner,
        points: points
    });

    game.currentTrick = [];
    game.currentPlayer = winner;
    game.currentLeader = winner; // Atualiza quem lidera a próxima
    
    // Comprar cartas (Agora acontece SÓ depois do timer)
    if (game.deck.length > 0) {
        const loser = (winner === game.player1) ? game.player2 : game.player1;
        
        // Vencedor compra primeiro
        if (game.deck.length > 0) game.hands[winner].push(game.deck.pop());
        if (game.deck.length > 0) game.hands[loser].push(game.deck.pop());
    }

    if (game.hands[game.player1].length === 0 && game.hands[game.player2].length === 0) {
        endGameNormal(game);
    }

    return game;
};

const endGameNormal = (game) => {
    game.status = 'FINISHED';
    game.endedAt = new Date();
    game.winnerReason = 'points';
    if (game.points[game.player1] > game.points[game.player2]) {
        game.winner = game.player1;
    } else if (game.points[game.player2] > game.points[game.player1]) {
        game.winner = game.player2;
    } else {
        game.winner = 'DRAW';
    }
};

export const forfeitGame = (gameID, loserID, reason = 'forfeit') => {
    const game = games.get(gameID);
    if (!game || game.status !== 'PLAYING') return null;

    const winnerID = (loserID === game.player1) ? game.player2 : game.player1;
    const remainingCards = [
        ...(game.hands[game.player1] || []),
        ...(game.hands[game.player2] || []),
        ...(game.deck || []),
        ...(game.currentTrick || []).map(play => play.card)
    ];
    const remainingPoints = remainingCards.reduce((sum, card) => sum + (VALUES[card.rank] || 0), 0);

    if (!game.points[winnerID]) game.points[winnerID] = 0;
    game.points[winnerID] += remainingPoints;
    if (!game.collected[winnerID]) game.collected[winnerID] = [];
    game.collected[winnerID].push(...remainingCards);

    game.hands[game.player1] = [];
    game.hands[game.player2] = [];
    game.deck = [];
    game.currentTrick = [];

    game.status = 'FINISHED';
    game.endedAt = new Date();
    game.winner = winnerID;
    game.winnerReason = reason;
    return game;
};

export const getGames = () => Array.from(games.values());

const generateDeck = () => {
    const deck = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({ suit, rank });
        });
    });
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};
