<script setup>
import { ref, computed, nextTick } from 'vue'
import { createGuess, rollback as apiRollback } from '../api.js'

const props = defineProps({
  initialGame: { type: Object, required: true },
})
const emit = defineEmits(['reset'])

const game = ref({ ...props.initialGame })
const guessInput = ref('')
const pico = ref(0)
const fermi = ref(0)
const loading = ref(false)
const error = ref('')
const liveMessage = ref('')

const isPlayerGuesses = computed(() => game.value.mode === 'player_guesses')
const isComplete = computed(() => game.value.status === 'complete')
const length = computed(() => game.value.config.length)
const guessCount = computed(() => game.value.guesses.length)
const countOptions = computed(() => Array.from({ length: length.value + 1 }, (_, i) => i))

function formatFeedback(fb) {
  if (fb.bagel) return 'Bagels'
  const parts = []
  if (fb.fermi > 0) parts.push(`${fb.fermi} Fermi`)
  if (fb.pico > 0) parts.push(`${fb.pico} Pico`)
  return parts.join(', ') || 'Bagels'
}

function feedbackClass(fb) {
  if (fb.bagel || (fb.pico === 0 && fb.fermi === 0)) return 'feedback-bagel'
  if (fb.fermi > 0 && fb.pico === 0) return 'feedback-fermi'
  return 'feedback-pico'
}

