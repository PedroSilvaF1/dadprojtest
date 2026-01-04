import router from '@/router';
import { defineStore } from 'pinia';
import { useAlertStore } from "@/stores/useAlertStore";
import { useSoundStore } from "@/stores/useSoundStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from './useAuthStore';

const ACTION_DELAY = 800;
// Ações do Bot (ms)
const ACTION_BOT_DELAY = 3000;
const NEXT_GAME_DELAY = 2000;
const UNDO_LIMIT = 3;
export const TURN_LIMIT = 20; // segundos

export const useGameStore = defineStore('game', {
  state: () => ({
    activeGameMode: 9,  // Pode ser bisca de 3 ou 9 (nº de cartas que o deck dá no inicio)
    activeFormat: 'match', // 'match' ou 'single'
    games: [],            // Lista de salas para o Lobby
    multiplayerGame: {},  // Estado do jogo online atual
    deck: [],

    // Hands
    playerHand: [],
    botHand: [],

    // Marks
    playerMarks: 0,
    botMarks: 0,

    // Won Tricks Piles
    playerPile: [],
    botPile: [],

    trumpCard: null,
    trumpSuit: null,
    table: [],
    playerPoints: 0,
    botPoints: 0,
    roundWinner: null,

    dealer: null,
    currentLeader: null,
    currentPlayer: null,

    gameNum: 1,
    gameOver: false,
    matchOver: false,
    currentMatchId: null,
    isPractice: false,

    // Triggers para os alertas
    showRoundResult: false,
    showMatchResult: false,

    // Historico de um jogo
    tricksHistory: [],

    // Historico de todos os jogos num match
    matchHistory: [],

    // Contadores do tempo por jogo e por cada match
    // 120s = 2 minutos
    turnTime: TURN_LIMIT,
    gameDuration: 0,
    matchDuration: 0,

    multiplayerPlayerName: '',
    multiplayerOpponentName: '',
    multiplayerFormat: '',

    // Timer IDs internos
    turnTimerId: null,
    globalTimerId: null,

    /*
      Preciso de guardar todos os timeouts criados num array.
      Razão: Se o utilizador sair da rota game para ir para o home,
      os timeouts que foram criados e não acabaram, irão permanecer a correr no background.
      Isto acaba por causar um lag absurdo se voltarmos ao game logo a seguir de sair.
      Funções: registerTimeout(), clearAllTimers()
    */
    activeTimers: [],

    // Para a funcionalidade do undo
    isUndoActive: false,
    undoCounter: 0,
    botMoveTimerId: false
  }),
  getters: {
    matchStats: (state) => {
      const isWin = state.playerMarks >= 4;

      // reward calculation
      let totalCoins = 0;
      if (isWin) {
        if (state.matchHistory.length > 0) {
          const lastGame = state.matchHistory[state.matchHistory.length - 1];

          if (lastGame.playerPoints === 120) {
            totalCoins += 6;
          } else if (lastGame.playerPoints >= 91) {
            totalCoins += 4;
          } else {
            totalCoins += 3;
          }
        }
      }
      return {
        gamesWon: state.playerMarks,
        gamesLost: state.botMarks,
        winner: isWin ? 'Player' : 'Bot',
        looser: isWin ? 'Bot' : 'Player',
        resultado: isWin ? 'Victory' : 'Defeat',
        reward: totalCoins + ' coins',
        time: state.matchDuration + 's',
        history: state.matchHistory
      }
    }
  },
  actions: {

    setGames(gamesList) {
      this.games = gamesList || [];
    },
    setMultiplayerGame(game) {
        // 1. Matar qualquer timer offline que esteja a correr
        this.stopAllTimers(); 
        this.gameOver = false; // Garantir que não está em estado de Game Over
        this.matchOver = false;
        
        // 2. Definir o estado online
        this.multiplayerGame = game || {};
        
        // 3. (Opcional) Logs de debug para confirmares
        if (game) {
            console.log(`[Store] Jogo Online Atualizado. Turno de: ${game.currentPlayer}`);
        }
    },
    clearMultiplayerState() {
      this.multiplayerGame = {};
    },
    // ------------------------------
    // Lógico do tempo de jogo
    startGlobalTimer() {
      // Evitar duplicados
      if (this.globalTimerId) clearInterval(this.globalTimerId);

      this.globalTimerId = setInterval(() => {
        if (!this.matchOver && !this.gameOver) {
          this.gameDuration++;
          this.matchDuration++;

          //console.log("Match Duration: " + this.matchDuration + "s\n" + "Game Duration: " + this.gameDuration + "s");
        }
      }, 1000);
    },
    startTurnTimer() {
      if (this.turnTimerId) clearTimeout(this.turnTimerId);

      this.turnTime = TURN_LIMIT;

      this.turnTimerId = setInterval(() => {
        if (this.turnTime > 0) {
          this.turnTime--;
          // console.log("Turn Time left: " + this.turnTime + "s");
        } else {
          clearInterval(this.turnTimerId);
          console.log("Turn time expired!");
          this.turnExpired();
        }
      }, 1000);
    },
    stopTurnTimer() {
      if (this.turnTimerId) clearInterval(this.turnTimerId);
      this.turnTimerId = null;
    },
    stopGlobalTimer() {
      if (this.globalTimerId) clearInterval(this.globalTimerId);
      this.globalTimerId = null;
    },
    stopAllTimers() {
      this.stopTurnTimer();
      this.stopGlobalTimer();
      this.clearAllTimers();
    },

    // Lógica do Jogo
    async startNewMatch(options = {}) {
      console.log("New Match Started!", options);
      this.resetMatchState();

      // Atualizar o state com as opções recebidas
      this.activeGameMode = options.mode || 9;
      this.activeFormat = options.format || 'match';

      const authStore = useAuthStore();
      const userStore = useUserStore();
      const payload = {
        type: String(this.activeGameMode)
      };

      if (router.currentRoute.value.path === '/practice-match') {
        this.isPractice = true;
      }

      if (!this.isPractice && authStore.isAuthenticated) {
        // Chamar o persistMatch e esperar pelo id
        // O await aqui é necessário porque senão o matchId será uma promise e não um numero ID
        const matchId = await userStore.persistMatch(payload);

        if (matchId) {
          // Depois usa-se este id para o put no final da partida
          this.currentMatchId = matchId;
          this.startNewGame();
        } else {
          console.error("Could not start match (Backend error)");
        }
      } else {
        this.startNewGame();
      }
    },
    startNextGame() {
      console.log("New Game Started!");
      this.gameNum++;
      this.resetGameState();
      this.startNewGame();
    },
    startNewGame() {
      this.showNewGameAlert(this.gameNum);


      const soundStore = useSoundStore();
      soundStore.playMusic();

      // Resetar a duração do game e começar o temporizador global
      this.gameDuration = 0;
      this.startGlobalTimer();

      this.deck = this.generateDeck();
      const dealTime = this.dealCards();

      /*
        Naipe de trunfo é a última carta do baralho.
        É sempre tirada depois dos 7s, 8s e 9s serem removidos no generateDeck()
      */
      this.trumpCard = this.deck.pop();
      this.trumpSuit = this.trumpCard.suit;

      // Escolher de forma random o dealer
      if (!this.dealer) {
        this.dealer = Math.random() < 0.5 ? 'player' : 'bot';
      } else {
        // Trocar de dealer no próximo, depois do anterior
        // O primeiro jogo é sempre random
        this.dealer = this.dealer === 'player' ? 'bot' : 'player';
      }
      this.registerTimeout(() => {
        // O non dealer é que é o primeiro a jogar no começo do jogo
        if (this.dealer === 'player') {
          this.currentLeader = 'bot'
        } else {
          this.currentLeader = 'player'
        }

        this.currentPlayer = this.currentLeader;

        console.log("Turn Leader: " + this.currentPlayer);
        this.showTurnAlert();
        this.startTurnTimer();

        this.continueIfBotTurn();
      }, dealTime + 100);
    },
    generateDeck() {
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const ranks = ['A', 'K', 'Q', 'J', 7, 6, 5, 4, 3, 2];
      // Na bisca, os [8s, 9s, 10s] são removidos do baralho
      const cards = [];

      suits.forEach(suit => {
        ranks.forEach(rank => cards.push({ suit, rank }))
      });

      return this.shuffleDeck(cards);
    },
    shuffleDeck(deck) {
      return deck.sort(() => Math.random() - 0.5);
    },
    dealCards() {
      const soundStore = useSoundStore();

      // Escolher aleatoriamente quem recebe a primeira carta
      const playerFirst = Math.random() < 0.5;
      let delay = 0;

      const totalCardsToDeal = this.activeGameMode * 2;

      // 18 ou 6 cartas no total (9 ou 3 para cada jogador)
      for (let i = 0; i < totalCardsToDeal; i++) {
        this.registerTimeout(() => {
          // Define quem recebe a carta nesta volta
          const giveToPlayer = playerFirst
            ? i % 2 === 0          // se player começa: índices pares = player
            : i % 2 === 1;         // se bot começa: índices ímpares = player

          if (giveToPlayer) {
            soundStore.playSound('drawCard');
            this.playerHand.push(this.deck.shift());
          } else {
            soundStore.playSound('drawCard');
            this.botHand.push(this.deck.shift());
          }
        }, delay);

        delay += 300;
      }
      return delay;
    },
    playCard(card) {
      const soundStore = useSoundStore();
      soundStore.playSound('playCard');

      const alertStore = useAlertStore();

      if (alertStore.turnAlertVisible) {
        return;
      }

      // Só pode jogar se for a vez do player e ainda houver espaço na mesa
      if (this.currentPlayer !== 'player' || this.table.length >= 2 || this.gameOver) {
        return
      }

      /*
        Se já não há deck e já está 1 carta na mesa,
        o player tem de assistir se tiver carta do mesmo naipe
      */
      if (!this.isCardPlayable(card)) return;

      // Parar o temporizador do turno se o jogador jogar
      this.stopTurnTimer();

      this.table.push(card);
      this.playerHand = this.playerHand.filter(c => c !== card);

      // Lógica para o undo
      if (this.currentLeader === 'player' && this.table.length === 1) {
        this.isUndoActive = true;
      } else {
        this.isUndoActive = false;
      }

      // Se apenas tivermos 2 cartas na mesa, é o fim da trick
      if (this.table.length === 2) {
        this.registerTimeout(() => {
          this.resolveTrick();
        }, ACTION_DELAY)
      } else {
        // Player saiu primeiro, agora é a vez do bot
        this.currentPlayer = 'bot';
        this.startTurnTimer();
        this.continueIfBotTurn();
      }
    },
    continueIfBotTurn() {
      if (this.currentPlayer !== 'bot' || this.gameOver) return;
      if (this.botHand.length === 0) return;

      /*
        Se depois da jogada do bot já existirem 2 cartas na mesa,
        terminamos a vaza. Caso contrário, passa para o player.
      */
      const timerId = this.registerTimeout(() => {
        this.isUndoActive = false;
        this.botMoveTimerId = null;

        this.botPlayCard();
        this.stopTurnTimer();

        if (this.table.length === 1) {
          this.currentPlayer = 'player';
          this.startTurnTimer();
        }

        if (this.table.length === 2) {
          this.registerTimeout(() => {
            this.resolveTrick();
          }, ACTION_DELAY)
        }
      }, ACTION_BOT_DELAY);

      this.botMoveTimerId = timerId;
    },
    async undoLastMove() {
      if (this.undoCounter >= UNDO_LIMIT) {
        console.warn("Undo limit reached");
        return;
      }
      if (!this.isUndoActive || this.table.length !== 1) return;

      if (!this.isPractice) {
        const userStore = useUserStore();
        const alertStore = useAlertStore();

        const success = await userStore.payForUndo();

        if (!success) {
          console.warn("Coins Insufficient!");
          alertStore.show("Coins Insufficient!");
          return;
        }
      }

      // Cancelar a jogada do bot
      if (this.botMoveTimerId) {
        clearTimeout(this.botMoveTimerId);
        this.activeTimers = this.activeTimers.filter(id => id !== this.botMoveTimerId);
        this.botMoveTimerId = null;
      }

      // Remover a card jogada e voltar para a mão
      const card = this.table.pop();
      if (card) {
        this.playerHand.push(card);
      }

      // Resetar o estado do jogo
      this.currentPlayer = 'player';
      this.undoCounter++;
      this.isUndoActive = false;

      // Dar restart ao timer para o player
      this.startTurnTimer();
    },
    botPlayCard() {
      if (this.table.length >= 2 || this.botHand.length === 0 || this.gameOver) {
        return
      }

      const botHand = this.botHand;
      const trump = this.trumpSuit;

      // Definir se o bot joga primeiro ou não
      // Influencia as decisões do bot
      const tableCard = this.table[0] || null;

      /*
        1ª possibilidade: Bot joga primeiro
      */
      if (!tableCard) {

        // Se existir trunfo, prefere trunfo abaixo
        const trumps = botHand.filter(c => c.suit === trump);

        if (trumps.length > 0) {
          return this.useBotCard(trumps.sort(this.cardSort)[0]);
        }

        // Se não tiver trunfo, escolhe a carta de menor valor
        const lowestCard = botHand.sort(this.cardSort)[0];
        return this.useBotCard(lowestCard);
      }

      /*
        2ª possibilidade: Bot joga depois do user
      */

      // 1. Ver cartas do mesmo naipe
      const sameSuit = botHand.filter(c => c.suit === tableCard.suit);
      if (sameSuit.length > 0) {

        // Ver as cartas que ganham da carta do user
        const winningCards = sameSuit.filter(c =>
          this.cardValue(c.rank) > this.cardValue(tableCard.rank)
        );

        // Ganhar com a mais barata possível
        if (winningCards.length > 0) {
          const bestWin = winningCards.sort(this.cardSort)[0];
          return this.useBotCard(bestWin);
        }

        // Não consegue ganhar, descarta a menor do mesmo naipe
        const discard = sameSuit.sort(this.cardSort)[0];
        return this.useBotCard(discard);
      }

      // 2. Não tem cartas do mesmo naipe
      const trumps = botHand.filter(c => c.suit === trump);

      if (trumps.length > 0) {
        // Joga o trunfo mais baixo possível
        const lowestTrump = trumps.sort(this.cardSort)[0];
        return this.useBotCard(lowestTrump);
      }

      // 3. Não tem trunfo, descarta a carta mais baixa
      const lowest = botHand.sort(this.cardSort)[0];
      return this.useBotCard(lowest);
    },
    useBotCard(card) {
      const soundStore = useSoundStore();

      if (this.table.length >= 2) {
        return;
      }
      soundStore.playSound('playCard');
      this.table.push(card);
      this.botHand = this.botHand.filter(c => c !== card);
      return card;
    },
    cardValue(rank) {
      const values = {
        'A': 11,
        '7': 10,
        'K': 4,
        'Q': 2,
        'J': 3,
        6: 0, 5: 0, 4: 0, 3: 0, 2: 0
      };
      return values[rank];
    },
    cardSort(a, b) {
      return this.cardValue(a.rank) - this.cardValue(b.rank);
    },
    resolveTrick() {
      if (this.table.length !== 2) return;

      // Desativar o undo quando a trick tiver acabado
      this.isUndoActive = false;
      this.stopTurnTimer();

      // Saber qual carta é de quem, com base em quem liderou
      let playerCard, botCard, firstCard, secondCard, firstOwner, secondOwner;

      if (this.currentLeader === 'player') {
        playerCard = this.table[0]
        botCard = this.table[1]
        firstCard = playerCard
        secondCard = botCard
        firstOwner = 'player'
        secondOwner = 'bot'
      } else {
        botCard = this.table[0]
        playerCard = this.table[1]
        firstCard = botCard
        secondCard = playerCard
        firstOwner = 'bot'
        secondOwner = 'player'
      }

      const result = this.checkTrickWinner(firstCard, secondCard, this.trumpSuit);
      const winner = result === 'first' ? firstOwner : secondOwner;

      this.roundWinner = winner;

      const trickPoints = this.cardValue(playerCard.rank) + this.cardValue(botCard.rank);

      if (winner === 'player') {
        this.playerPile.push(playerCard, botCard);
        this.playerPoints += trickPoints;
      } else {
        this.botPile.push(playerCard, botCard);
        this.botPoints += trickPoints;
      }

      // Guardar no histórico
      this.tricksHistory.push({
        trickNumber: this.tricksHistory.length + 1,
        playerCard: { ...playerCard },
        botCard: { ...botCard },
        leader: this.currentLeader,
        winner: winner,
        points: trickPoints
      });

      // Limpar mesa
      this.table = [];

      // Fase de compra (se ainda houver deck)
      this.drawCardsAfterTrick(winner);

      this.undoCounter = 0;

      // Ver se o jogo acabou
      this.checkGameEnd();

      if (!this.gameOver) {
        // Próxima vaza é liderada pelo vencedor
        this.currentLeader = winner;
        this.currentPlayer = winner;

        console.log("Turn Leader: " + this.currentPlayer);
        this.showTurnAlert();

        // Começar o temporizador para a próxima trick
        this.startTurnTimer();

        // Se for o bot, ele começa logo a próxima vaza
        this.continueIfBotTurn();
      } else {
        this.currentPlayer = null;
        this.currentLeader = null;
        this.stopTurnTimer();
      }

    },
    turnExpired() {
      if (this.currentPlayer === 'player' && this.playerHand.length > 0) {
        const mustAssist = this.deck.length === 0 && !this.trumpCard && this.table.length === 1;

        if (mustAssist) {
          const leadingCardSuit = this.table[0].suit;
          const cardsOfLeadingSuit = this.playerHand.filter(card => card.suit === leadingCardSuit);

          if (cardsOfLeadingSuit.length > 0) {
            // Jogar carta aleatória com o mesmo naipe que o outro jogador
            const randomCard = cardsOfLeadingSuit[Math.floor(Math.random() * cardsOfLeadingSuit.length)];
            this.playCard(randomCard);
          } else {
            // Se não houver cartas com mo mesmo naipe, escolhe uma random
            const randomCard = this.playerHand[Math.floor(Math.random() * this.playerHand.length)];
            this.playCard(randomCard);
          }
        } else {
          // If not required to assist, play a random card
          const randomCard = this.playerHand[Math.floor(Math.random() * this.playerHand.length)];
          this.playCard(randomCard);
        }
      }
    },
    checkTrickWinner(firstCard, secondCard, trumpSuit) {
      if (firstCard.suit === secondCard.suit) {
        if (this.cardValue(firstCard.rank) >= this.cardValue(secondCard.rank)) {
          return 'first';
        } else {
          return 'second';
        }
      }

      const firstIsTrump = firstCard.suit === trumpSuit;
      const secondIsTrump = secondCard.suit === trumpSuit;

      if (firstIsTrump && !secondIsTrump) return 'first';
      if (!firstIsTrump && secondIsTrump) return 'second';

      return 'first';
    },
    drawCardsAfterTrick(winner) {
      const soundStore = useSoundStore();

      if (this.deck.length === 0 && !this.trumpCard) {
        return; // já estamos na fase final, ninguém compra
      }

      const drawFor = (who) => {

        // Preciso de checkar a carda antes de fazer fallback para o trump card
        // Para a ultima carta a ser tirada do deck ser o trunfo
        let cardToDraw = null;

        if (this.deck.length > 0) {
          cardToDraw = this.deck.shift();
        } else if (this.trumpCard) {
          // se o deck estiver vazio, o jogador do turno vai buscar o trunfo
          cardToDraw = this.trumpCard;
          this.trumpCard = null; // Remover visualmente da tabela
        } else {
          return;
        }

        if (who === 'player') {
          this.playerHand.push(cardToDraw);
        } else {
          this.botHand.push(cardToDraw);
        }
      }

      // O vencedor é que saca sempre primeiro
      if (winner === 'player') {
        soundStore.playSound('drawCard');
        drawFor('player');

        this.registerTimeout(() => {
          soundStore.playSound('drawCard');
          drawFor('bot');
        }, ACTION_DELAY);
      } else {
        soundStore.playSound('drawCard');
        drawFor('bot');

        this.registerTimeout(() => {
          soundStore.playSound('drawCard');
          drawFor('player');
        }, ACTION_DELAY);
      }
    },
    checkGameEnd() {
      const noCardsInHands =
        this.playerHand.length === 0 &&
        this.botHand.length === 0 &&
        this.deck.length === 0 &&
        this.table.length === 0 &&
        !this.trumpCard;

      if (!noCardsInHands) return;

      this.gameOver = true;
      this.stopTurnTimer();

      // Atribuir marks conforme os pontos
      this.assignMarksForGame();

      // Salvar o histórico do jogo
      this.saveCurrentGameHistory();

      if (this.playerPoints > this.botPoints) {
        let achievement = 'Risca';

        if (this.playerPoints === 120) {
          achievement = 'Bandeira';
        } else if (this.playerPoints >= 91) {
          achievement = 'Capote';
        }

        this.showAchievementAlert(achievement);
        const soundStore = useSoundStore();
        soundStore.playAchievementEffect();
      }

      // Ver se match terminou
      if (this.playerMarks >= 4 || this.botMarks >= 4) {
        this.matchOver = true;
        this.stopAllTimers();

        // Put request para a match que foi criada com status started e trocar para ended
        if (!this.isPractice && this.currentMatchId) {
          const userStore = useUserStore();
          const payload = this.endGamePayload();

          // Call Edit Match with the stored ID
          userStore.editMatch(this.currentMatchId, payload);
        }


        this.registerTimeout(() => {
          router.push('/match-result');
        }, NEXT_GAME_DELAY + 500);
      } else {
        // A partida não acabou, mas o jogo sim
        this.registerTimeout(() => {
          this.startNextGame()
        }, NEXT_GAME_DELAY)
      }
    },
    assignMarksForGame() {
      const p = this.playerPoints;
      const b = this.botPoints;

      const giveMarks = (points) => {
        if (points === 120) return 4;  // bandeira
        if (points >= 91) return 2;    // capote
        if (points >= 61) return 1;    // risca
        return 0;
      }

      const playerMarksGained = giveMarks(p);
      const botMarksGained = giveMarks(b);

      // Só um deve ganhar marks (o que tiver mais ponto
      if (p > b && playerMarksGained > 0) {
        this.playerMarks = Math.min(4, this.playerMarks + playerMarksGained)
      } else if (b > p && botMarksGained > 0) {
        this.botMarks = Math.min(4, this.botMarks + botMarksGained)
      }
    },
    resetGameState() {
      this.clearAllTimers();
      this.deck = [];
      this.playerHand = [];
      this.botHand = [];
      this.playerPile = [];
      this.botPile = [];
      this.table = [];
      this.tricksHistory = [];
      this.playerPoints = 0;
      this.botPoints = 0;
      this.undoCounter = 0;
      this.trumpCard = null;
      this.trumpSuit = null;
      this.currentLeader = null;
      this.currentPlayer = null;
      this.gameOver = false;
      this.showRoundResult = false;
      this.turnTime = TURN_LIMIT
      this.isUndoActive = false;
      this.botMoveTimerId = null;
    },
    resetMatchState() {
      this.stopAllTimers();
      this.resetGameState();
      this.matchHistory = [];
      this.playerMarks = 0;
      this.botMarks = 0;
      this.matchOver = false;
      this.showMatchResult = false;
      this.dealer = null;
      this.gameNumber = 1;
      this.matchDuration = 0;
      this.isPractice = false;
      this.multiplayerPlayerName = '';
      this.multiplayerOpponentName = '';
      this.multiplayerFormat = '';
    },

    // Test Purposes
    simulateEndMatchScenario() {
      this.stopAllTimers();

      // Clear da mesa e do deck
      this.deck = [];
      this.table = [];
      this.trumpCard = null;
      this.trumpSuit = 'spades';

      // Scenario: Resta apenas uma carta, e é o player que a tem
      this.playerHand = [{ suit: 'spades', rank: 'A' }];
      this.botHand = [{ suit: 'hearts', rank: '2' }];

      // Turno do player
      this.currentLeader = 'player';
      this.currentPlayer = 'player';
      this.gameOver = false;

      // Ter a certeza que o player ganha
      this.playerMarks = 3;
      this.botMarks = 0;
      this.playerPoints = 60;
      this.botPoints = 0;

      this.matchDuration = 299;

      this.showTurnAlert();
    },
    simulateEndMatchCapoteScenario() {
      this.stopAllTimers();

      // Clear da mesa e do deck
      this.deck = [];
      this.table = [];
      this.trumpCard = null;
      this.trumpSuit = 'spades';

      // Scenario: Resta apenas uma carta, e é o player que a tem
      this.playerHand = [{ suit: 'spades', rank: 'A' }];
      this.botHand = [{ suit: 'hearts', rank: '2' }];

      // Turno do player
      this.currentLeader = 'player';
      this.currentPlayer = 'player';
      this.gameOver = false;

      // Ter a certeza que o player ganha com capote (91-119 pontos)
      this.playerMarks = 3;
      this.botMarks = 0;
      this.playerPoints = 91;
      this.botPoints = 0;

      this.matchDuration = 299;

      this.showTurnAlert();
    },
    simulateEndMatchBandeiraScenario() {
      this.stopAllTimers();

      // Clear da mesa e do deck
      this.deck = [];
      this.table = [];
      this.trumpCard = null;
      this.trumpSuit = 'spades';

      // Scenario: Resta apenas uma carta, e é o player que a tem
      this.playerHand = [{ suit: 'spades', rank: 'A' }];
      this.botHand = [{ suit: 'hearts', rank: '2' }];

      // Turno do player
      this.currentLeader = 'player';
      this.currentPlayer = 'player';
      this.gameOver = false;

      // Ter a certeza que o player ganha com bandeira (120 pontos)
      this.playerMarks = 3;
      this.botMarks = 0;
      this.playerPoints = 109;
      this.botPoints = 0;

      this.matchDuration = 299;

      this.showTurnAlert();
    },
    simulateEndGameAchievement(achievement) {
      this.stopAllTimers();

      // Clear da mesa e do deck
      this.deck = [];
      this.table = [];
      this.trumpCard = null;
      this.trumpSuit = 'spades';

      // Scenario: Resta apenas uma carta, e é o player que a tem
      this.playerHand = [{ suit: 'spades', rank: 'A' }];
      this.botHand = [{ suit: 'hearts', rank: '2' }];

      // Turno do player
      this.currentLeader = 'player';
      this.currentPlayer = 'player';
      this.gameOver = false;

      // Ter a certeza que o player ganha com capote (91-119 pontos)
      this.playerMarks = 0;
      this.botMarks = 0;

      switch (achievement) {
        case 'Risca':
          this.playerPoints = 60;
          this.botPoints = 0;
          break;

        case 'Capote':
          this.playerPoints = 80;
          this.botPoints = 0;
          break;

        case 'Bandeira':
          this.playerPoints = 109;
          this.botPoints = 0;
          break;
      }

      this.matchDuration = 299;
    },
    showTurnAlert() {
      const alert = useAlertStore();
      alert.showTurnChange(this.currentPlayer);
    },
    showNewGameAlert(num) {
      const alert = useAlertStore();
      alert.showNewGame(num);
    },
    showAchievementAlert(achievement) {
      const alert = useAlertStore();
      alert.showAchievement(achievement);
    },
    registerTimeout(callback, delay) {
      const id = setTimeout(() => {
        this.activeTimers = this.activeTimers.filter(tId => tId !== id);
        callback();
      }, delay);
      this.activeTimers.push(id);
      return id;
    },
    clearAllTimers() {
      this.activeTimers.forEach(id => clearTimeout(id));
      this.activeTimers = [];
    },
    isCardPlayable(card) {
      if (this.currentPlayer !== 'player' || this.gameOver || this.table.length >= 2) {
        return false;
      }

      const mustAssist = this.deck.length === 0 && !this.trumpCard && this.table.length === 1;

      if (mustAssist) {
        const leadingCardSuit = this.table[0].suit;
        const hasLeadingSuit = this.playerHand.some(c => c.suit === leadingCardSuit);

        // If I have the suit, but this card is not that suit, it's disabled
        if (hasLeadingSuit && card.suit !== leadingCardSuit) {
          return false;
        }
      }

      return true
    },
    saveCurrentGameHistory() {
      this.matchHistory.push({
        gameNumber: this.gameNum,
        tricks: [... this.tricksHistory],
        playerPoints: this.playerPoints,
        botPoints: this.botPoints,
        duration: this.gameDuration
      });
    },
    createMatchPayload() {
      if (!this.isPractice) {
        // Preparar para guardar a match
        const userStore = useUserStore();

        const totalP1Points = this.matchHistory.reduce((sum, g) => sum + g.playerPoints, 0);
        const totalP2Points = this.matchHistory.reduce((sum, g) => sum + g.botPoints, 0);

        const payload = {
          type: '9',
          total_time: 300.00, // TODO: Timer não implementado ainda
          player1_marks: this.playerMarks,
          player2_marks: this.botMarks,
          player1_points_total: totalP1Points,
          player2_points_total: totalP2Points,
          status: 'Started',
          games: this.matchHistory.map(game => ({
            player1_points: game.playerPoints,
            player2_points: game.botPoints,
            tricks: game.tricks // Guardar no custom
          }))
        };

        userStore.persistMatch(payload);
      }
    },
    endGamePayload() {
      if (!this.isPractice) {
        const totalP1Points = this.matchHistory.reduce((sum, g) => sum + g.playerPoints, 0);
        const totalP2Points = this.matchHistory.reduce((sum, g) => sum + g.botPoints, 0);
        const matchFormat = this.multiplayerFormat || this.activeFormat || 'match';

        return {
          type: String(this.multiplayerGame?.type || this.activeGameMode || '9'),
          total_time: 300.00, // TODO: Timer não implementado ainda
          player1_marks: this.playerMarks,
          player2_marks: this.botMarks,
          player1_points_total: totalP1Points,
          player2_points_total: totalP2Points,
          status: 'Ended',
          custom: {
            format: matchFormat
          },
          games: this.matchHistory.map(game => ({
            player1_points: game.playerPoints,
            player2_points: game.botPoints,
            tricks: game.tricks // Guardar no custom
          }))
        };
      }
    }
  }
});
