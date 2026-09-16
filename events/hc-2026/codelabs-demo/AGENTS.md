# codelabs-demo Agent 快速路径

本项目是固定版本、固定业务合同的 OpenTiny Next 体验 Demo。执行
`opentiny-next-app-integration` 时，先读本文件，再按 skill 工作；不要为每个阶段重新扫描整个仓库。

## 已确认版本矩阵

- Vue 3 + Vite + pnpm。
- TinyRobot CLI：`@opentiny/tiny-robot-cli@0.5.2-alpha.12`；生成的 runtime 包：`0.5.2-alpha.10`。
- GenUI：`1.3.0`。
- Next SDK：`0.4.11`。
- `@opentiny/vue-theme`：通过 `pnpm-workspace.yaml` 固定为 `3.31.1`。

只有 lockfile 或上述版本变化时才重新调查包 exports、类型和 runtime guard；版本未变化时直接使用 skill 的对应版本化资产。

`OPENTINY_INTEGRATION_FASTPATH.md` 是既有历史复盘，其中阶段 4 的库存目标不是当前指南合同；当前业务事实以本文件、`docs/opentiny-next-guide.md` 和订单源码为准。

## 四阶段一次完成

用户要求完整体验时，把四阶段视为一个变更集：一次预检、一次依赖安装、一次源码实现、一次测试、一次类型检查、一次构建。不要每阶段重复安装、全仓扫描和生产构建。

固定接入点：

- `src/App.vue`：唯一 `TinyRobotChat` 挂载、`orders-navigation`。
- `src/TinyRobotChat.vue`：唯一 runtime；自定义 `responseProvider` 与 `mcp` 分别是请求和 MCP 的唯一所有者；Demo 不传 PageTool policy。
- `src/main.ts`：在 `createApp` 前初始化 WebMCP、PageTool 和应用级订单工具。
- `src/business/orders.ts`：`order_query` / `order_detail` 与页面共享筛选状态。
- `src/views/orders/index.vue`：`orders-page` / `orders-list` 声明。
- `src/skills/orders/SKILL.md`、`src/skills/pagetool/SKILL.md`：业务和通用 PageTool 说明。

订单工具必须应用级注册：当前 TinyRobot 在用户轮次开始时固定工具快照；页面级注册无法完成“一条消息先导航再查询”。非 `/orders` 路由时返回 `ROUTE_REQUIRED`，导航后重试原工具。

## 已确认兼容事实

- `modelProviders` 与自定义 `responseProvider` 互斥；`mcpServers` 与 `mcp` 互斥。
- `registerPageAgentTool()` 已调用 `initializeBuiltinWebMCP()`；显式提前初始化也安全。
- Next SDK `0.4.11` 没有 `setNavigator`；PageTool action 是 `browserState/searchTree/click/scroll/hover/fill/select/executeJavascript/clipboard`。
- Demo 以顺畅体验为优先，不配置 action/target allowlist；`data-page-tool-*` 只提供稳定语义。生产项目需要安全边界时再显式传入 policy。
- GenUI Provider 只在 schema-card renderer 路径异步加载，不能包住 `TrChat`。
- 挂载断言查询 `document`，因为浮动聊天会 teleport 到 `body`；happy-dom 由 `tests/setup.ts` 预置 script 节点。
- 不读取或打印 `.env` 的值，只维护 `.env.example` 空占位。

## 验证顺序

源码定稿后依次执行，失败时先一次性收集错误再重跑：

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build`

默认不发送模型消息或请求远程 GenUI。不要复用来源不明的开发端口；若启动服务，只停止本次启动的进程。
