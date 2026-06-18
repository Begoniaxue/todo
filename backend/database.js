const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'pomodoro.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pomodoro_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pomodoro_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
`);

const initTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
if (initTasks.count === 0) {
  const insert = db.prepare('INSERT INTO tasks (name) VALUES (?)');
  insert.run('学习 Vue3 基础知识');
  insert.run('阅读技术文档');
  insert.run('代码重构');
  insert.run('写项目文档');
}

module.exports = db;
