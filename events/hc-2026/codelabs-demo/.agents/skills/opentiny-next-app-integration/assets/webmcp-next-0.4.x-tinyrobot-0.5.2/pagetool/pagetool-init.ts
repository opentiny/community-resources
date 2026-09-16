import { registerPageAgentTool } from '@opentiny/next-sdk'

export const DEFAULT_PAGETOOL_BLACKLIST = [
  '.chat-add-window',
  '.chat-add-launcher',
  '.tr-sender',
  '.tr-bubble',
  '[data-page-tool-exclude="true"]',
] as const

export interface InitializePageToolOptions {
  blacklist?: readonly string[]
  whitelist?: readonly string[]
  exposedAttributes?: readonly string[]
  enableHighlight?: boolean
}

let initialized = false

/**
 * 应用级注册 page-agent-tool。
 *
 * `registerPageAgentTool` 内部会先调用 `initializeBuiltinWebMCP()` 再注册工具，
 * 因此这里不再重复初始化，只要保证在 `createApp` 与业务页面注册工具之前执行。
 *
 * 0.4.11 未导出 `setNavigator`，无法在本版本接入路由跳转回调；
 * 跨路由场景由业务工具返回路由前置条件后重试。
 */
export function initializePageTool(options: InitializePageToolOptions = {}): void {
  if (initialized) return
  initialized = true

  registerPageAgentTool({
    enableHighlight: options.enableHighlight ?? false,
    removeMaskAfterToolCall: true,
    enableExecuteJavascript: false,
    a11yConfig: {
      blacklist: [...DEFAULT_PAGETOOL_BLACKLIST, ...(options.blacklist ?? [])],
      whitelist: [...(options.whitelist ?? [])],
      exposedAttributes: [
        'data-page-tool-id',
        'data-page-tool-action',
        ...(options.exposedAttributes ?? []),
      ],
    },
  })
}
