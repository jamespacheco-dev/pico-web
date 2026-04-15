<script setup>
import { ref } from 'vue'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'

const activeGame = ref(null)

function onGameStarted(game) {
  activeGame.value = game
}

function onReset() {
  activeGame.value = null
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
    @reset="onReset"
  />
</template>
