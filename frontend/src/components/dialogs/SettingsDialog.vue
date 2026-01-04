<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div
      class="bg-[#121213] text-gray-300 rounded-xl shadow-lg p-6 w-full max-w-sm relative border border-gray-800 flex flex-col max-h-[90vh] overflow-y-auto">
      <h3 class="text-center text-xl font-bold mb-6 text-white">
        Settings
      </h3>

      <div class="space-y-6 mb-8">

        <div class="flex flex-col space-y-3">
          <div class="flex justify-between items-center text-sm font-medium">
            <span class="flex items-center gap-2">
              <img src="/icons/music_note.svg" onerror="this.style.display='none'" class="w-5 h-5 opacity-80"
                alt="music" />
              Music Volume
            </span>
            <span class="text-xs text-red-500 font-bold">{{ Math.round(musicVol * 100) }}%</span>
          </div>
          <div class="relative h-8 flex items-center">
            <input type="range" min="0" max="1" step="0.01" v-model="musicVol"
              class="custom-slider w-full bg-transparent cursor-pointer" />
          </div>
        </div>

        <div class="flex flex-col space-y-3">
          <div class="flex justify-between items-center text-sm font-medium">
            <span class="flex items-center gap-2">
              <img src="/icons/sound_sfx.svg" onerror="this.style.display='none'" class="w-5 h-5 opacity-80"
                alt="sfx" />
              SFX Volume
            </span>
            <span class="text-xs text-red-500 font-bold">{{ Math.round(sfxVol * 100) }}%</span>
          </div>
          <div class="relative h-8 flex items-center">
            <input type="range" min="0" max="1" step="0.01" v-model="sfxVol"
              class="custom-slider w-full bg-transparent cursor-pointer" />
          </div>
        </div>
      </div>

      <hr class="border-gray-800 mb-6" />

      <div class="mb-8">
        <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
          Game Options
        </h4>

        <div class="grid grid-cols-2 gap-y-4 gap-x-3">
          <div class="flex items-center justify-between bg-gray-900/80 p-2 rounded border border-gray-800">
            <span class="text-[10px] sm:text-xs text-gray-400 font-medium truncate mr-1">
              Ray Tracing
            </span>

            <input type="checkbox"
              class="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900 bg-gray-700 cursor-pointer" />
          </div>
          <div class="flex items-center justify-between bg-gray-900/80 p-2 rounded border border-gray-800">
            <span class="text-[10px] sm:text-xs text-gray-400 font-medium truncate mr-1">
              BTS Mode
            </span>

            <input type="checkbox"
            v-model="btsMode"
              class="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900 bg-gray-700 cursor-pointer" />
          </div>
          <div class="flex items-center justify-between bg-gray-900/80 p-2 rounded border border-gray-800">
            <span class="text-[10px] sm:text-xs text-gray-400 font-medium truncate mr-1">
              Metal Mode
            </span>

            <input type="checkbox"
            v-model="metalMode"
              class="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900 bg-gray-700 cursor-pointer" />
          </div>
          <div class="flex items-center justify-between bg-gray-900/80 p-2 rounded border border-gray-800">
            <span class="text-[10px] sm:text-xs text-gray-400 font-medium truncate mr-1">
              Phonk Edit Mode
            </span>

            <input type="checkbox"
            v-model="phonkEditMode"
              class="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900 bg-gray-700 cursor-pointer" />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center mt-auto">
        <button id="close" @click="$emit('close')" type="button" class="w-full sm:w-auto justify-center cursor-pointer font-bold text-white transition
          bg-red-600 px-8 py-3 sm:px-6 sm:py-3 rounded-lg
          border-red-700 border-b-[4px]
          hover:bg-red-500 hover:border-red-700 hover:-translate-y-[1px]
          active:border-b-[2px] active:brightness-90 active:translate-y-[2px]
          shadow-lg shadow-red-900/50">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSoundStore } from "@/stores/useSoundStore";

const soundStore = useSoundStore();

const handleModeChange = (isEnabled, modeName) => {
  if (isEnabled) {
    soundStore.setMusicMode(modeName);
  } else {
    soundStore.setMusicMode('default');
  }
};

const metalMode = computed({
  get: () => soundStore.activeMusicMode === 'metal',
  set: (val) => handleModeChange(val, 'metal')
});

const phonkEditMode = computed({
  get: () => soundStore.activeMusicMode === 'phonk',
  set: (val) => handleModeChange(val, 'phonk')
});

const btsMode = computed({
  get: () => soundStore.activeMusicMode === 'bts',
  set: (val) => handleModeChange(val, 'bts')
});

const musicVol = computed({
  get: () => soundStore.musicVolume,
  set: (val) => soundStore.updateMusicVolume(Number(val))
});

const sfxVol = computed({
  get: () => soundStore.sfxVolume,
  set: (val) => soundStore.updateSfxVolume(Number(val))
});
</script>

<style scoped>
.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  background: transparent;
}

.custom-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  cursor: pointer;
  background: #374151;
  border-radius: 999px;
}

.custom-slider::-moz-range-track {
  width: 100%;
  height: 8px;
  cursor: pointer;
  background: #374151;
  border-radius: 999px;
}

/* 2. Chrome, Safari, iOS */
.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 28px;
  width: 28px;
  border-radius: 50%;
  background: #dc2626;
  cursor: pointer;
  border: none;
  margin-top: -10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

/* Firefox */
.custom-slider::-moz-range-thumb {
  height: 28px;
  width: 28px;
  border-radius: 50%;
  background: #dc2626;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
</style>
