import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

if (typeof document === 'undefined') {
  globalThis.document = {
    createElement: () => ({ style: {}, content: [] }),
    createTextNode: () => ({}),
  }
}

function setModelContext(modelContext) {
  globalThis.document.modelContext = modelContext
}

function clearModelContext() {
  delete globalThis.document.modelContext
}

test('the Demo adapter forwards PageTool schema without an action allowlist', async () => {
  setModelContext({
    registerTool() {},
    listTools: async () => [
      {
        name: 'page-agent-tool',
        description: 'Operate the current page',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['browserState', 'searchTree', 'click', 'scroll', 'hover', 'fill', 'select', 'executeJavascript', 'clipboard'],
            },
          },
        },
      },
    ],
    executeTool: async () => ({}),
  })

  const { createWebMcpAdapter } = await import('../src/tiny-robot-chat/webmcp/webmcp-adapter.ts')
  const adapter = createWebMcpAdapter()
  const tools = await adapter.listTools(['browser-webmcp'], {
    'browser-webmcp': ['page-agent-tool'],
  })

  assert.deepEqual(tools[0].inputSchema.properties.action.enum, [
    'browserState',
    'searchTree',
    'click',
    'scroll',
    'hover',
    'fill',
    'select',
    'executeJavascript',
    'clipboard',
  ])
  adapter.dispose()
  clearModelContext()
})

test('click is forwarded even when the ref has no declared target policy', async () => {
  const descriptor = { name: 'page-agent-tool', description: 'Operate the page', inputSchema: {} }
  let execution
  setModelContext({
    registerTool() {},
    listTools: async () => [descriptor],
    executeTool: async (tool, input) => {
      execution = { tool, input }
      return { content: [{ type: 'text', text: 'clicked' }] }
    },
  })

  const { createWebMcpAdapter } = await import('../src/tiny-robot-chat/webmcp/webmcp-adapter.ts')
  const adapter = createWebMcpAdapter()
  const result = await adapter.callTool('browser-webmcp', 'page-agent-tool', {
    action: 'click',
    index: 2,
  })

  assert.deepEqual(execution, {
    tool: descriptor,
    input: JSON.stringify({ action: 'click', index: 2 }),
  })
  assert.equal(result.content[0].text, 'clicked')
  adapter.dispose()
  clearModelContext()
})

test('the order page keeps stable semantic targets as PageTool hints', async () => {
  const [page, app] = await Promise.all([
    readFile(new URL('../src/views/orders/index.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.vue', import.meta.url), 'utf8'),
  ])

  for (const marker of ['orders-page', 'orders-list']) assert.ok(page.includes(marker))
  assert.ok(app.includes('orders-navigation'))
})

test('PageTool initialization excludes chat UI and does not disable SDK actions', async () => {
  const source = await readFile(
    new URL('../src/tiny-robot-chat/pagetool/pagetool-init.ts', import.meta.url),
    'utf8',
  )

  for (const selector of ['.chat-add-window', '.chat-add-launcher', '.tr-sender', '.tr-bubble']) {
    assert.ok(source.includes(selector), `missing excluded selector: ${selector}`)
  }
  assert.ok(source.includes('removeMaskAfterToolCall: true'))
  assert.ok(!source.includes('enableExecuteJavascript: false'))
})

test('the Demo PageTool skill documents unrestricted adapter behavior', async () => {
  const skill = await readFile(new URL('../src/skills/pagetool/SKILL.md', import.meta.url), 'utf8')
  for (const marker of ['page-agent-tool', 'browserState', 'searchTree', 'allowlist', 'SDK']) {
    assert.ok(skill.includes(marker), `missing skill marker: ${marker}`)
  }
})
