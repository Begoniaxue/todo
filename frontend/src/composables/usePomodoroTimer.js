import { ref, computed, onMounted, onUnmounted } from 'vue'

export const TOTAL_TIME = 25 * 60
export const RADIUS = 120
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function usePomodoroTimer({ onComplete } = {}) {
  const timeLeft = ref(TOTAL_TIME)
  const isRunning = ref(false)
  const isPaused = ref(false)

  let timer = null
  let segmentStartTs = 0
  let accumulatedSeconds = 0

  const calcTimeLeft = () => {
    if (!isRunning.value || isPaused.value) {
      return TOTAL_TIME - accumulatedSeconds
    }
    const elapsedInSegment = Math.floor((Date.now() - segmentStartTs) / 1000)
    const totalElapsed = accumulatedSeconds + elapsedInSegment
    return Math.max(0, TOTAL_TIME - totalElapsed)
  }

  const syncTimeLeft = () => {
    const remaining = calcTimeLeft()
    if (remaining !== timeLeft.value) {
      timeLeft.value = remaining
    }
    if (remaining <= 0 && isRunning.value && !isPaused.value) {
      completePomodoro()
    }
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && isRunning.value) {
      syncTimeLeft()
    }
  }

  const formattedTime = computed(() => {
    const mins = Math.floor(timeLeft.value / 60)
    const secs = timeLeft.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  const dashOffset = computed(() => {
    const progress = (TOTAL_TIME - timeLeft.value) / TOTAL_TIME
    return CIRCUMFERENCE * (1 - progress)
  })

  const progress = computed(() => {
    return (TOTAL_TIME - timeLeft.value) / TOTAL_TIME
  })

  const toggleTimer = () => {
    if (isRunning.value && !isPaused.value) {
      const elapsedInSegment = Math.floor((Date.now() - segmentStartTs) / 1000)
      accumulatedSeconds += elapsedInSegment
      isPaused.value = true
      clearInterval(timer)
      timer = null
      syncTimeLeft()
    } else {
      isRunning.value = true
      isPaused.value = false
      segmentStartTs = Date.now()
      syncTimeLeft()
      timer = setInterval(syncTimeLeft, 250)
    }
  }

  const resetTimer = () => {
    clearInterval(timer)
    timer = null
    isRunning.value = false
    isPaused.value = false
    accumulatedSeconds = 0
    segmentStartTs = 0
    timeLeft.value = TOTAL_TIME
  }

  const completePomodoro = () => {
    clearInterval(timer)
    timer = null
    isRunning.value = false
    isPaused.value = false
    accumulatedSeconds = 0
    segmentStartTs = 0
    timeLeft.value = TOTAL_TIME
    if (onComplete) {
      onComplete()
    }
  }

  const startTimer = () => {
    if (isRunning.value) return
    toggleTimer()
  }

  const init = () => {
    document.addEventListener('visibilitychange', handleVisibility)
  }

  const cleanup = () => {
    clearInterval(timer)
    timer = null
    document.removeEventListener('visibilitychange', handleVisibility)
  }

  return {
    timeLeft,
    isRunning,
    isPaused,
    formattedTime,
    dashOffset,
    progress,
    toggleTimer,
    resetTimer,
    startTimer,
    init,
    cleanup,
    calcTimeLeft,
    syncTimeLeft
  }
}
