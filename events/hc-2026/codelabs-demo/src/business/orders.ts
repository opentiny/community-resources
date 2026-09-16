import type { Router } from 'vue-router'
import { computed, ref } from 'vue'
import { orderList, type OrderItem } from '../mock/index.ts'
import { getModelContext } from '../tiny-robot-chat/webmcp/webmcp-types.ts'

export const orderSearchText = ref('')
export const orderFilterStatus = ref<OrderItem['status'] | ''>('')

export const filteredOrders = computed(() => {
  const searchLower = orderSearchText.value.toLowerCase()
  return orderList.value.filter((order) => {
    const matchesStatus = !orderFilterStatus.value || order.status === orderFilterStatus.value
    const matchesSearch =
      !orderSearchText.value ||
      order.id.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower)
    return matchesStatus && matchesSearch
  })
})

type OrderQueryInput = {
  orderId?: string
  customerName?: string
  status?: OrderItem['status']
}

const statusLabelMap: Record<OrderItem['status'], string> = {
  Pending: '待发货',
  Shipped: '已发货',
  Delivered: '已签收',
  Refunded: '已退款',
  Cancelled: '已取消',
}

function routeRequirement(router: Router) {
  if (router.currentRoute.value.path === '/orders') return undefined
  return {
    content: [
      {
        type: 'text',
        text: 'ROUTE_REQUIRED：请先使用 PageTool 点击 orders-navigation 进入 /orders，然后重试当前订单工具。',
      },
    ],
  }
}

let registered = false

export function registerOrderTools(router: Router): void {
  if (registered) return
  const modelContext = getModelContext()
  if (!modelContext?.registerTool) return
  registered = true

  modelContext.registerTool({
    name: 'order_query',
    description: '查询订单列表，可按订单号、客户姓名或状态筛选；不传参数时返回全部订单。',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: '订单号，如 ORD-5X9A2B' },
        customerName: { type: 'string', description: '客户姓名，支持模糊匹配' },
        status: {
          type: 'string',
          enum: ['Pending', 'Shipped', 'Delivered', 'Refunded', 'Cancelled'],
          description: '订单状态',
        },
      },
    },
    execute: async (input) => {
      const requirement = routeRequirement(router)
      if (requirement) return requirement
      const { orderId, customerName, status } = (input ?? {}) as OrderQueryInput
      const normalizedOrderId = orderId?.trim().toLowerCase()
      const normalizedCustomerName = customerName?.trim().toLowerCase()
      const result = orderList.value.filter((order) => {
        const matchesOrderId = !normalizedOrderId || order.id.toLowerCase().includes(normalizedOrderId)
        const matchesCustomer =
          !normalizedCustomerName || order.customerName.toLowerCase().includes(normalizedCustomerName)
        return matchesOrderId && matchesCustomer && (!status || order.status === status)
      })

      orderFilterStatus.value = status ?? ''
      orderSearchText.value = orderId?.trim() || customerName?.trim() || ''
      const text =
        result.length === 0
          ? '未找到符合条件的订单。'
          : `找到 ${result.length} 条订单：\n${result
              .map(
                (order) =>
                  `- ${order.id}｜${order.customerName}｜${order.productName}｜¥${order.totalAmount.toLocaleString()}｜${statusLabelMap[order.status]}`,
              )
              .join('\n')}`
      return { content: [{ type: 'text', text }] }
    },
  })

  modelContext.registerTool({
    name: 'order_detail',
    description: '根据完整订单号查询订单详情，包括客户、商品、金额、支付方式、状态和时间。',
    inputSchema: {
      type: 'object',
      properties: { orderId: { type: 'string', description: '完整订单号，如 ORD-5X9A2B' } },
      required: ['orderId'],
    },
    execute: async (input) => {
      const requirement = routeRequirement(router)
      if (requirement) return requirement
      const orderId = ((input ?? {}) as { orderId?: string }).orderId?.trim() ?? ''
      const order = orderList.value.find((item) => item.id.toUpperCase() === orderId.toUpperCase())
      orderFilterStatus.value = ''
      orderSearchText.value = order?.id ?? orderId
      if (!order) return { content: [{ type: 'text', text: `未找到订单号为 ${orderId} 的订单。` }] }

      return {
        content: [
          {
            type: 'text',
            text: `订单详情（${order.id}）：
- 客户：${order.customerName}
- 联系电话：${order.customerPhone}
- 商品：${order.productName}
- 数量：${order.quantity}
- 单价：¥${order.unitPrice.toLocaleString()}
- 总金额：¥${order.totalAmount.toLocaleString()}
- 支付方式：${order.paymentMethod}
- 状态：${statusLabelMap[order.status]}
- 下单时间：${order.createdAt}${order.shippedAt ? `\n- 发货时间：${order.shippedAt}` : ''}`,
          },
        ],
      }
    },
  })
}
