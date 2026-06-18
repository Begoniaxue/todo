import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { usePomodoroTimer, TOTAL_TIME, CIRCUMFERENCE } from '../composables/usePomodoroTimer'

describe('usePomodoroTimer', () => {
  let timer

  beforeEach(() => {
    vi.useFakeTimers()
    timer = usePomodoroTimer()
    timer.init()
  })

  afterEach(() => {
    timer.cleanup()
    vi.useRealTimers()
  })

  describe('初始状态', () => {
    it('初始剩余时间应为 25 分钟（1500 秒）', () => {
      expect(timer.timeLeft.value).toBe(TOTAL_TIME)
    })

    it('初始运行状态应为 false', () => {
      expect(timer.isRunning.value).toBe(false)
    })

    it('初始暂停状态应为 false', () => {
      expect(timer.isPaused.value).toBe(false)
    })

    it('初始格式化时间应为 25:00', () => {
      expect(timer.formattedTime.value).toBe('25:00')
    })

    it('初始进度应为 0', () => {
      expect(timer.progress.value).toBe(0)
    })

    it('初始 dashOffset 应等于 circumference（无进度）', () => {
      expect(timer.dashOffset.value).toBe(CIRCUMFERENCE)
    })
  })

  describe('toggleTimer - 开始', () => {
    it('调用 toggleTimer 后 isRunning 应为 true', () => {
      timer.toggleTimer()
      expect(timer.isRunning.value).toBe(true)
    })

    it('调用 toggleTimer 后 isPaused 应为 false', () => {
      timer.toggleTimer()
      expect(timer.isPaused.value).toBe(false)
    })

    it('开始后时间应随 setInterval 递减', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 1000
      vi.advanceTimersByTime(1000)
      expect(timer.timeLeft.value).toBeLessThan(TOTAL_TIME)

      Date.now = realNow
    })

    it('开始 5 秒后剩余时间应为 1495', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 5000
      vi.advanceTimersByTime(5000)
      expect(timer.timeLeft.value).toBe(TOTAL_TIME - 5)

      Date.now = realNow
    })
  })

  describe('toggleTimer - 暂停', () => {
    it('运行中再次 toggleTimer 应进入暂停状态', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 3000
      vi.advanceTimersByTime(3000)
      timer.toggleTimer()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isPaused.value).toBe(true)

      Date.now = realNow
    })

    it('暂停后时间应不再递减', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 5000
      vi.advanceTimersByTime(5000)
      const pausedTime = timer.timeLeft.value

      timer.toggleTimer()

      Date.now = () => baseTime + 10000
      vi.advanceTimersByTime(5000)
      expect(timer.timeLeft.value).toBe(pausedTime)

      Date.now = realNow
    })
  })

  describe('toggleTimer - 继续', () => {
    it('暂停后再次 toggleTimer 应恢复计时', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 5000
      vi.advanceTimersByTime(5000)
      timer.toggleTimer()

      timer.toggleTimer()

      Date.now = () => baseTime + 10000
      vi.advanceTimersByTime(5000)
      expect(timer.timeLeft.value).toBe(TOTAL_TIME - 10)

      Date.now = realNow
    })

    it('暂停 10 秒（真实时间）后继续，不应有额外时间丢失', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 5000
      vi.advanceTimersByTime(5000)
      timer.toggleTimer()

      Date.now = () => baseTime + 15000
      timer.toggleTimer()

      Date.now = () => baseTime + 20000
      vi.advanceTimersByTime(5000)
      expect(timer.timeLeft.value).toBe(TOTAL_TIME - 10)

      Date.now = realNow
    })
  })

  describe('resetTimer', () => {
    it('重置后所有状态应恢复初始值', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 3000
      vi.advanceTimersByTime(3000)
      timer.resetTimer()

      expect(timer.timeLeft.value).toBe(TOTAL_TIME)
      expect(timer.isRunning.value).toBe(false)
      expect(timer.isPaused.value).toBe(false)

      Date.now = realNow
    })

    it('暂停状态下重置也应恢复正常', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 3000
      vi.advanceTimersByTime(3000)
      timer.toggleTimer()
      timer.resetTimer()

      expect(timer.timeLeft.value).toBe(TOTAL_TIME)
      expect(timer.isRunning.value).toBe(false)
      expect(timer.isPaused.value).toBe(false)

      Date.now = realNow
    })
  })

  describe('calcTimeLeft - 时间戳校准', () => {
    it('基于 Date.now 计算真实流逝时间', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 10000
      expect(timer.calcTimeLeft()).toBe(TOTAL_TIME - 10)

      Date.now = realNow
    })

    it('浏览器后台长时间后切换回来仍能正确计算', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 600000

      const remaining = timer.calcTimeLeft()
      expect(remaining).toBe(TOTAL_TIME - 600)
      expect(remaining).toBe(900)

      Date.now = realNow
    })

    it('暂停期间 calcTimeLeft 返回暂停时的剩余时间', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()
      Date.now = () => baseTime + 5000
      timer.toggleTimer()

      Date.now = () => baseTime + 15000
      expect(timer.calcTimeLeft()).toBe(TOTAL_TIME - 5)

      Date.now = realNow
    })

    it('超过总时长时返回 0', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + (TOTAL_TIME + 100) * 1000
      expect(timer.calcTimeLeft()).toBe(0)

      Date.now = realNow
    })
  })

  describe('completePomodoro - 完成回调', () => {
    it('计时到达零时触发 onComplete 回调', () => {
      const onComplete = vi.fn()
      const t = usePomodoroTimer({ onComplete })
      t.init()

      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      t.toggleTimer()
      Date.now = () => baseTime + TOTAL_TIME * 1000

      t.syncTimeLeft()

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(t.timeLeft.value).toBe(TOTAL_TIME)
      expect(t.isRunning.value).toBe(false)

      Date.now = realNow
      t.cleanup()
    })

    it('完成后状态重置为初始状态', () => {
      const onComplete = vi.fn()
      const t = usePomodoroTimer({ onComplete })
      t.init()

      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      t.toggleTimer()
      Date.now = () => baseTime + TOTAL_TIME * 1000

      t.syncTimeLeft()

      expect(t.isRunning.value).toBe(false)
      expect(t.isPaused.value).toBe(false)
      expect(t.timeLeft.value).toBe(TOTAL_TIME)
      expect(t.formattedTime.value).toBe('25:00')

      Date.now = realNow
      t.cleanup()
    })
  })

  describe('formattedTime', () => {
    it('零秒时显示 00:00', () => {
      timer.timeLeft.value = 0
      expect(timer.formattedTime.value).toBe('00:00')
    })

    it('1 分 30 秒时显示 01:30', () => {
      timer.timeLeft.value = 90
      expect(timer.formattedTime.value).toBe('01:30')
    })

    it('24 分 59 秒时显示 24:59', () => {
      timer.timeLeft.value = 24 * 60 + 59
      expect(timer.formattedTime.value).toBe('24:59')
    })

    it('599 秒时显示 09:59', () => {
      timer.timeLeft.value = 599
      expect(timer.formattedTime.value).toBe('09:59')
    })
  })

  describe('dashOffset 和 progress', () => {
    it('进度过半时 progress > 0.5', () => {
      timer.timeLeft.value = Math.floor(TOTAL_TIME * 0.4)
      expect(timer.progress.value).toBeCloseTo(0.6, 5)
    })

    it('时间为零时 progress 为 1', () => {
      timer.timeLeft.value = 0
      expect(timer.progress.value).toBe(1)
    })

    it('dashOffset 为 0 表示进度满', () => {
      timer.timeLeft.value = 0
      expect(timer.dashOffset.value).toBe(0)
    })

    it('dashOffset 等于 circumference 表示进度为零', () => {
      timer.timeLeft.value = TOTAL_TIME
      expect(timer.dashOffset.value).toBe(CIRCUMFERENCE)
    })
  })

  describe('visibilitychange 事件', () => {
    it('切换到可见时应同步时间', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()

      Date.now = () => baseTime + 30000

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(timer.timeLeft.value).toBe(TOTAL_TIME - 30)

      Date.now = realNow
    })

    it('不在运行时 visibilitychange 不影响时间', () => {
      const beforeTime = timer.timeLeft.value
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
      expect(timer.timeLeft.value).toBe(beforeTime)
    })
  })

  describe('边界情况', () => {
    it('连续调用多次 toggleTimer 不会创建多个 interval', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()
      timer.toggleTimer()
      timer.toggleTimer()

      Date.now = () => baseTime + 3000
      vi.advanceTimersByTime(3000)

      expect(timer.timeLeft.value).toBeLessThanOrEqual(TOTAL_TIME)
      expect(timer.timeLeft.value).toBeGreaterThan(TOTAL_TIME - 10)

      Date.now = realNow
    })

    it('未开始时 resetTimer 不报错', () => {
      expect(() => timer.resetTimer()).not.toThrow()
      expect(timer.timeLeft.value).toBe(TOTAL_TIME)
    })

    it('cleanup 后不再响应 visibilitychange', () => {
      const realNow = Date.now
      const baseTime = Date.now()
      Date.now = () => baseTime

      timer.toggleTimer()
      Date.now = () => baseTime + 30000
      timer.cleanup()

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(timer.timeLeft.value).toBe(TOTAL_TIME)

      Date.now = realNow
      timer.init()
    })
  })
})
