import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import GameScreen from '../GameScreen.vue'

vi.mock('../../api.js', () => ({
  createGuess: vi.fn(),
  rollback: vi.fn(),
}))

const defaultLabels = { fermi: 'Fermi', pico: 'Pico', bagels: 'Bagel' }

function makeGame(overrides = {}) {
  return {
    id: 'test-id',
    mode: 'player_guesses',
    config: { length: 3, allow_repeats: false },
    difficulty: 'hard',
    status: 'in_progress',
    max_guesses: 6,
    guesses: [],
    ...overrides,
  }
}

function makeGuess(number, value, fermi, pico) {
  return {
    number,
    value,
    feedback: { fermi, pico, bagel: fermi === 0 && pico === 0 },
  }
}

describe('GameScreen', () => {
  describe('guess limit display', () => {
    it('shows remaining guesses when max_guesses is set', () => {
      const wrapper = mount(GameScreen, {
        props: { initialGame: makeGame({ max_guesses: 6, guesses: [] }), labels: defaultLabels },
      })
      expect(wrapper.text()).toContain('6 guesses left')
    })

    it('decrements remaining count based on guesses already made', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({
            max_guesses: 6,
            guesses: [makeGuess(1, '456', 0, 0), makeGuess(2, '789', 0, 0)],
          }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.text()).toContain('4 guesses left')
    })

    it('hides guess count when max_guesses is 0 (easy mode)', () => {
      const wrapper = mount(GameScreen, {
        props: { initialGame: makeGame({ max_guesses: 0 }), labels: defaultLabels },
      })
      expect(wrapper.text()).not.toContain('guesses left')
    })

    it('applies warning class when 2 guesses remain', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({
            max_guesses: 3,
            guesses: [makeGuess(1, '456', 0, 0)],
          }),
          labels: defaultLabels,
        },
      })
      const warning = wrapper.find('.hint--warning')
      expect(warning.exists()).toBe(true)
      expect(warning.text()).toContain('2 guesses left')
    })

    it('applies warning class when 1 guess remains', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({
            max_guesses: 3,
            guesses: [makeGuess(1, '456', 0, 0), makeGuess(2, '789', 0, 0)],
          }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.find('.hint--warning').exists()).toBe(true)
    })

    it('does not apply warning class when more than 2 guesses remain', () => {
      const wrapper = mount(GameScreen, {
        props: { initialGame: makeGame({ max_guesses: 6, guesses: [] }), labels: defaultLabels },
      })
      expect(wrapper.find('.hint--warning').exists()).toBe(false)
    })
  })

  describe('game over states', () => {
    it('shows win card when status is complete', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({
            status: 'complete',
            guesses: [makeGuess(1, '123', 3, 0)],
          }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.text()).toContain('You got it!')
    })

    it('shows lost card when status is lost', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ status: 'lost', revealed_secret: '123' }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.text()).toContain('Out of guesses!')
    })

    it('reveals the secret number when lost', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ status: 'lost', revealed_secret: '456' }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.find('.lose-card__secret').text()).toBe('456')
    })

    it('hides the guess input when game is lost', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ status: 'lost', revealed_secret: '123' }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.find('#guess-input').exists()).toBe(false)
    })

    it('hides the guess input when game is complete', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({
            status: 'complete',
            guesses: [makeGuess(1, '123', 3, 0)],
          }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.find('#guess-input').exists()).toBe(false)
    })
  })

  describe('feedback colors', () => {
    it('renders each Fermi word with feedback-fermi class', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ guesses: [makeGuess(1, '123', 2, 0)] }),
          labels: defaultLabels,
        },
      })
      const spans = wrapper.findAll('.feedback-fermi')
      expect(spans).toHaveLength(2)
      spans.forEach(s => expect(s.text()).toBe('Fermi'))
    })

    it('renders each Pico word with feedback-pico class', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ guesses: [makeGuess(1, '123', 0, 2)] }),
          labels: defaultLabels,
        },
      })
      const spans = wrapper.findAll('.feedback-pico')
      expect(spans).toHaveLength(2)
      spans.forEach(s => expect(s.text()).toBe('Pico'))
    })

    it('renders mixed feedback with correct per-word classes', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ guesses: [makeGuess(1, '123', 1, 1)] }),
          labels: defaultLabels,
        },
      })
      expect(wrapper.findAll('.feedback-fermi')).toHaveLength(1)
      expect(wrapper.findAll('.feedback-pico')).toHaveLength(1)
    })

    it('renders bagel result with feedback-bagel class', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ guesses: [makeGuess(1, '456', 0, 0)] }),
          labels: defaultLabels,
        },
      })
      const bagel = wrapper.find('.feedback-bagel')
      expect(bagel.exists()).toBe(true)
      expect(bagel.text()).toBe('Bagel')
    })

    it('does not apply a single class to the whole feedback string', () => {
      const wrapper = mount(GameScreen, {
        props: {
          initialGame: makeGame({ guesses: [makeGuess(1, '123', 1, 1)] }),
          labels: defaultLabels,
        },
      })
      const feedbackContainer = wrapper.find('.history__feedback')
      expect(feedbackContainer.classes()).not.toContain('feedback-fermi')
      expect(feedbackContainer.classes()).not.toContain('feedback-pico')
    })
  })
})
