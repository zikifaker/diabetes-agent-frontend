<template>
  <div class="target-card compact">
    <div class="breakdown">
      <div class="item normal">
        <span>正常</span>
        <strong>{{ normalRate }}%</strong>
      </div>
      <div class="item high">
        <span>偏高</span>
        <strong>{{ highRate }}%</strong>
      </div>
      <div class="item low">
        <span>偏低</span>
        <strong>{{ lowRate }}%</strong>
      </div>
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
  low: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  }
})

const normalCount = computed(() =>
  props.records.filter(r => r.value >= props.low && r.value <= props.high).length
)

const highCount = computed(() =>
  props.records.filter(r => r.value > props.high).length
)

const lowCount = computed(() =>
  props.records.filter(r => r.value < props.low).length
)

const total = computed(() => props.records.length || 1)

const normalRate = computed(() =>
  Math.round(normalCount.value / total.value * 100)
)
const highRate = computed(() =>
  Math.round(highCount.value / total.value * 100)
)
const lowRate = computed(() =>
  Math.round(lowCount.value / total.value * 100)
)
</script>

<style scoped>
.target-card.compact {
  padding: 20px;
}

.rate {
  font-size: 30px;
}

.breakdown {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.breakdown .item {
  background: #f7fafc;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  text-align: center;
}

.item.normal {
  color: #2f855a;
}

.item.high {
  color: #c05621;
}

.item.low {
  color: #c53030;
}
</style>
