# codelabs-demo Agent 快速路径

本项目是固定版本、固定业务合同的 OpenTiny Next 体验 Demo。执行
`opentiny-next-app-integration` 时，先读本文件，再按 skill 工作；不要为每个阶段重新扫描整个仓库。

## 已确认版本矩阵

- Vue 3 + Vite + pnpm。
- TinyRobot CLI 与生成的 runtime 包：`0.5.2-alpha.15`。
- GenUI：`1.3.0`。
- Next SDK：`0.4.11`。
- `@opentiny/vue-theme`：Step 2 作为直接依赖固定为 `3.31.1`。

只有 lockfile 或上述版本变化时才重新调查包 exports、类型和 runtime guard；版本未变化时直接使用 skill 的对应版本化资产。

## 四阶段一次完成

用户要求完整体验时，把四阶段视为一个变更集：一次预检、一次依赖安装、一次源码实现、一次类型检查和一次构建。不要每阶段重复安装、全仓扫描和生产构建。

固定接入点：

- `src/App.vue`：唯一 `TinyRobotChat` 挂载、`orders-navigation`。
- `src/TinyRobotChat.vue`：唯一 runtime；自定义 `responseProvider` 是请求所有者，动态 `toolPlugin` 在每次模型请求前读取当前工具，adapter runtime 只连接 MCP 面板。
- `src/main.ts`：在 `createApp` 前初始化 WebMCP 和应用级 PageTool。
- `src/views/orders/index.vue`：随页面挂载和卸载注册 `order_query` / `order_detail`，并声明 `orders-page` / `orders-list`。
- `src/skills/orders/SKILL.md`：订单业务工具和 PageTool 业务边界。

PageTool 保持应用级注册，订单工具保持页面级注册。PageTool 导航后等待订单工具就绪，下一次模型请求由动态 `toolPlugin` 刷新工具列表，完成同一条消息中的跨路由调用。

## 已确认兼容事实

- `modelProviders` 与自定义 `responseProvider` 互斥；`mcpServers` 与 `mcp` 互斥。
- `registerPageAgentTool()` 已调用 `initializeBuiltinWebMCP()`；显式提前初始化也安全。
- Next SDK `0.4.11` 没有 `setNavigator`；PageTool action 是 `browserState/searchTree/click/scroll/hover/fill/select/executeJavascript/clipboard`。
- Demo 使用指南声明的 action/target 配置 adapter policy，并与实际交互元素上的 `data-page-tool-*` 保持一致。
- GenUI Provider 只在 schema-card renderer 路径异步加载，不能包住 `TrChat`。
- 不读取或打印 `.env` 的值，只维护 `.env.example` 空占位。

## 验证顺序

源码定稿后依次执行，失败时先一次性收集错误再重跑：

1. `pnpm exec vue-tsc --noEmit`
2. `pnpm build`

默认不发送模型消息或请求远程 GenUI。不要复用来源不明的开发端口；若启动服务，只停止本次启动的进程。
