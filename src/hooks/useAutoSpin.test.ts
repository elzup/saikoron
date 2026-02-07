import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSpin } from './useAutoSpin'

describe('useAutoSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with auto-spin disabled', () => {
    const spinFn = vi.fn()
    const { result } = renderHook(() => useAutoSpin(spinFn))

    expect(result.current.isAutoSpin).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
    expect(spinFn).not.toHaveBeenCalled()
  })

  it('triggers immediate spin when toggled on', () => {
    const spinFn = vi.fn()
    const { result } = renderHook(() => useAutoSpin(spinFn))

    act(() => {
      result.current.toggleAutoSpin()
    })

    expect(result.current.isAutoSpin).toBe(true)
    expect(spinFn).toHaveBeenCalledTimes(1)
    expect(result.current.remainingSeconds).toBe(60)
  })

  it('counts down every second', () => {
    const spinFn = vi.fn()
    const { result } = renderHook(() => useAutoSpin(spinFn))

    act(() => {
      result.current.toggleAutoSpin()
    })

    expect(result.current.remainingSeconds).toBe(60)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remainingSeconds).toBe(59)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remainingSeconds).toBe(58)
  })

  it('triggers spin again after 60 seconds', () => {
    const spinFn = vi.fn()
    const { result } = renderHook(() => useAutoSpin(spinFn))

    act(() => {
      result.current.toggleAutoSpin()
    })

    expect(spinFn).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(spinFn).toHaveBeenCalledTimes(2)
    expect(result.current.remainingSeconds).toBe(60)
  })

  it('stops timer when toggled off', () => {
    const spinFn = vi.fn()
    const { result } = renderHook(() => useAutoSpin(spinFn))

    act(() => {
      result.current.toggleAutoSpin()
    })

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    act(() => {
      result.current.toggleAutoSpin()
    })

    expect(result.current.isAutoSpin).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    // Should not have been called again after toggle off
    expect(spinFn).toHaveBeenCalledTimes(1)
  })

  it('resets countdown after each spin cycle', () => {
    const spinFn = vi.fn()
    const { result } = renderHook(() => useAutoSpin(spinFn))

    act(() => {
      result.current.toggleAutoSpin()
    })

    // Advance to just before the 60s mark
    act(() => {
      vi.advanceTimersByTime(59_000)
    })
    expect(result.current.remainingSeconds).toBe(1)

    // Advance past 60s - should reset to 60
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current.remainingSeconds).toBe(60)
    expect(spinFn).toHaveBeenCalledTimes(2)
  })

  it('cleans up timers on unmount', () => {
    const spinFn = vi.fn()
    const { result, unmount } = renderHook(() => useAutoSpin(spinFn))

    act(() => {
      result.current.toggleAutoSpin()
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    // Only the initial spin call
    expect(spinFn).toHaveBeenCalledTimes(1)
  })
})
