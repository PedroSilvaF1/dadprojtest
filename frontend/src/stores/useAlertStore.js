import { defineStore } from "pinia";
import HandPointingDown from '@/assets/images/gif/hand_pointing_down.gif';
import HandPointingUp from '@/assets/images/gif/hand_pointing_up.gif';

export const useAlertStore = defineStore("alert", {
  state: () => ({
    message: "",
    achievement: "",
    imageSrc: "",
    imageAlt: "",
    imageDirection: "",
    visible: false,
    turnAlertVisible: false,
    gameAlertVisible: false,
    achievementAlertVisible: false
  }),

  actions: {
    show(msg, duration = 2000) {
      this.message = msg;
      this.visible = true;

      setTimeout(() => {
        this.visible = false;
      }, duration);
    },
    showTurnChange(turnLeader) {
      if (turnLeader === 'player') {
        this.message = "You lead the trick";
        this.imageSrc = HandPointingDown;
        this.imageAlt = "Hand Pointing Down";
        this.imageDirection = "down";
      } else {
        this.message = "Bot leads the trick"
        this.imageSrc = HandPointingUp;
        this.imageAlt = "Hand Pointing Up"
        this.imageDirection = "up";
      }

      this.turnAlertVisible = true;

      setTimeout(() => {
        this.turnAlertVisible = false;
      }, 2000);
    },
    showAchievement(achievement) {
      this.message = `Achievement: ${achievement}`;
      this.achievement = achievement;
      this.achievementAlertVisible = true;

      setTimeout(() => {
        this.achievementAlertVisible = false
        this.achievement = "";
      }, 2000);
    },
    showNewGame(gameNum) {
      this.message = `Game ${gameNum}`;
      this.gameAlertVisible = true;

      setTimeout(() => {
        this.gameAlertVisible = false;
      }, 2000);
    }
  }
});
