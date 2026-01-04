// Lista de todos os naipes e ranks
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['A', 'K', 'Q', 'J', 7, 6, 5, 4, 3, 2];

/*
  Fazer load de todas imagens que se abre o site
  (Fixed bug:   Evita-se que cartas ou imagens apareceu a carregar aos poucos.)
*/
export function preloadImages() {
  const imagesToLoad = [];

  // Adicionar verso da carta
  const backImg = new Image();
  backImg.src = new URL('../assets/cards/back/red.png', import.meta.url).href;

  // Adicionar todas as cartas da frente
  suits.forEach(suit => {
    ranks.forEach(rank => {
      const img = new Image();
      img.src = new URL(`../assets/cards/front/white/${suit}_${rank}.png`, import.meta.url).href;
      imagesToLoad.push(img);
    });
  });

  const leaveGameImg = new Image();
  leaveGameImg.src = new URL('../assets/images/leave_game.png', import.meta.url).href;
  imagesToLoad.push(leaveGameImg);

  const handPointingDown = new Image();
  const handPointingUp = new Image();
  handPointingDown.src = new URL('../assets/images/gif/hand_pointing_down.gif', import.meta.url).href;
  handPointingUp.src = new URL('../assets/images/gif/hand_pointing_up.gif', import.meta.url).href;


  console.log("Imagens pré-carregadas em cache!");
}
