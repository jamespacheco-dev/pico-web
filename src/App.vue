<script setup>
import { ref } from 'vue'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'

const activeGame = ref(null)
const activeLabels = ref(null)

function onGameStarted(game, labels) {
  activeGame.value = game
  activeLabels.value = labels
}

function onReset() {
  activeGame.value = null
  activeLabels.value = null
}
</script>

<template>
  <SetupScreen
    v-if="!activeGame"
    @started="onGameStarted"
  />
  <GameScreen
    v-else
    :initial-game="activeGame"
    :labels="activeLabels"
    @reset="onReset"
  />
</template>