async function submitGuess() {
  const val = guessInput.value.trim()
  if (val.length !== length.value || !/^\d+$/.test(val)) {
    error.value = `Enter exactly ${length.value} digits.`
    return
  }
  error.value = ''
  loading.value = true
  try {
    game.value = await createGuess(game.value.id, { guess: val })
    guessInput.value = ''
    const latest = game.value.guesses.at(-1)
    if (isComplete.value) {
      liveMessage.value = `You got it in ${guessCount.value} guess${guessCount.value === 1 ? '' : 'es'}!`
    } else {
      liveMessage.value = `Guess ${latest.number}: ${formatFeedback(latest.feedback)}`
    }
    await nextTick()
    document.getElementById('guess-input')?.focus()
  } catch (e) {
    error.value = e.message ?? 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

async function submitFeedback() {
  error.value = ''
  loading.value = true
  try {
    game.value = await createGuess(game.value.id, {
      feedback: { pico: pico.value, fermi: fermi.value },
    })
    if (isComplete.value) {
      liveMessage.value = `The computer got it in ${guessCount.value} guess${guessCount.value === 1 ? '' : 'es'}!`
    } else {
      liveMessage.value = `Computer's next guess is ${game.value.current_guess}.`
    }
    pico.value = 0
    fermi.value = 0
  } catch (e) {
    error.value = e.message ?? 'Something went wrong.'
    if (e.error === 'contradictory_feedback') {
      error.value =
        'No valid numbers match that feedback — check your counts and try again, or roll back to a previous guess.'
    }
  } finally {
    loading.value = false
  }
}

async function rollbackTo(n) {
  error.value = ''
  loading.value = true
  try {
    game.value = await apiRollback(game.value.id, n)
    pico.value = 0
    fermi.value = 0
    liveMessage.value = `Rolled back to guess ${n}. Computer's current guess is ${game.value.current_guess}.`
  } catch (e) {
    error.value = e.message ?? 'Could not roll back.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container game">
    <!-- Live region for screen readers -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ liveMessage }}
    </div>

    <!-- Header -->
    <header class="game__header">
      <div class="game__meta">
        <span>
          {{ isPlayerGuesses ? 'You are guessing' : 'Computer is guessing' }}
          &middot;
          {{ length }} digits
        </span>
        <button
          class="btn btn-ghost btn-sm"
          type="button"
          @click="emit('reset')"
        >
          New game
        </button>
      </div>
    </header>

    <!-- Win state -->
    <template v-if="isComplete">
      <section
        class="card win-card"
        aria-labelledby="win-heading"
      >
        <h2 id="win-heading">
          {{ isPlayerGuesses ? 'You got it!' : 'Computer got it!' }}
        </h2>
        <p class="win-card__detail">
          Solved in
          <strong>{{ guessCount }} guess{{ guessCount === 1 ? '' : 'es' }}</strong>
        </p>
        <button
          class="btn btn-primary"
          type="button"
          @click="emit('reset')"
        >
          Play again
        </button>
      </section>
    </template>

    <!-- Active game -->
    <template v-else>
      <!-- Player guesses: guess input -->
      <section
        v-if="isPlayerGuesses"
        class="card"
        aria-label="Make a guess"
      >
        <h2>
          Guess {{ guessCount + 1 }}
        </h2>
        <form
          class="guess-form"
          @submit.prevent="submitGuess"
        >
          <div class="guess-form__row">
            <label
              for="guess-input"
              class="sr-only"
            >
              Enter your {{ length }}-digit guess
            </label>
            <input
              id="guess-input"
              v-model="guessInput"
              type="text"
              inputmode="numeric"
              :maxlength="length"
              :placeholder="'0'.repeat(length)"
              autocomplete="off"
              :disabled="loading"
              class="guess-input"
              aria-describedby="guess-hint"
            >
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading || guessInput.length !== length"
            >
              Guess
            </button>
          </div>
          <p
            id="guess-hint"
            class="hint"
          >
            Enter {{ length }} digit{{ length === 1 ? '' : 's' }}
            {{ game.config.allow_repeats ? '' : '— no repeated digits' }}
          </p>
          <div
            v-if="error"
            class="alert alert-error"
            role="alert"
          >
            {{ error }}
          </div>
        </form>
      </section>

      <!-- Computer guesses: show current guess + feedback form -->
      <section
        v-else
        class="card"
        aria-label="Give feedback on the computer's guess"
      >
        <h2>My guess</h2>
        <div
          class="current-guess"
          aria-label="Computer's current guess"
          aria-live="polite"
        >
          {{ game.current_guess }}
        </div>

        <form
          class="feedback-form"
          @submit.prevent="submitFeedback"
        >
          <p class="feedback-form__prompt">
            How many digits are correct?
          </p>

          <div class="feedback-form__row">
            <div class="feedback-form__field">
              <label
                for="fermi-input"
                class="feedback-label feedback-fermi"
              >
                Fermi
                <span class="feedback-label__sub">right digit, right place</span>
              </label>
              <select
                id="fermi-input"
                v-model="fermi"
                :disabled="loading"
              >
                <option
                  v-for="n in countOptions"
                  :key="n"
                  :value="n"
                >
                  {{ n }}
                </option>
              </select>
            </div>

            <div class="feedback-form__field">
              <label
                for="pico-input"
                class="feedback-label feedback-pico"
              >
                Pico
                <span class="feedback-label__sub">right digit, wrong place</span>
              </label>
              <select
                id="pico-input"
                v-model="pico"
                :disabled="loading"
              >
                <option
                  v-for="n in countOptions"
                  :key="n"
                  :value="n"
                >
                  {{ n }}
                </option>
              </select>
            </div>
          </div>

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
            Submit feedback
          </button>
        </form>
      </section>
    </template>

    <!-- Guess history -->
    <section
      v-if="guessCount > 0"
      class="history"
      aria-labelledby="history-heading"
    >
      <h3 id="history-heading">
        History
      </h3>
      <ol
        class="history__list"
        reversed
      >
        <li
          v-for="g in [...game.guesses].reverse()"
          :key="g.number"
          class="history__item"
        >
          <span
            class="history__number"
            aria-label="Guess number"
          >{{ g.number }}</span>
          <span
            class="history__value"
            aria-label="Guessed number"
          >{{ g.value }}</span>
          <span
            class="history__feedback"
            :class="feedbackClass(g.feedback)"
            :aria-label="`Feedback: ${formatFeedback(g.feedback)}`"
          >
            {{ formatFeedback(g.feedback) }}
          </span>
          <button
            v-if="!isPlayerGuesses && !isComplete"
            class="btn btn-ghost btn-sm"
            type="button"
            :aria-label="`Roll back to guess ${g.number}`"
            :disabled="loading"
            @click="rollbackTo(g.number)"
          >
            Go back
          </button>
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding-top: var(--space-lg);
}

.game__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.game__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.btn-sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.875rem;
  min-height: 2.25rem;
}

/* Win card */
.win-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.win-card__detail {
  font-size: 1.125rem;
  color: var(--color-text-muted);
}

/* Guess input */
.guess-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.guess-form__row {
  display: flex;
  gap: var(--space-sm);
}

.guess-input {
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-align: center;
  flex: 1;
}

.hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Current guess display */
.current-guess {
  font-family: var(--font-mono);
  font-size: clamp(3rem, 10vw, 5rem);
  font-weight: 800;
  letter-spacing: 0.2em;
  text-align: center;
  color: var(--color-text);
  padding: var(--space-lg) 0;
  line-height: 1;
}

/* Feedback form */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-top: var(--space-md);
}

.feedback-form__prompt {
  font-weight: 500;
}

.feedback-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.feedback-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.feedback-label {
  display: flex;
  flex-direction: column;
  font-size: 1.0625rem;
  font-weight: 700;
}

.feedback-label__sub {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

/* History */
.history {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.history h3 {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.history__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.history__item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  flex-wrap: wrap;
}

.history__number {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  min-width: 1.5rem;
}

.history__value {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  flex: 1;
}

.history__feedback {
  font-weight: 600;
}

@media (max-width: 400px) {
  .feedback-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
