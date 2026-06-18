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
            @click="handleStart"
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
import { usePomodoroTimer, TOTAL_TIME, CIRCUMFERENCE, RADIUS } from './composables/usePomodoroTimer.js'
import * as api from './services/api.js'

const {
  timeLeft,
  isRunning,
  isPaused,
  formattedTime,
  dashOffset,
  toggleTimer,
  resetTimer,
  init: initTimer,
  cleanup: cleanupTimer
} = usePomodoroTimer({
  onComplete: handlePomodoroComplete
})

const radius = RADIUS
const circumference = CIRCUMFERENCE

const tasks = ref([])
const selectedTaskId = ref('')
const newTaskName = ref('')
const showModal = ref(false)
const completedTaskName = ref('')

const currentTaskName = computed(() => {
  if (!selectedTaskId.value) return ''
  const task = tasks.value.find(t => t.id === Number(selectedTaskId.value))
  return task ? task.name : ''
})

const loadTasks = async () => {
  try {
    tasks.value = await api.fetchTasks()
  } catch (e) {
    console.error('获取任务失败:', e)
  }
}

const addTask = async () => {
  if (!newTaskName.value.trim()) return
  try {
    await api.createTask(newTaskName.value.trim())
    newTaskName.value = ''
    await loadTasks()
  } catch (e) {
    console.error('添加任务失败:', e)
  }
}

const deleteTask = async (id) => {
  if (!confirm('确定要删除这个任务吗？')) return
  try {
    await api.deleteTask(id)
    if (selectedTaskId.value === String(id)) {
      selectedTaskId.value = ''
    }
    await loadTasks()
  } catch (e) {
    console.error('删除任务失败:', e)
  }
}

const handleStart = () => {
  if (!selectedTaskId.value) return
  toggleTimer()
}

async function handlePomodoroComplete() {
  const taskId = Number(selectedTaskId.value)
  const task = tasks.value.find(t => t.id === taskId)
  completedTaskName.value = task ? task.name : ''

  try {
    await api.completePomodoro(taskId)
    await loadTasks()
  } catch (e) {
    console.error('记录番茄钟失败:', e)
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

onMounted(() => {
  loadTasks()
  initTimer()
})

onUnmounted(() => {
  cleanupTimer()
})
</script>
