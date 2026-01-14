<template>
  <div class="chart-wrapper">
    <Line :data="data" :options="options" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip } from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip)

const props = defineProps({
  records: {
    type: Array,
    required: true
  }
})

// 计算每日平均血糖值，以日期分组返回结果
const grouped = computed(() => {
  const map = {}
  props.records.forEach(r => {
    const d = r.measured_at.slice(0, 10)
    map[d] ||= []
    map[d].push(r.value)
  })
  return Object.entries(map).map(([date, values]) => ({
    date,
    avg: values.reduce((a, b) => a + b, 0) / values.length
  }))
})

const data = computed(() => ({
  labels: grouped.value.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`
  }),
  datasets: [{
    data: grouped.value.map(item => item.avg),
    borderColor: '#3182ce',
    backgroundColor: 'rgba(49, 130, 206, 0.1)',
    tension: 0.3,
    fill: true,
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#3182ce',
    pointHoverBorderWidth: 2
  }]
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#2d3748',
      bodyColor: '#4a5568',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      usePointStyle: true,
      callbacks: {
        label: (context) => {
          return `${context.parsed.y.toFixed(1)} mmol/L`
        },
        title: (context) => {
          return context[0].label
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      grid: {
        color: '#f1f5f9',
        drawBorder: false
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 12
        }
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 12
        }
      }
    }
  },
  elements: {
    line: {
      borderWidth: 2,
      fill: 'start',
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return null

        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(49, 130, 206, 0.1)')
        gradient.addColorStop(1, 'rgba(49, 130, 206, 0)')

        return gradient
      }
    },
    point: {
      radius: 4,
      backgroundColor: '#3182ce',
      borderColor: 'white',
      borderWidth: 2,
      hoverRadius: 5,
      hoverBorderWidth: 2
    }
  }
}
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
