// 格式化日期 YYYY-MM-DD
export function formatLocalDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化日期时间 YYYY-MM-DD HH:mm
export function formatLocalDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}