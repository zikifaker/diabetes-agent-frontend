<template>
  <div class="metrics-container">
    <div class="metric-card total">
      <div class="metric-value">{{ total }}</div>
      <div class="metric-label">总记录数</div>
      <div class="metric-icon">📊</div>
    </div>

    <div class="metric-card normal">
      <div class="metric-value">{{ normalRate }}<span class="percent">%</span></div>
      <div class="metric-label">正常</div>
      <div class="trend" v-if="normalRate > 0">↑ {{ normalCount }}</div>
    </div>

    <div class="metric-card high">
      <div class="metric-value">{{ highRate }}<span class="percent">%</span></div>
      <div class="metric-label">偏高</div>
      <div class="trend" v-if="highRate > 0">↑ {{ highCount }}</div>
    </div>

    <div class="metric-card low">
      <div class="metric-value">{{ lowRate }}<span class="percent">%</span></div>
      <div class="metric-label">偏低</div>
      <div class="trend" v-if="lowRate > 0">↑ {{ lowCount }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    required: true
  },
  lowThreshold: {
    type: Number,
    required: true
  },
  highThreshold: {
    type: Number,
    required: true
  }
})

const total = computed(() => props.records.length)

const counts = computed(() => {
  let high = 0, low = 0, normal = 0
  const { lowThreshold, highThreshold, records } = props

  records.forEach(record => {
    if (record.value > highThreshold) {
      high++
    } else if (record.value < lowThreshold) {
      low++
    } else {
      normal++
    }
  })

  return { high, low, normal }
})

const highCount = computed(() => counts.value.high)
const lowCount = computed(() => counts.value.low)
const normalCount = computed(() => counts.value.normal)

const normalRate = computed(() =>
  total.value === 0 ? 0 : Math.round(normalCount.value / total.value * 100))
const highRate = computed(() =>
  total.value === 0 ? 0 : Math.round(highCount.value / total.value * 100))
const lowRate = computed(() =>
  total.value === 0 ? 0 : Math.round(lowCount.value / total.value * 100))
</script>

<style scoped>
.metrics-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.metric-card.total {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}

.metric-card.total::before {
  background: #64748b;
}

.metric-card.normal {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.metric-card.normal::before {
  background: #22c55e;
}

.metric-card.high {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.metric-card.high::before {
  background: #f59e0b;
}

.metric-card.low {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.metric-card.low::before {
  background: #ef4444;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.metric-card .percent {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.8;
  margin-left: 2px;
}

.metric-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 500;
}

.trend {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-card.normal .trend {
  color: #16a34a;
}

.metric-card.high .trend {
  color: #d97706;
}

.metric-card.low .trend {
  color: #dc2626;
}

.metric-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 24px;
  opacity: 0.2;
}

@media (max-width: 768px) {
  .metrics-container {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .metrics-container {
    grid-template-columns: 1fr;
  }
}
</style>