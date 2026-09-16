import assert from 'node:assert/strict'
import test from 'node:test'

test('application-level order tools support the documented cross-route retry flow', async () => {
  const descriptors = []
  globalThis.document = {
    createElement: () => ({ style: {}, content: [] }),
    createTextNode: () => ({}),
    modelContext: {
      registerTool(descriptor) {
        descriptors.push(descriptor)
      },
    },
  }

  const route = { value: { path: '/' } }
  const { registerOrderTools, orderFilterStatus, orderSearchText } = await import(
    '../src/business/orders.ts'
  )
  registerOrderTools({ currentRoute: route })

  assert.deepEqual(
    descriptors.map((tool) => tool.name),
    ['order_query', 'order_detail'],
  )

  const detail = descriptors.find((tool) => tool.name === 'order_detail')
  const requirement = await detail.execute({ orderId: 'ORD-5X9A2B' })
  assert.match(requirement.content[0].text, /ROUTE_REQUIRED/)
  assert.match(requirement.content[0].text, /orders-navigation/)

  route.value.path = '/orders'
  const result = await detail.execute({ orderId: 'ORD-5X9A2B' })
  assert.match(result.content[0].text, /订单详情（ORD-5X9A2B）/)
  assert.equal(orderSearchText.value, 'ORD-5X9A2B')
  assert.equal(orderFilterStatus.value, '')
})

test('order_query reuses the page data and synchronizes filters', async () => {
  const descriptors = []
  globalThis.document = {
    createElement: () => ({ style: {}, content: [] }),
    createTextNode: () => ({}),
    modelContext: {
      registerTool(descriptor) {
        descriptors.push(descriptor)
      },
    },
  }

  const moduleUrl = new URL('../src/business/orders.ts?query-contract', import.meta.url)
  const { registerOrderTools, orderFilterStatus, orderSearchText } = await import(moduleUrl.href)
  registerOrderTools({ currentRoute: { value: { path: '/orders' } } })

  const query = descriptors.find((tool) => tool.name === 'order_query')
  const result = await query.execute({ status: 'Pending' })
  assert.match(result.content[0].text, /找到 \d+ 条订单/)
  assert.equal(orderFilterStatus.value, 'Pending')
  assert.equal(orderSearchText.value, '')
})
