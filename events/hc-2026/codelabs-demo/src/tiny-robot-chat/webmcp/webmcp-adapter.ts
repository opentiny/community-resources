import type {
  ChatMcpRuntime,
  ChatMcpServerInfo,
  ChatMcpToolState,
  UseLocalChatRuntimeMcpAdapter,
} from '@opentiny/tiny-robot-chat'
import { ref } from 'vue'
import type { WebMcpToolDescriptor } from './webmcp-types.ts'
import { executeModelContextTool, getModelContext, listModelContextTools } from './webmcp-types.ts'

export const WEBMCP_SERVER_ID = 'browser-webmcp'

export interface WebMcpAdapter extends UseLocalChatRuntimeMcpAdapter {
  refreshTools(): Promise<void>
  dispose(): void
}

function parseInputSchema(inputSchema: WebMcpToolDescriptor['inputSchema']): Record<string, unknown> {
  if (typeof inputSchema === 'string') {
    try {
      return { type: 'object', properties: {}, ...(JSON.parse(inputSchema) as Record<string, unknown>) }
    } catch {
      return { type: 'object', properties: {} }
    }
  }
  return { type: 'object', properties: {}, ...(inputSchema ?? {}) }
}

/**
 * Demo adapter intentionally performs no action/target authorization.
 * It forwards the current document.modelContext descriptors and lets the
 * installed Next SDK validate its own action schema.
 */
export function createWebMcpAdapter(): WebMcpAdapter {
  const servers = ref<ChatMcpServerInfo[]>([
    {
      id: WEBMCP_SERVER_ID,
      name: 'Browser WebMCP',
      description: 'Tools registered in the current document.modelContext',
      installed: true,
      enabled: true,
    },
  ])
  const tools = ref<ChatMcpToolState>({ [WEBMCP_SERVER_ID]: [] })
  let observedModelContext = getModelContext()

  function assertServerId(serverId: string): void {
    if (serverId !== WEBMCP_SERVER_ID) throw new Error(`Unknown WebMCP server: ${serverId}`)
  }

  async function refreshTools(): Promise<void> {
    const modelContext = getModelContext()
    const previous = new Map((tools.value[WEBMCP_SERVER_ID] ?? []).map((tool) => [tool.id, tool.enabled]))
    const descriptors = modelContext ? await listModelContextTools(modelContext) : []
    tools.value = {
      [WEBMCP_SERVER_ID]: descriptors.map((descriptor) => ({
        id: descriptor.name,
        name: descriptor.title || descriptor.name,
        description: descriptor.description,
        enabled: previous.get(descriptor.name) ?? true,
      })),
    }

    if (modelContext !== observedModelContext) {
      observedModelContext?.removeEventListener?.('toolchange', handleToolChange)
      modelContext?.addEventListener?.('toolchange', handleToolChange)
      observedModelContext = modelContext
    }
  }

  function handleToolChange(): void {
    void refreshTools()
  }

  observedModelContext?.addEventListener?.('toolchange', handleToolChange)

  const runtime: ChatMcpRuntime = {
    servers,
    tools,
    async addServer(serverId) {
      assertServerId(serverId)
      servers.value = [{ ...servers.value[0]!, installed: true, enabled: true, error: undefined }]
      await refreshTools()
    },
    removeServer(serverId) {
      assertServerId(serverId)
      servers.value = [{ ...servers.value[0]!, installed: false, enabled: false }]
    },
    async setServerEnabled(serverId, enabled) {
      assertServerId(serverId)
      servers.value = [{ ...servers.value[0]!, enabled }]
      if (enabled) await refreshTools()
    },
    setToolEnabled(serverId, toolId, enabled) {
      assertServerId(serverId)
      const currentTools = tools.value[WEBMCP_SERVER_ID] ?? []
      if (!currentTools.some((tool) => tool.id === toolId)) throw new Error(`Unknown WebMCP tool: ${toolId}`)
      tools.value = {
        [WEBMCP_SERVER_ID]: currentTools.map((tool) =>
          tool.id === toolId ? { ...tool, enabled } : tool,
        ),
      }
    },
  }

  const adapter: WebMcpAdapter = {
    runtime,
    refreshTools,
    async listTools(serverIds, toolIds) {
      if (!serverIds.includes(WEBMCP_SERVER_ID)) return []
      await refreshTools()
      const modelContext = getModelContext()
      const descriptors = modelContext ? await listModelContextTools(modelContext) : []
      const selectedToolIds = toolIds[WEBMCP_SERVER_ID] ?? []
      return descriptors
        .filter((tool) => selectedToolIds.includes(tool.name))
        .map((tool) => ({
          serverId: WEBMCP_SERVER_ID,
          id: tool.name,
          name: `${WEBMCP_SERVER_ID}__${tool.name}`,
          originalName: tool.name,
          description: tool.description,
          inputSchema: parseInputSchema(tool.inputSchema),
        }))
    },
    async callTool(serverId, toolName, args) {
      assertServerId(serverId)
      const modelContext = getModelContext()
      if (!modelContext) throw new Error('document.modelContext WebMCP API is not available')
      const descriptors = await listModelContextTools(modelContext)
      const descriptor = descriptors.find((tool) => tool.name === toolName)
      if (!descriptor) throw new Error(`WebMCP tool not found: ${toolName}`)
      return executeModelContextTool(modelContext, descriptor, args)
    },
    dispose() {
      observedModelContext?.removeEventListener?.('toolchange', handleToolChange)
      observedModelContext = undefined
    },
  }

  void refreshTools()
  return adapter
}
