<template>
  <div
    class="orders-view"
    data-page-tool-id="orders-page"
    data-page-tool-action="query"
    aria-label="订单管理页面"
  >
    <div class="page-header">
      <div class="header-left">
        <h2>订单管理</h2>
        <p class="subtitle">查询和追踪客户订单，支持按状态筛选</p>
      </div>
      <div class="header-right">
        <tiny-select v-model="filterStatus" placeholder="所有状态" clearable style="width: 140px; margin-right: 12px">
          <tiny-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </tiny-select>
        <tiny-input
          v-model="searchText"
          placeholder="搜索订单号或客户名"
          prefix-icon="search"
          clearable
          style="width: 220px"
        />
      </div>
    </div>

    <div
      class="table-container"
      data-page-tool-id="orders-list"
      data-page-tool-action="navigation"
      aria-label="订单列表"
    >
      <tiny-grid :data="filteredOrders" border resizable>
        <tiny-grid-column type="index" width="60" />
        <tiny-grid-column field="id" title="订单号" width="150">
          <template #default="{ row }">
            <span class="order-id">{{ row.id }}</span>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="customerName" title="客户姓名" width="100" />
        <tiny-grid-column field="customerPhone" title="联系电话" width="150" />
        <tiny-grid-column field="productName" title="商品名称" min-width="220" />
        <tiny-grid-column field="quantity" title="数量" width="70" align="center" />
        <tiny-grid-column field="totalAmount" title="订单金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount.toLocaleString() }}</span>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="paymentMethod" title="支付方式" width="110" />
        <tiny-grid-column field="status" title="状态" width="110" align="center">
          <template #default="{ row }">
            <span :class="['status-tag', row.status.toLowerCase()]">
              {{ statusLabelMap[row.status] }}
            </span>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="createdAt" title="下单时间" width="180" />
      </tiny-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { filteredOrders, orderFilterStatus, orderSearchText } from '../../business/orders'

const searchText = orderSearchText
const filterStatus = orderFilterStatus

const statusOptions = [
  { label: '待发货', value: 'Pending' },
  { label: '已发货', value: 'Shipped' },
  { label: '已签收', value: 'Delivered' },
  { label: '已退款', value: 'Refunded' },
  { label: '已取消', value: 'Cancelled' }
]

const statusLabelMap: Record<string, string> = {
  Pending: '待发货',
  Shipped: '已发货',
  Delivered: '已签收',
  Refunded: '已退款',
  Cancelled: '已取消'
}

</script>

<style scoped>
.orders-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  animation: fadeIn 0.4s ease-out;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px;
}
.subtitle {
  color: #86909c;
  font-size: 0.95rem;
  margin: 0;
}
.header-right {
  display: flex;
  align-items: center;
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  flex: 1;
}

.order-id {
  font-family: monospace;
  font-weight: 600;
  color: #3a78ec;
}
.amount {
  font-weight: 600;
  color: #1d2129;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
}
.status-tag.pending {
  background: #e8f3ff;
  color: #165dff;
}
.status-tag.shipped {
  background: #fff7e8;
  color: #ff7d00;
}
.status-tag.delivered {
  background: #e8ffea;
  color: #00b42a;
}
.status-tag.refunded {
  background: #f5f5f5;
  color: #86909c;
}
.status-tag.cancelled {
  background: #ffece8;
  color: #f53f3f;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
