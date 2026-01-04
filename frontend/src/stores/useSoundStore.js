import { defineStore } from 'pinia';
import { Howl } from 'howler';

// Music
import gameModeMusic from '@/assets/sounds/game_mode.mp3';
import metalMusic from '@/assets/sounds/metal_music.mp3';
import phonkMusic from '@/assets/sounds/phonk.mp3';
import btsMusic from '@/assets/sounds/kpop_music.mp3';

// Sound Effects
import drawCardSFX from '@/assets/sounds/draw_card.wav';
import firstTapSFX from '@/assets/sounds/first_tap.wav';
import playCardSFX from '@/assets/sounds/play_card.wav';
import yeahSFX from '@/assets/sounds/yeah.wav';
import clappingSFX from '@/assets/sounds/clapping.mp3';

export const useSoundStore = defineStore('sound', {
  state: () => ({
    isMuted: false,
    musicVolume: 0.4,
    sfxVolume: 1.0,
    soundsBlocked: false,
    currentMusicKey: null,
    activeMusicMode: 'default',
    sounds: {
      // SFX
      firstTap: new Howl({ src: [firstTapSFX] }),
      playCard: new Howl({ src: [playCardSFX] }),
      drawCard: new Howl({ src: [drawCardSFX] }),
      yeah: new Howl({ src: [yeahSFX] }),
      clapping: new Howl({ src: [clappingSFX] }),

      // Music
      gameModeMusic: new Howl({
        src: [gameModeMusic],
        html5: false,
        loop: true
      }),
      metalMusic: new Howl({
        src: [metalMusic],
        html5: false,
        loop: true
      }),
      phonkMusic: new Howl({
        src: [phonkMusic],
        html5: false,
        loop: true
      }),
      btsMusic: new Howl({
        src: [btsMusic],
        html5: false,
        loop: true
      }),
    }
  }),
  actions: {
    playSound(soundName) {
      if (this.soundsBlocked) return;
      if (this.isMuted || !this.sounds[soundName]) return;

      const sound = this.sounds[soundName];
      sound.volume(this.sfxVolume);
      sound.play();
    },
    playMusic() {
      if (this.isMuted) return;
      this.soundsBlocked = false;

      const MODE_MAP = {
        'default': 'gameModeMusic',
        'metal': 'metalMusic',
        'phonk': 'phonkMusic',
        'bts': 'btsMusic'
      }

      const targetKey = MODE_MAP[this.activeMusicMode] || 'gameModeMusic';

     if (this.currentMusicKey && this.currentMusicKey !== targetKey) {
        if (this.sounds[this.currentMusicKey]) {
           this.sounds[this.currentMusicKey].stop();
        }
      }

      this.currentMusicKey = targetKey;

      const music = this.sounds[targetKey];
      music.volume(this.musicVolume);

      // Evitar Audio duplo
      if (!music.playing()) {
        music.play();
      }
    },
    playAchievementEffect() {
      if (this.soundsBlocked || this.isMuted) return;

      this.playSound('yeah');

      const clapping = this.sounds.clapping;
      const targetVol = this.sfxVolume;

      clapping.stop();

      clapping.volume(0);
      const id = clapping.play();

      if (id) {
        clapping.fade(0, targetVol, 2000, id);

        setTimeout(() => {
          if (clapping.playing(id)) {
            clapping.fade(targetVol, 0, 2000, id);

            setTimeout(() => {
                clapping.stop(id);
            }, 2000);
          }
        }, 3500);
      }
    },
    setMusicMode(modeName) {
      this.activeMusicMode = modeName;
      this.playMusic();
    },
    stopMusic() {
      if (this.currentMusicKey && this.sounds[this.currentMusicKey]) {
        this.sounds[this.currentMusicKey].stop();
        this.currentMusicKey = null;
      }
    },
    stopAll() {
      this.soundsBlocked = true;
      Object.values(this.sounds).forEach(sound => {
        sound.stop();
      });
      this.currentMusicKey = null;
    },
    toggleMute() {
      this.isMuted = !this.isMuted;
      Howl.mute(this.isMuted);
    },
    updateMusicVolume(val) {
      this.musicVolume = val;

      if (this.currentMusicKey && this.sounds[this.currentMusicKey]) {
        this.sounds[this.currentMusicKey].volume(val);
      }
    },
    updateSfxVolume(val) {
      this.sfxVolume = val;
    }
  }
});
