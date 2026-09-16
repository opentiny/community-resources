# OpenTiny Next Demo：Agent 耗时与 Token 优化报告

## 结论

主要成本不是业务代码量，而是四个独立 Agent 轮次重复进行仓库扫描、依赖/API 调查、安装和验证，以及模板与真实版本不一致引起的试错。最有效的方案是：完整体验改为一次请求完成四阶段；项目事实写入 `AGENTS.md`；通用版本兼容修复回写 skill 和版本化资产；昂贵验证只在源码定稿后各执行一次。

## 证据

现有 ZCode trace（`out/codelabs-demo-zcode/zcode-2026-09-16.jsonl`）记录了三个长轮次：

| 轮次 | 墙钟时间 | 模型请求 | 工具调用 | 结果 |
|---|---:|---:|---:|---|
| 1 | 14 分 49 秒 | 46 | 67 | 完成 |
| 2 | 17 分 02 秒 | 63 | 83 | 完成 |
| 3 | 8 分 21 秒 | 36 | 未记录完成值 | 失败 |

trace 中 token 数值已脱敏，无法给出可靠的精确 token 总数；但 145 次模型请求清楚说明上下文与推理被反复支付。另一个已有执行复盘记录：冷挂载测试约 34.1 秒、缓存后约 17.7 秒、构建约 51 秒，并出现浏览器/SSR/happy-dom、teleport 查询作用域、GenUI 顶层 DOM 访问等多轮误判。

本次按快速路径完整实现四阶段的实测：

| 环节 | 实测时间 | 备注 |
|---|---:|---|
| TinyRobot CLI 成功生成 | 9.56 秒 | 此前因 workspace 缺 `packages` 失败 1 次，浪费 2.05 秒 |
| 阶段 2–4 生产依赖合并安装 | 31.32 秒 | 429 个包，网络下载是主要成本 |
| 测试依赖安装 | 6.17 秒 | 可预置进 Demo，降为 0 次新增安装 |
| 最终 `pnpm install` | 1.21 秒 | 应用 override |
| `pnpm typecheck` | 2.29 秒 | 一次通过 |
| 最终 `pnpm test` | 约 6 秒 | 13 个 node 测试 + 4 个挂载测试，全部通过 |
| 最终 `pnpm build` | 9.82 秒 | 5949 modules，通过 |

## 高成本环节与根因

1. **四轮重复上下文**：每一步都重新读项目、skill、包类型与前序产物，模型请求数线性放大。
2. **依赖与版本调查重复**：固定 Demo 实际上只有一套版本矩阵，却让 Agent 每次从 `node_modules` 重新推导。
3. **模板漂移导致返工**：原 PageTool 资产缺 `hover/clipboard`、调用 0.4.11 不存在的 `setNavigator`；原 GenUI renderer 没把 Provider 放到真正的懒加载路径。
4. **验证回路过重**：对每个小修改重复跑 Vitest/构建；teleport 和 happy-dom 环境问题又造成假失败。
5. **文档合同矛盾**：Step 3 示例要求页面级工具，Step 4 又要求单轮跨路由调用；当前 runtime 固定轮次工具快照，必须应用级注册才能成立。
6. **环境型固定失败**：CLI 需要 workspace `packages`，pnpm 在受限环境还会写用户缓存；如果没有预检，每次都会先失败一次。

## 已落地优化

- 新增根目录 `AGENTS.md`：保存版本矩阵、固定文件图、runtime 所有权、订单跨路由注册和验证顺序。
- 更新 `opentiny-next-app-integration` skill：增加完整流程快速执行规则，要求一次预检/安装/实现/验证，并优先命中版本化资产。
- 修复 skill 资产：PageTool 0.4.11 API/action、稳定 target 向上查找、GenUI Provider/renderer 懒加载；安全 policy 保留为生产项目可选能力，Demo 默认不接线。
- 更新本指南：增加一次请求完成四阶段的推荐提示词；保留分步模式用于教学。
- Demo 预置测试和脚本：`pnpm typecheck`、`pnpm test`、`pnpm build` 构成固定验收门。
- 订单工具应用级注册并共享页面状态，消除 Step 3/4 的单轮快照冲突。

## 预期收益

在依赖缓存相近的机器上，Agent 侧昂贵验证由“最多四轮”收敛为一轮；项目/API 调研由每阶段一次收敛为版本变化时一次。模型请求不应再出现几十次级别的重复探索。精确 token 节省需要平台提供未脱敏 usage 后做 A/B 测试，建议用同一模型分别执行“四条独立提示词”和“一条完整提示词”，记录总输入/输出 token、模型请求数、工具调用数、首个可用构建时间和最终成功率。

## 后续建议

- 发布一个与版本矩阵绑定的“完整四阶段”skill 资产或 CLI preset，直接生成最终文件图；这会进一步减少大段代码生成 token。
- 在 CI 中缓存 pnpm store 和 Vitest transform cache，并只在 lockfile/配置变化时失效。
- 为 skill 增加可机器读取的 preflight 输出（版本、exports、guard、入口、dirty 状态），避免模型消费整份 minified bundle。
- trace 系统保留分阶段 token usage；当前 `[Redacted]` 只能用模型请求数作为 token 成本代理。
