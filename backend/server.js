const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '任务名称不能为空' });
  }
  const result = db.prepare('INSERT INTO tasks (name) VALUES (?)').run(name.trim());
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM pomodoro_records WHERE task_id = ?').run(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
});

app.post('/api/pomodoro/complete', (req, res) => {
  const { task_id } = req.body;
  if (!task_id) {
    return res.status(400).json({ error: '缺少 task_id' });
  }
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task_id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO pomodoro_records (task_id) VALUES (?)').run(task_id);
    db.prepare('UPDATE tasks SET pomodoro_count = pomodoro_count + 1 WHERE id = ?').run(task_id);
  });
  tx();

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task_id);
  res.json(updatedTask);
});

app.get('/api/pomodoro/records/:task_id', (req, res) => {
  const { task_id } = req.params;
  const records = db.prepare('SELECT * FROM pomodoro_records WHERE task_id = ? ORDER BY completed_at DESC').all(task_id);
  res.json(records);
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
});
