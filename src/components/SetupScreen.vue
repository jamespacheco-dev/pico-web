<script setup>
import { ref, computed } from 'vue'
import { createGame } from '../api.js'

const emit = defineEmits(['started'])

const mode = ref('player_guesses')
const length = ref(3)
const allowRepeats = ref(false)
const difficulty = ref('easy')
const loading = ref(false)
const error = ref('')

const isComputerGuesses = computed(() => mode.value === 'computer_guesses')

async function start() {
  loading.value = true
  error.value = ''
  try {
    const game = await createGame({
      mode: mode.value,
      length: length.value,
      allow_repeats: allowRepeats.value,
      difficulty: isComputerGuesses.value ? difficulty.value : 'easy',
    })
    emit('started', game)
  } catch {
    error.value = 'Could not start the game. Try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container setup">
    <header class="setup__header">
      <h1>Pico Fermi Bagels</h1>
      <p class="setup__subtitle">
        A number guessing game
      </p>
    </header>

    <div class="card">
      <form
        novalidate
        @submit.prevent="start"
      >
        <!-- Mode -->
        <fieldset class="field-group">
          <legend>Who guesses the number?</legend>
          <div
            class="toggle-group"
            role="group"
          >
            <label
              class="toggle-option"
              :class="{ 'is-selected': mode === 'player_guesses' }"
            >
              <input
                v-model="mode"
                type="radio"
                name="mode"
                value="player_guesses"
                aria-label="I'll guess the number"
              >
              I'll guess
            </label>
            <label
              class="toggle-option"
              :class="{ 'is-selected': mode === 'computer_guesses' }"
            >
              <input
                v-model="mode"
                type="radio"
                name="mode"
                value="computer_guesses"
                aria-label="Computer guesses the number"
              >
              Computer guesses
            </label>
          </div>
        </fieldset>

        <!-- Length -->
        <fieldset class="field-group">
          <legend>How many digits?</legend>
          <div
            class="toggle-group"
            role="group"
          >
            <label
              v-for="n in [3, 4, 5]"
              :key="n"
              class="toggle-option"
              :class="{ 'is-selected': length === n }"
            >
              <input
                v-model="length"
                type="radio"
                name="length"
                :value="n"
                :aria-label="`${n} digits`"
              >
              {{ n }}
            </label>
          </div>
        </fieldset>

        <!-- Allow repeats -->
        <div class="field-group">
          <label class="checkbox-label">
            <input
              v-model="allowRepeats"
              type="checkbox"
            >
            Allow repeated digits
          </label>
        </div>

        <!-- Difficulty — computer_guesses only -->
        <fieldset
          v-if="isComputerGuesses"
          class="field-group"
        >
          <legend>Computer difficulty</legend>
          <div
            class="toggle-group"
            role="group"
          >
            <label
              v-for="d in ['easy', 'medium', 'hard']"
              :key="d"
              class="toggle-option"
              :class="{ 'is-selected': difficulty === d }"
            >
              <input
                v-model="difficulty"
                type="radio"
                name="difficulty"
                :value="d"
                :aria-label="`${d.charAt(0).toUpperCase() + d.slice(1)} difficulty`"
              >
              {{ d.charAt(0).toUpperCase() + d.slice(1) }}
            </label>
          </div>
        </fieldset>

        <div
          v-if="error"
          class="alert alert-error"
          role="alert"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="loading"
        >
          {{ loading ? 'Starting…' : 'Start game' }}
        </button>
      </form>
    </div>

    <details class="rules">
      <summary class="rules__summary">
        How to play
      </summary>
      <div class="rules__body">
        <p>
          One player picks a secret number with no repeated digits
          (unless repeats are on). The other player guesses, and each
          guess gets feedback:
        </p>
        <dl class="rules__list">
          <div class="rules__item">
            <dt class="feedback-fermi">
              Fermi
            </dt>
            <dd>Right digit, right position</dd>
          </div>
          <div class="rules__item">
            <dt class="feedback-pico">
              Pico
            </dt>
            <dd>Right digit, wrong position</dd>
          </div>
          <div class="rules__item">
            <dt class="feedback-bagel">
              Bagels
            </dt>
            <dd>No matching digits at all</dd>
          </div>
        </dl>
        <p>Guess until you get all Fermi!</p>
      </div>
    </details>
  </main>
</template>

<style scoped>
.setup {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding-top: var(--space-2xl);
}

.setup__header {
  text-align: center;
}

.setup__subtitle {
  margin-top: var(--space-xs);
  color: var(--color-text-muted);
  font-size: 1.125rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

/* Rules section */
.rules {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.rules__summary {
  padding: var(--space-md) var(--space-lg);
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text);

  &::-webkit-details-marker {
    display: none;
  }

  &::before {
    content: '▶';
    font-size: 0.75em;
    transition: transform 0.2s;
  }
}

details[open] .rules__summary::before {
  transform: rotate(90deg);
}

.rules__body {
  padding: 0 var(--space-lg) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  color: var(--color-text-muted);
}

.rules__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-left: var(--space-md);
}

.rules__item {
  display: flex;
  gap: var(--space-sm);
  align-items: baseline;
}

.rules__item dt {
  min-width: 4.5rem;
  font-size: 1rem;
}

.rules__item dd {
  color: var(--color-text-muted);
}
</style>
