import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import TinyRobotChat from '../src/TinyRobotChat.vue'

async function settle(ms = 300): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, ms))
  await nextTick()
}

function findGenuiSwitch(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('.chat-genui-switch')
}

describe('TinyRobotChat GenUI mount', () => {
  let app: App | undefined
  let host: HTMLDivElement | undefined

  beforeEach(() => {
    vi.stubEnv('VITE_GENUI_URL', '')
    vi.stubEnv('VITE_GENUI_PROMPT_ID', '')
    vi.stubEnv('VITE_GENUI_API_KEY', '')
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
    document.body.innerHTML = ''
    vi.unstubAllEnvs()
    app = undefined
    host = undefined
  })

  function mountChat(): HTMLDivElement {
    const el = document.createElement('div')
    document.body.appendChild(el)
    app = createApp(TinyRobotChat)
    app.mount(el)
    host = el
    return el
  }

  async function openChat(el: HTMLDivElement): Promise<void> {
    const launcher = el.querySelector<HTMLButtonElement>('.chat-add-launcher')
    expect(launcher).not.toBeNull()
    launcher?.click()
    await settle()
  }

  test('mounts a single chat surface without runtime ownership conflict', async () => {
    const el = mountChat()
    await settle()

    expect(el.querySelector('.chat-add-launcher')).not.toBeNull()
    expect(document.querySelectorAll('.chat-add-launcher').length).toBe(1)
  })

  test('opens the chat surface without waiting for the GenUI chunks', async () => {
    const el = mountChat()
    await settle()
    await openChat(el)

    expect(document.querySelectorAll('.chat-add-window').length).toBe(1)
    expect(el.querySelector('.chat-add-launcher')).toBeNull()
  })

  test('GenUI switch lives in the sender footer and is disabled without config', async () => {
    const el = mountChat()
    await settle()
    await openChat(el)

    const genuiSwitch = findGenuiSwitch()
    expect(genuiSwitch).not.toBeNull()
    expect(genuiSwitch?.disabled).toBe(true)
    expect(genuiSwitch?.getAttribute('aria-pressed')).toBe('false')
    expect(genuiSwitch?.getAttribute('aria-label')).toBe('GenUI')
  })

  test('GenUI switch is enabled once both required variables are configured', async () => {
    vi.stubEnv('VITE_GENUI_URL', 'https://genui.invalid/run')
    vi.stubEnv('VITE_GENUI_PROMPT_ID', 'probe')

    const el = mountChat()
    await settle()
    await openChat(el)

    const genuiSwitch = findGenuiSwitch()
    expect(genuiSwitch).not.toBeNull()
    expect(genuiSwitch?.disabled).toBe(false)
    expect(genuiSwitch?.getAttribute('aria-pressed')).toBe('false')
  })
})
