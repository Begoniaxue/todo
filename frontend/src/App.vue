<template>
  <div>
    <h1 class="app-title">🍅 番茄钟 · 专注管理</h1>
    
    <div class="main-container">
      <div class="card">
        <h2 class="card-title">计时器</h2>
        
        <select 
          v-model="selectedTaskId" 
          class="task-select"
          :disabled="isRunning || isPaused"
        >
          <option value="">请选择要专注的任务...</option>
          <option v-for="task in tasks" :key="task.id" :value="task.id">
            {{ task.name }}（已完成 {{ task.pomodoro_count }} 个番茄）
          </option>
        </select>

        <div class="timer-wrapper">
          <div class="circular-progress">
            <svg width="280" height="280" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#667eea" />
                  <stop offset="100%" stop-color="#764ba2" />
                </linearGradient>
              </defs>
              <circle
                class="progress-bg"
                cx="140"
                cy="140"
                :r="radius"
              />
              <circle
                class="progress-bar"
                cx="140"
                cy="140"
                :r="radius"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
              />
            </svg>
            <div class="time-display">
              <div class="time-text">{{ formattedTime }}</div>
              <div class="time-label">{{ currentTaskName || '未选择任务' }}</div>
            </div>
          </div>
        </div>

        <div class="controls">
          <button 
            class="btn btn-primary" 
            @click="toggleTimer"
            :disabled="!selectedTaskId"
          >
            {{ isRunning && !isPaused ? '⏸ 暂停' : (isPaused ? '▶ 继续' : '▶ 开始') }}
          </button>
          <button 
            class="btn btn-secondary" 
            @click="resetTimer"
            :disabled="timeLeft === TOTAL_TIME && !isRunning"
          >
            ↻ 重置
          </button>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">任务列表</h2>
        
        <div class="add-task">
          <input 
            v-model="newTaskName" 
            type="text" 
            placeholder="输入新任务名称..."
            @keyup.enter="addTask"
          />
          <button @click="addTask" :disabled="!newTaskName.trim()">添加</button>
        </div>

        <ul class="task-list" v-if="tasks.length > 0">
          <li v-for="task in tasks" :key="task.id" class="task-item">
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="pomodoro-badge">🍅 {{ task.pomodoro_count }}</span>
              <button 
                class="btn btn-danger" 
                @click="deleteTask(task.id)"
                :disabled="isRunning"
              >
                删除
              </button>
            </div>
          </li>
        </ul>

        <div v-else class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>暂无任务，添加一个开始专注吧！</p>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-icon">🎉</div>
        <h3 class="modal-title">太棒了！</h3>
        <p class="modal-desc">
          你完成了一个番茄钟！<br />
          任务「<strong>{{ completedTaskName }}</strong>」已记录一次专注。
        </p>
        <button class="modal-btn" @click="closeModal">好的，继续加油！</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const TOTAL_TIME = 25 * 60
const radius = 120
const circumference = 2 * Math.PI * radius

const tasks = ref([])
const selectedTaskId = ref('')
const newTaskName = ref('')
const timeLeft = ref(TOTAL_TIME)
const isRunning = ref(false)
const isPaused = ref(false)
const showModal = ref(false)
const completedTaskName = ref('')

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
  return circumference * (1 - progress)
})

const currentTaskName = computed(() => {
  if (!selectedTaskId.value) return ''
  const task = tasks.value.find(t => t.id === Number(selectedTaskId.value))
  return task ? task.name : ''
})

const fetchTasks = async () => {
  try {
    const res = await fetch('/api/tasks')
    tasks.value = await res.json()
  } catch (e) {
    console.error('获取任务失败:', e)
  }
}

const addTask = async () => {
  if (!newTaskName.value.trim()) return
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTaskName.value.trim() })
    })
    if (res.ok) {
      newTaskName.value = ''
      await fetchTasks()
    }
  } catch (e) {
    console.error('添加任务失败:', e)
  }
}

const deleteTask = async (id) => {
  if (!confirm('确定要删除这个任务吗？')) return
  try {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (selectedTaskId.value === String(id)) {
      selectedTaskId.value = ''
    }
    await fetchTasks()
  } catch (e) {
    console.error('删除任务失败:', e)
  }
}

const toggleTimer = () => {
  if (!selectedTaskId.value) return
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

const completePomodoro = async () => {
  clearInterval(timer)
  timer = null
  isRunning.value = false
  isPaused.value = false
  accumulatedSeconds = 0
  segmentStartTs = 0

  const taskId = Number(selectedTaskId.value)
  const task = tasks.value.find(t => t.id === taskId)
  completedTaskName.value = task ? task.name : ''

  try {
    await fetch('/api/pomodoro/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId })
    })
    await fetchTasks()
  } catch (e) {
    console.error('记录番茄钟失败:', e)
  }

  showModal.value = true
  timeLeft.value = TOTAL_TIME
}

const closeModal = () => {
  showModal.value = false
}



onMounted(() => {
  fetchTasks()
  document.addEventListener('visibilitychange', handleVisibility)
})

onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>
