# 🍅 番茄钟 · 专注管理系统

基于 Vue3 + Express + SQLite 的番茄钟与任务绑定应用。

## 功能特性

- ⏱️ **25 分钟倒计时器**：支持开始、暂停、重置操作
- 🔵 **圆形进度条**：直观展示剩余时间
- 📋 **任务绑定**：下拉选择要绑定的待办任务
- 🎉 **完成弹窗**：计时结束后弹窗提示
- 📊 **自动记录**：自动记录该任务完成一次番茄钟
- 🍅 **专注统计**：任务列表显示累计专注次数
- 🔒 **任务锁定**：计时期间禁止切换任务

## 技术栈

- **前端**：Vue 3 + Vite
- **后端**：Express.js
- **数据库**：SQLite (better-sqlite3)

## 项目结构

```
todo2/
├── backend/           # 后端服务
│   ├── package.json
│   ├── server.js      # Express API 服务
│   └── database.js    # SQLite 数据库初始化
├── frontend/          # 前端应用
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue    # 主组件
│       └── style.css
└── README.md
```

## 快速开始

### 1. 安装后端依赖并启动

```bash
cd backend
npm install
npm start
```
后端服务运行在 http://localhost:3001

### 2. 安装前端依赖并启动

```bash
cd frontend
npm install
npm run dev
```
前端应用运行在 http://localhost:5173

### 3. 访问应用

打开浏览器访问 http://localhost:5173 即可使用番茄钟应用。

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tasks | 获取所有任务列表 |
| POST | /api/tasks | 创建新任务 |
| DELETE | /api/tasks/:id | 删除指定任务 |
| POST | /api/pomodoro/complete | 记录完成一次番茄钟 |
| GET | /api/pomodoro/records/:task_id | 获取某任务的番茄记录 |

## 数据库表结构

### tasks 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 任务名称 |
| pomodoro_count | INTEGER | 累计番茄钟数，默认 0 |
| created_at | DATETIME | 创建时间 |

### pomodoro_records 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| task_id | INTEGER | 关联任务 ID（外键） |
| completed_at | DATETIME | 完成时间 |
