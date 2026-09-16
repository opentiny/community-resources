---
name: orders
description: 订单查询及订单页面导航技能。当用户需要查询订单、查看订单详情或定位订单时使用。
---

# 订单查询与页面定位

## 可用工具

- `order_query`：按订单号、客户姓名或状态查询订单列表。
- `order_detail`：按完整订单号查询详情。
- `page-agent-tool`：仅用于下面声明的页面查询和导航。

## 参数与选择规则

- 完整订单号详情使用 `order_detail`；列表、客户或状态筛选使用 `order_query`。
- 状态只允许 `Pending`、`Shipped`、`Delivered`、`Refunded`、`Cancelled`。
- 参数不足时先询问；未找到或执行失败时如实反馈，不补造订单。
- 最终回答只能使用工具真实返回的信息。

## 跨页面流程

订单工具在轮次开始前已注册；若返回 `ROUTE_REQUIRED`，先调用 PageTool 观察页面，点击
`orders-navigation` 进入订单管理，再重试原订单工具。导航后旧 ref 立即失效，继续交互前必须重新观察。

## PageTool 页面目标

- `orders-page`：订单管理页面；允许只读查询。
- `orders-list`：订单列表；允许 `scroll`，仅用于滚动定位。
- `orders-navigation`：左侧订单管理导航；允许 `click`，仅用于进入订单页面。

## Demo 执行约定

- 查询订单数据和更新筛选条件使用 `order_query` 或 `order_detail`，不使用 PageTool 读取表格数据或填写搜索框。
- 页面目标是推荐的稳定定位方式，不是 runtime allowlist；若目标 ref 变化，重新观察后按 SDK schema 重试。
- 订单数据仍优先使用专用工具，避免从页面文本反推业务结果。
