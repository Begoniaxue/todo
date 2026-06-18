const API_BASE = '/api'

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`)
  if (!res.ok) throw new Error('获取任务失败')
  return res.json()
}

export async function createTask(name) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!res.ok) throw new Error('创建任务失败')
  return res.json()
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('删除任务失败')
  return res.json()
}

export async function completePomodoro(taskId) {
  const res = await fetch(`${API_BASE}/pomodoro/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId })
  })
  if (!res.ok) throw new Error('记录番茄钟失败')
  return res.json()
}
