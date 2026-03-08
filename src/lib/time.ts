export function formatRelativeTime(timestamp: number, now: number): string {
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 5) return 'たった今'
  if (seconds < 60) return `${seconds}秒前`
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`

  const date = new Date(timestamp)
  const today = new Date(now)

  if (days === 1) {
    return `昨日 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  if (days < 7) {
    return `${days}日前 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
