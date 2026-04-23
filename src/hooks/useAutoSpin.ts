import { useCallback, useEffect, useRef, useState } from 'react'

const AUTO_SPIN_INTERVAL_MS = 60_000
const COUNTDOWN_INTERVAL_MS = 1_000

interface UseAutoSpinResult {
  isAutoSpin: boolean
  toggleAutoSpin: () => void
  remainingSeconds: number
}

export function useAutoSpin(spinFn: () => void): UseAutoSpinResult {
  const [isAutoSpin, setIsAutoSpin] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const spinFnRef = useRef(spinFn)
  spinFnRef.current = spinFn

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isAutoSpin) {
      clearTimer()
      setRemainingSeconds(0)
      return
    }

    // Immediate first spin
    spinFnRef.current()

    let remaining = AUTO_SPIN_INTERVAL_MS / COUNTDOWN_INTERVAL_MS
    setRemainingSeconds(remaining)

    intervalRef.current = window.setInterval(() => {
      remaining--
      if (remaining <= 0) {
        spinFnRef.current()
        remaining = AUTO_SPIN_INTERVAL_MS / COUNTDOWN_INTERVAL_MS
      }
      setRemainingSeconds(remaining)
    }, COUNTDOWN_INTERVAL_MS)

    return clearTimer
  }, [isAutoSpin, clearTimer])

  const toggleAutoSpin = useCallback(() => {
    setIsAutoSpin((prev) => !prev)
  }, [])

  return { isAutoSpin, toggleAutoSpin, remainingSeconds }
}
