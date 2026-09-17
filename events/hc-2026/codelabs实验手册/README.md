---
outline: [1, 3]
---

# OpenTiny Next: 实现自然语言智能操作页面

本手册将通过四步实操，为现有 Vue 3 + Vite 业务应用添加 TinyRobot Chat、GenUI、业务 WebMCP 与 WebSkills，以及 PageTool。

## 环境准备

- 码道 Agent 开发工具。
- 安装 `opentiny-next-app-integration` Skill
  - 安装命令：`npx skills add opentiny/agent-skills --skill opentiny-next-app-integration`
- Node.js 与 pnpm。

本手册使用 [`codelabs-demo` 项目](https://github.com/opentiny/community-resources/tree/main/events/hc-2026/codelabs-demo) 作为示例 Demo。

`codelabs-demo` 是一个基于 OpenTiny Vue 的电商管理后台系统，主要提供：

- 概览大盘，展示销售额、库存量和待处理价保等业务指标；
- 库存、订单和价保管理，支持新增入库、订单搜索与状态筛选、价保申请与审批等

图例：电商管理系统-概览大盘
![电商管理系统-概览大盘](images/电商管理系统-概览大盘.png)
图例：电商管理系统-库存管理
![电商管理系统-库存管理](images/电商管理系统-库存管理.png)

在 Windows、Linux 或 macOS 终端中执行以下命令，获取并启动示例项目：

```bash
npx --yes degit opentiny/community-resources/events/hc-2026/codelabs-demo codelabs-demo
cd codelabs-demo
pnpm install
pnpm dev
```

完成本手册的四步实操后，开发者可以在 `codelabs-demo` 中：

- 打开 TinyRobot 对话框，选择已配置的模型并进行对话；
- 启用 GenUI，让模型返回结构化、可交互的界面；
- 使用自然语言按订单号、客户或状态查询订单，并查看订单详情；
- 让 AI 导航到订单管理页面，完成的页面查询。

## Step 1：添加 TinyRobot Chat

发送如下指令给 Agent

> /opentiny-next-app-integration 为当前项目添加 TinyRobot Chat。

Agent 完成代码接入后，根据项目中的 `.env.example`，在本地 `.env` 中填写准备使用的模型 Key，例如：

```dotenv
VITE_DEEPSEEK_API_KEY=<你的 DeepSeek API Key>
# 或
VITE_ALIYUN_DASHSCOPE_KEY=<你的 Aliyun DashScope API Key>
```

> 如果还没有模型 Key，可以参考 [DeepSeek API Key 获取指引](https://platform.deepseek.com/api_keys) 或 [Aliyun DashScope API Key 获取指引](https://help.aliyun.com/zh/model-studio/get-api-key) 完成申请。

配置完成后，你能看到业务页面中出现 TinyRobot 对话入口。打开对话框后可以选择已配置的模型，发送消息并能接收模型回复。

![Step 1：添加 TinyRobot Chat](images/Step-1-添加-TinyRobot-Chat.png)

## Step 2：集成 GenUI

集成 TinyRobotChat 后发送：

> /opentiny-next-app-integration 在当前 TinyRobot Chat 中集成 GenUI。

Agent 完成后，在本地 `.env` 中填写 GenUI 服务地址和 Prompt ID：

```dotenv
# 下面是 TinyRobot 产品态的 VITE_GENUI_URL 和 VITE_GENUI_PROMPT_ID
VITE_GENUI_URL=https://chat.bytedev.site/api/v1/ai/prompt/chat/completions
VITE_GENUI_PROMPT_ID=f6a112c8ac8160211886e5eeffcfd037
```

完成后你能看到 Sender 底部工具多出了 GenUI 功能按钮。可以发送提示词让AI生成可交互的UI回复。

下图示例的提示词：

```txt
我想定制一个今天运动的清单，请给我一个交互界面：用开关（Switch）让我选择‘是否去健身房’。用单选框（Radio）让我选择‘跑步、游泳、瑜伽’中的一项。用一个滑动条（Slider）让我选择今天预计运动的分钟数（范围 0 到 120 分钟）。
```

![Step 2：集成 GenUI](images/Step-2-集成-GenUI.png)

## Step 3：接入 WebMCP 与 WebSkills 基础设施

发送如下指令给 Agent：

> /opentiny-next-app-integration 为当前项目接入第三步 WebMCP 与 WebSkills 基础设施。

Agent 完成后，会把页面通过 `document.modelContext` 注册的工具连接到 TinyRobot，并加载 `src/skills/**/SKILL.md` 中的业务说明。

基础设施接入完成后，开发者需要补充两部分代码：

1. **注册MCP工具**：在对应 Vue 页面挂载时，通过 `document.modelContext.registerTool()` 注册当前页面提供的能力；页面卸载时使用 `AbortController` 注销，避免模型继续看到已经不可用的工具。
2. **编写业务 Skill**：在 `src/skills/<业务名>/SKILL.md` 中说明这些工具何时使用、如何传参以及怎样处理结果。

### 注册MCP工具

工具名称、参数和执行逻辑由开发者根据真实业务定义。Agent 不根据页面字段、按钮或示例工程自行生成业务工具。

注册工具时需要提供：

- `name`：稳定且唯一的工具名；
- `description`：工具用途、适用条件和限制；
- `inputSchema`：参数名称、类型、必填项和枚举值；
- `execute`：调用现有业务状态或服务，并返回真实结果。

比如 `codelabs-demo` 在 `src/views/orders/index.vue` 中，注册如下两个工具

| 工具           | 输入                           | 作用                             |
| -------------- | ------------------------------ | -------------------------------- |
| `order_query`  | 可选订单号、客户姓名和订单状态 | 查询订单列表，并同步页面筛选条件 |
| `order_detail` | 必填完整订单号                 | 查询详情，并将页面列表定位到该订单 |

> 下面示例代码也可以在 [registerTool.ts](https://github.com/opentiny/community-resources/blob/main/events/hc-2026/codelabs-demo/examples/registerTool.ts) 查看

```ts
import { nextTick, onMounted, onUnmounted } from 'vue'

type OrderQueryInput = {
  orderId?: string
  customerName?: string
  status?: OrderItem['status']
}

const abortController = new AbortController()

onMounted(() => {
  const modelContext = (document as any).modelContext
  if (!modelContext?.registerTool) return

  modelContext.registerTool(
    {
      name: 'order_query',
      description: '查询订单列表，可按订单号、客户姓名或状态筛选；不传参数时返回全部订单。',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: '订单号，如 ORD-5X9A2B',
          },
          customerName: {
            type: 'string',
            description: '客户姓名，支持模糊匹配',
          },
          status: {
            type: 'string',
            enum: ['Pending', 'Shipped', 'Delivered', 'Refunded', 'Cancelled'],
            description: '订单状态',
          },
        },
      },
      execute: async ({ orderId, customerName, status }: OrderQueryInput) => {
        const normalizedOrderId = orderId?.trim().toLowerCase()
        const normalizedCustomerName = customerName?.trim().toLowerCase()

        const result = orderList.value.filter((order) => {
          const matchesOrderId = !normalizedOrderId || order.id.toLowerCase().includes(normalizedOrderId)
          const matchesCustomerName =
            !normalizedCustomerName || order.customerName.toLowerCase().includes(normalizedCustomerName)
          const matchesStatus = !status || order.status === status

          return matchesOrderId && matchesCustomerName && matchesStatus
        })

        filterStatus.value = status ?? ''
        searchText.value = orderId?.trim() || customerName?.trim() || ''

        const text =
          result.length === 0
            ? '未找到符合条件的订单。'
            : `找到 ${result.length} 条订单：\n${result
                .map(
                  (order) =>
                    `- ${order.id}｜${order.customerName}｜${order.productName}｜¥${order.totalAmount.toLocaleString()}｜${statusLabelMap[order.status]}`,
                )
                .join('\n')}`

        return {
          content: [{ type: 'text', text }],
        }
      },
    },
    { signal: abortController.signal },
  )

  modelContext.registerTool(
    {
      name: 'order_detail',
      description: '根据完整订单号查询订单详情，并同步筛选页面订单列表。',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: '完整订单号，如 ORD-5X9A2B',
          },
        },
        required: ['orderId'],
      },
      execute: async ({ orderId }: { orderId: string }) => {
        const normalizedOrderId = orderId.trim().toUpperCase()
        const order = orderList.value.find((item) => item.id.toUpperCase() === normalizedOrderId)

        filterStatus.value = ''
        searchText.value = order?.id ?? orderId.trim()
        await nextTick()

        if (!order) {
          return {
            content: [{ type: 'text', text: `未找到订单号为 ${orderId} 的订单。` }],
          }
        }

        const text = `订单详情（${order.id}）：
- 客户：${order.customerName}
- 联系电话：${order.customerPhone}
- 商品：${order.productName}
- 数量：${order.quantity}
- 单价：¥${order.unitPrice.toLocaleString()}
- 总金额：¥${order.totalAmount.toLocaleString()}
- 支付方式：${order.paymentMethod}
- 状态：${statusLabelMap[order.status]}
- 下单时间：${order.createdAt}${order.shippedAt ? `\n- 发货时间：${order.shippedAt}` : ''}

页面定位：订单列表已筛选到 ${order.id}。`

        return {
          content: [{ type: 'text', text }],
        }
      },
    },
    { signal: abortController.signal },
  )
})

onUnmounted(() => {
  abortController.abort()
})
```

### 编写业务 Skill

可执行工具定义了 AI 能做什么，业务 Skill 则指导 AI 正确使用这些工具。业务 Skill 应说明：

- 哪些用户意图适合使用当前业务能力；
- 当前有哪些可用工具；
- 如何把用户表达转换为工具参数；
- 什么情况下选择哪个工具；
- 如何根据工具的真实返回结果回答用户，以及如何处理参数不足、未找到或执行失败。

比如 `codelabs-demo` 新增 `src/skills/orders/SKILL.md`：

> 下面示例代码也可以在 [webmcp-skill.md](https://github.com/opentiny/community-resources/blob/main/events/hc-2026/codelabs-demo/examples/webmcp-skill.md) 查看

```md
---
name: orders
description: 订单查询技能。当用户需要查询订单列表、订单状态、客户订单或指定订单详情时使用。
---

# 订单查询

你负责协助用户查询订单信息。

## 适用范围

这些工具只在订单管理页面挂载后可用。

如果订单工具当前不可用，提示用户先进入订单管理页面，不要虚构查询结果。

## 可用工具

- `order_query`：查询订单列表，支持按订单号、客户姓名和订单状态筛选。
- `order_detail`：根据完整订单号查询详情，并同步筛选页面订单列表。

## 参数规则

### orderId

订单号格式类似 `ORD-5X9A2B`。

- 用户提供完整订单号并要求查看详情时，调用 `order_detail`。
- 用户只想在列表中搜索订单时，调用 `order_query`。

### customerName

支持按客户姓名模糊查询，使用 `order_query`。

### status

只允许使用以下值：

- `Pending`：待发货
- `Shipped`：已发货
- `Delivered`：已签收
- `Refunded`：已退款
- `Cancelled`：已取消

## 工具选择

1. 查询指定订单详情：调用 `order_detail`。
2. 按客户、状态或多个条件筛选：调用 `order_query`。
3. 用户没有提供足够的必填参数时，先向用户询问。
4. 工具返回未找到时，如实告诉用户，不得补造订单。
5. 最终回答只能使用工具实际返回的信息。
6. `order_detail` 已返回页面筛选结果时，无需使用 PageTool 重复确认；其他未完成任务不受此限制。
```

如果上述示例代码不满足你的业务需求，可以使用 Agent 生成业务代码，可用提示词如下：

```text
/opentiny-next-app-integration 根据以下已确认的业务定义，为 codelabs-demo 补充 Step 3 订单工具和 Skill：

- 在 src/views/orders/index.vue 注册 order_query 和 order_detail。
- order_query 支持按订单号、客户姓名和订单状态查询，并同步页面筛选条件。
- order_detail 根据完整订单号查询订单详情，同步将页面列表筛选到该订单；工具结果只反馈已经完成的详情查询和页面筛选。
- 两个工具复用页面现有的 orderList，不创建模拟数据。
- 工具只在订单管理页面打开期间注册并可调用。
- 在 src/skills/orders/SKILL.md 中说明工具用途、参数规则、选择条件和失败处理；专用工具已返回页面定位结果时，无需使用 PageTool 重复确认，其他未完成任务不受此限制。

实现模板：

- 在 onMounted 中调用 document.modelContext.registerTool({ name, description, inputSchema, execute }, { signal }) 注册工具。
- 两个工具共用一个 AbortController.signal，并在 onUnmounted 中调用 abort() 注销。
- SKILL.md 使用包含 name 和 description 的 YAML frontmatter，并包含“适用范围”“可用工具”“参数规则”和“工具选择”。

只实现上述能力，不新增或推测其他业务工具。完成后检查代码接入，不发送模型消息。
```

### 使用 WebMCP 获取订单数据

- 进入订单管理页面后，Chat 应用中查询订单时，AI 会根据 tools 或 Skill 指令（如果AI使用了Skill的话） 选择 `order_query` 或 `order_detail`。
- AI 回复内容和订单页面会使用同一份业务数据。

进入订单管理页面后，在 Chat 应用中输入以下提示词，验证 AI 调用 `order_detail` 查询真实订单数据：

> 请查询订单 ORD-5X9A2B 的详细信息。

![Step 3：接入 WebMCP 与 WebSkills 基础设施](images/Step-3-接入-WebMCP-与-WebSkills-基础设施.png)

## Step 4：接入 PageTool 页面查询与导航

发送如下指令给 Agent：

> /opentiny-next-app-integration 为当前项目接入 PageTool。

Agent 完成后，会接入项目当前版本提供的 PageTool 和 TinyRobot adapter。

PageTool 接入完成后，开发者需要补充两部分代码：

1. **配置页面访问范围**：在真实业务页面中标记允许 PageTool 查询、定位或导航的元素，并按需排除不允许访问的区域。
2. **编写 PageTool Skill**：在 `src/skills/<业务名>/SKILL.md` 中说明允许处理的用户意图、页面目标、操作流程和安全边界。

补充下面的页面目标时，使用同一份 action/target 声明配置 adapter policy，并与实际交互元素上的 `data-page-tool-*` 保持一致。页面属性提供稳定语义，adapter policy 负责执行前授权，两者不能互相替代。

### 配置页面访问范围

标记可访问元素时，使用 `data-page-tool-*` 属性：

```html
<a href="/hello"
  data-page-tool-id="稳定标识"
  data-page-tool-action="navigation"
  aria-label="名称">
</a>
```

- `data-page-tool-id`：页面目标的稳定且唯一的业务标识；
- `data-page-tool-action`：允许的动作类别，例如 `query` 或 `navigation`；
- `aria-label`：供 PageTool 和辅助技术识别的可访问名称。

比如给 `codelabs-demo` 的订单页面增加以下能力：

| 页面目标            | 允许的动作   | 作用                       |
| ------------------- | ------------ | -------------------------- |
| `orders-page`       | `query`      | 查询订单管理页面结构       |
| `orders-list`       | `navigation` | 滚动定位到订单列表         |
| `orders-navigation` | `navigation` | 从左侧导航进入订单管理页面 |

**给页面元素添加 PageTool 属性**

在 `src/views/orders/index.vue` 中，将：

```html
<div class="orders-view"></div>
```

修改为：

```html
<div
  class="orders-view"
  data-page-tool-id="orders-page"
  data-page-tool-action="query"
  aria-label="订单管理页面"
></div>
```

允许 PageTool 滚动定位到订单列表，将：

```html
<div class="table-container"></div>
```

修改为：

```html
<div
  class="table-container"
  data-page-tool-id="orders-list"
  data-page-tool-action="navigation"
  aria-label="订单列表"
></div>
```

允许 PageTool 点击左侧“订单管理”进入订单页面，在 `src/App.vue` 中将：

```html
<router-link
  to="/orders"
  class="nav-item"
  active-class="active">
</router-link>
```

修改为：

```html
<router-link
  to="/orders"
  class="nav-item"
  active-class="active"
  data-page-tool-id="orders-navigation"
  data-page-tool-action="navigation"
  aria-label="进入订单管理"
></router-link>
```

**配置 PageTool 黑名单**

如果业务页面中不允许 PageTool 查询或操作的区域，可以修改 PageTool 配置。TinyRobot 对话框已经在 PageTool 配置中排除。

具体路径以项目实际代码为准，可以搜索 `registerPageAgentTool` 或 `setPageAgentToolConfig` 定位。找到 `a11yConfig.blacklist` 后，在保留已有配置的基础上追加业务区域选择器，例如：

```ts
registerPageAgentTool({
  // 保留项目已有的其他 PageTool 配置
  a11yConfig: {
    blacklist: [
      '.chat-add-window',
      '.chat-add-launcher',
      '[data-page-tool-exclude="true"]',
      '<不允许访问的业务区域选择器>',
    ],
    // 保留项目已有的 whitelist 和 exposedAttributes
  },
})
```

### 编写 PageTool Skill

PageTool Skill 应说明：

- 哪些用户意图可以使用 PageTool；
- 可以操作哪些页面目标以及允许的动作；
- 什么情况下应优先调用 Step 3 注册的专用业务工具；
- 哪些操作必须禁止。

Skill 中的目标和动作必须与页面代码一致。提交、删除、发布、支付等操作必须使用带权限校验和确认机制的专用工具，不能通过 PageTool 或 Skill 开放。

比如 `codelabs-demo` 项目，在 `src/skills/orders/SKILL.md` 末尾加入：

> 下面示例代码也可以在 [pagetool-skill.md](https://github.com/opentiny/community-resources/blob/main/events/hc-2026/codelabs-demo/examples/pagetool-skill.md) 查看

```md
## PageTool 页面目标

- `orders-page`：订单管理页面；允许动作：`query`。
- `orders-list`：订单列表；允许动作：`navigation`，仅用于滚动定位。
- `orders-navigation`：左侧“订单管理”导航；允许动作：`navigation`，仅用于进入订单页面。

## PageTool 与业务工具边界

- PageTool 只用于上述页面目标的查询、滚动和导航。
- 查询订单数据并在页面中定位订单时，使用 `order_query` 或 `order_detail`，不使用 PageTool 读取订单数据或操作搜索框。
- `order_detail` 已返回页面筛选结果时，无需使用 PageTool 重复确认；其他未完成任务不受此限制。

## PageTool 禁止操作

- 不操作未在“PageTool 页面目标”中声明的元素。
- 不使用 `fill`、`select` 或 `executeJavascript`。
- 不使用 PageTool 提交、删除、发布、支付或执行其他副作用。
```

如果上述示例代码不满足你的业务需求，可以使用 Agent 生成业务代码，可用提示词如下：

```text
/opentiny-next-app-integration 根据以下已确认的页面访问范围，为 codelabs-demo 补充 Step 4 PageTool 业务代码：

- 在 src/views/orders/index.vue 添加 orders-page，允许 query。
- 在订单列表添加 orders-list，允许 navigation，仅用于滚动定位。
- 在 src/App.vue 的“订单管理”导航添加 orders-navigation，允许 navigation。
- 使用同一份 action/target 声明配置 adapter 的 PageTool policy，并与页面上的 data-page-tool-* 保持一致。
- 在 src/skills/orders/SKILL.md 中补充上述页面目标、业务工具边界和禁止操作。
- PageTool 只负责已声明的页面查询和导航；查询订单数据并在页面中定位订单时，使用 order_query 或 order_detail。
- order_detail 已返回页面筛选结果时，无需使用 PageTool 重复确认；其他未完成任务不受此限制。
- 不开放表单填写、脚本执行、提交、删除、发布或支付操作。

只实现上述目标，不新增或推测其他页面目标。
```

### 使用 PageTool 导航页面

- AI 可以根据一条用户消息，通过 `orders-navigation` 进入订单管理页面，查询订单详情并在页面中定位该订单。
- 对单个订单查询，预期最短调用链为：PageTool 观察当前页面 → PageTool 点击订单导航 → `order_detail` 查询并定位 → AI 回复，无需使用 PageTool 重复确认。

在非订单页面打开 Chat 应用并输入以下业务提示词，来验证 AI 自动导航能力：

> 请查询订单 ORD-5X9A2B 的详细信息，并在页面中定位到这条订单。

page-tool 自动导航到订单管理页面
![PageTool 自动导航到订单管理页面](images/PageTool-自动导航到订单管理页面.png)

然后筛选出订单，输出订单详情
![PageTool 定位订单并输出订单详情](images/PageTool-定位订单并输出订单详情.png)
