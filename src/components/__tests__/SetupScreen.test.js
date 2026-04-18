import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SetupScreen from '../SetupScreen.vue'
import { createGame } from '../../api.js'

vi.mock('../../api.js', () => ({
  createGame: vi.fn(),
}))

const baseGame = {
  id: 'test-id',
  mode: 'player_guesses',
  config: { length: 3, allow_repeats: false },
  difficulty: 'easy',
  status: 'in_progress',
  max_guesses: 0,
  guesses: [],
}

describe('SetupScreen', () => {
  beforeEach(() => {
    vi.mocked(createGame).mockResolvedValue(baseGame)
  })

  describe('difficulty selector', () => {
    it('shows difficulty options in player_guesses mode (default)', () => {
      const wrapper = mount(SetupScreen)
      expect(wrapper.findAll('input[name="difficulty"]')).toHaveLength(3)
    })

    it('shows difficulty options in computer_guesses mode', async () => {
      const wrapper = mount(SetupScreen)
      await wrapper.find('input[name="mode"][value="computer_guesses"]').setValue(true)
      expect(wrapper.findAll('input[name="difficulty"]')).toHaveLength(3)
    })

    it('shows guess-limit sublabels in player_guesses mode', () => {
      const wrapper = mount(SetupScreen)
      const subs = wrapper.findAll('.toggle-option__sub')
      expect(subs).toHaveLength(3)
      expect(subs[0].text()).toBe('unlimited guesses')
      expect(subs[1].text()).toBe('optimal + 50%')
      expect(subs[2].text()).toBe('optimal — no slack')
    })

    it('hides guess-limit sublabels in computer_guesses mode', async () => {
      const wrapper = mount(SetupScreen)
      await wrapper.find('input[name="mode"][value="computer_guesses"]').setValue(true)
      expect(wrapper.findAll('.toggle-option__sub')).toHaveLength(0)
    })

    it('shows "Guess limit" legend in player_guesses mode', () => {
      const wrapper = mount(SetupScreen)
      const legends = wrapper.findAll('legend')
      expect(legends.some(l => l.text() === 'Guess limit')).toBe(true)
    })

    it('shows "Computer difficulty" legend in computer_guesses mode', async () => {
      const wrapper = mount(SetupScreen)
      await wrapper.find('input[name="mode"][value="computer_guesses"]').setValue(true)
      const legends = wrapper.findAll('legend')
      expect(legends.some(l => l.text() === 'Computer difficulty')).toBe(true)
    })
  })

  describe('game creation', () => {
    it('passes selected difficulty when starting a player_guesses game', async () => {
      const wrapper = mount(SetupScreen)
      await wrapper.find('input[name="difficulty"][value="hard"]').setValue(true)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(createGame).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'player_guesses', difficulty: 'hard' }),
      )
    })

    it('passes selected difficulty when starting a computer_guesses game', async () => {
      const wrapper = mount(SetupScreen)
      await wrapper.find('input[name="mode"][value="computer_guesses"]').setValue(true)
      await wrapper.find('input[name="difficulty"][value="medium"]').setValue(true)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(createGame).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'computer_guesses', difficulty: 'medium' }),
      )
    })

    it('emits started with the returned game on success', async () => {
      const wrapper = mount(SetupScreen)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.emitted('started')).toHaveLength(1)
      expect(wrapper.emitted('started')[0][0]).toEqual(baseGame)
    })

    it('shows an error message when createGame fails', async () => {
      vi.mocked(createGame).mockRejectedValueOnce(new Error('Network error'))
      const wrapper = mount(SetupScreen)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.find('[role="alert"]').text()).toContain('Network error')
    })
  })
})
