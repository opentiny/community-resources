---
name: pagetool
description: 受限页面观察与导航技能。在需要查询当前页面结构、进入已声明页面或滚动到已声明区块时使用。
---

# PageTool 页面观察与导航

`page-agent-tool` 是一个 MCP 工具；`browserState`、`searchTree`、`click`、`scroll` 是其 action。
业务工具名、`select_skills` 和 `call_tool` 都不能作为 PageTool action。

1. 交互前先用 `browserState` 观察；按关键词定位可用 `searchTree`。
2. 交互只使用最近一次观察产生的 ref，并同时核对稳定 `data-page-tool-id` 和可访问名称。
3. 页面变化后旧 ref 失效，必须重新观察。
4. Demo 不配置宿主 action/target allowlist；根据 SDK 当前返回的 schema 使用可用 action，不把业务工具名当成 action。
5. 页面上的 `data-page-tool-id` 用于提高目标识别稳定性，不作为执行授权门槛。
6. 订单数据查询优先使用专用订单工具；反馈必须对应真实工具结果，错误不能冒充成功。
