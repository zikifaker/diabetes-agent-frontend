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
  },
  date: {
    type: String,
    required: true
  }
})

// 获取单日血糖记录
const dayRecords = computed(() => {
  return props.records
    .filter((r) => r.measured_at.startsWith(props.date))
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
})

const data = computed(() => ({
  labels: dayRecords.value.map(r =>
    new Date(r.measured_at).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  ),
  datasets: [{
    data: dayRecords.value.map(r => r.value),
    borderColor: '#e53e3e',
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    borderWidth: 2,
    tension: 0.3,
    fill: true,
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#e53e3e',
    pointHoverBorderWidth: 2
  }]
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: false 
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#2d3748',
      bodyColor: '#4a5568',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      usePointStyle: true,
      callbacks: {
        label: (context) => `${context.parsed.y.toFixed(1)} mmol/L`,
        title: (context) => context[0].label,
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
      },
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
        },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      },
    },
  },
  elements: {
    line: {
      borderWidth: 2,
      fill: 'start',
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart
        if (!chartArea) return null

        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(229, 62, 62, 0.1)')
        gradient.addColorStop(1, 'rgba(229, 62, 62, 0)')

        return gradient;
      },
    },
    point: {
      radius: 4,
      backgroundColor: '#e53e3e',
      borderColor: 'white',
      borderWidth: 2,
      hoverRadius: 5,
      hoverBorderWidth: 2,
    },
  },
}
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>