import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('../services/api.js', () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  completePomodoro: vi.fn()
}))

import * as api from '../services/api.js'

const mockTasks = [
  { id: 1, name: '学习 Vue3', pomodoro_count: 2 },
  { id: 2, name: '阅读文档', pomodoro_count: 0 },
  { id: 3, name: '代码重构', pomodoro_count: 5 }
]

function mountApp() {
  return mount(App, {
    global: {
      stubs: {
        transition: true
      }
    }
  })
}

describe('App.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    api.fetchTasks.mockResolvedValue([...mockTasks])
    api.createTask.mockResolvedValue({ id: 4, name: '新任务', pomodoro_count: 0 })
    api.deleteTask.mockResolvedValue({ message: '删除成功' })
    api.completePomodoro.mockResolvedValue({ id: 1, name: '学习 Vue3', pomodoro_count: 3 })
    globalThis.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('页面渲染', () => {
    it('挂载后应显示标题', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      expect(wrapper.find('.app-title').text()).toContain('番茄钟')
    })

    it('挂载后应加载并显示任务列表', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      expect(api.fetchTasks).toHaveBeenCalled()
      const items = wrapper.findAll('.task-item')
      expect(items.length).toBe(3)
    })

    it('任务列表应显示任务名和番茄计数', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const items = wrapper.findAll('.task-item')
      expect(items[0].text()).toContain('学习 Vue3')
      expect(items[0].text()).toContain('🍅 2')
      expect(items[2].text()).toContain('🍅 5')
    })

    it('无任务时显示空状态', async () => {
      api.fetchTasks.mockResolvedValue([])
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('暂无任务')
    })

    it('下拉框应包含任务选项', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const options = wrapper.findAll('.task-select option')
      expect(options.length).toBe(4)
      expect(options[1].text()).toContain('学习 Vue3')
    })

    it('初始时进度条显示 25:00', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      expect(wrapper.find('.time-text').text()).toBe('25:00')
    })
  })

  describe('任务选择与计时器锁定', () => {
    it('未选择任务时开始按钮应被禁用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const startBtn = wrapper.find('.btn-primary')
      expect(startBtn.attributes('disabled')).toBeDefined()
    })

    it('选择任务后开始按钮应可用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      const startBtn = wrapper.find('.btn-primary')
      expect(startBtn.attributes('disabled')).toBeUndefined()
    })

    it('计时期间任务下拉框应被禁用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      const select = wrapper.find('.task-select')
      expect(select.attributes('disabled')).toBeDefined()
    })

    it('暂停期间任务下拉框也应被禁用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      vi.advanceTimersByTime(2000)
      await wrapper.find('.btn-primary').trigger('click')
      const select = wrapper.find('.task-select')
      expect(select.attributes('disabled')).toBeDefined()
    })

    it('计时期间删除按钮应被禁用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      const dangerBtns = wrapper.findAll('.btn-danger')
      dangerBtns.forEach(btn => {
        expect(btn.attributes('disabled')).toBeDefined()
      })
    })

    it('未运行时重置按钮应被禁用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const resetBtn = wrapper.find('.btn-secondary')
      expect(resetBtn.attributes('disabled')).toBeDefined()
    })

    it('计时开始后重置按钮应可用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      vi.advanceTimersByTime(1000)
      const resetBtn = wrapper.find('.btn-secondary')
      expect(resetBtn.attributes('disabled')).toBeUndefined()
    })
  })

  describe('计时器控制', () => {
    it('点击开始后按钮文字变为「暂停」', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      expect(wrapper.find('.btn-primary').text()).toContain('暂停')
    })

    it('点击暂停后按钮文字变为「继续」', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      vi.advanceTimersByTime(2000)
      await wrapper.find('.btn-primary').trigger('click')
      expect(wrapper.find('.btn-primary').text()).toContain('继续')
    })

    it('重置后时间恢复 25:00', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      await wrapper.find('.btn-primary').trigger('click')
      vi.advanceTimersByTime(5000)
      await wrapper.find('.btn-secondary').trigger('click')
      expect(wrapper.find('.time-text').text()).toBe('25:00')
    })

    it('选择任务后标签显示任务名', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.task-select').setValue('1')
      expect(wrapper.find('.time-label').text()).toBe('学习 Vue3')
    })
  })

  describe('添加任务', () => {
    it('输入任务名并点击添加应调用 API', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.add-task input').setValue('写单元测试')
      await wrapper.find('.add-task button').trigger('click')
      await vi.runAllTimersAsync()
      expect(api.createTask).toHaveBeenCalledWith('写单元测试')
    })

    it('添加后应刷新任务列表', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const initialCallCount = api.fetchTasks.mock.calls.length
      await wrapper.find('.add-task input').setValue('写单元测试')
      await wrapper.find('.add-task button').trigger('click')
      await vi.runAllTimersAsync()
      expect(api.fetchTasks.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it('输入为空时添加按钮应被禁用', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const addBtn = wrapper.find('.add-task button')
      expect(addBtn.attributes('disabled')).toBeDefined()
    })

    it('按 Enter 键也能添加任务', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.add-task input').setValue('按回车添加')
      await wrapper.find('.add-task input').trigger('keyup.enter')
      await vi.runAllTimersAsync()
      expect(api.createTask).toHaveBeenCalledWith('按回车添加')
    })
  })

  describe('删除任务', () => {
    it('点击删除应调用 API 并刷新', async () => {
      globalThis.confirm = vi.fn(() => true)
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const initialCallCount = api.fetchTasks.mock.calls.length
      const deleteBtn = wrapper.findAll('.btn-danger')[0]
      await deleteBtn.trigger('click')
      await vi.runAllTimersAsync()
      expect(api.deleteTask).toHaveBeenCalled()
      expect(api.fetchTasks.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it('取消确认时不调用删除 API', async () => {
      globalThis.confirm = vi.fn(() => false)
      api.fetchTasks.mockClear()
      api.deleteTask.mockClear()
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      const deleteBtn = wrapper.findAll('.btn-danger')[0]
      await deleteBtn.trigger('click')
      expect(api.deleteTask).not.toHaveBeenCalled()
    })
  })

  describe('完成弹窗', () => {
    it('初始状态弹窗不显示', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('弹窗内应有关闭按钮', async () => {
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      wrapper.vm.showModal = true
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.modal-btn').exists()).toBe(true)
      expect(wrapper.find('.modal-btn').text()).toContain('继续加油')
    })
  })

  describe('API 错误处理', () => {
    it('获取任务失败时不崩溃', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      api.fetchTasks.mockRejectedValue(new Error('Network error'))
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('创建任务失败时不崩溃', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      api.createTask.mockRejectedValue(new Error('Server error'))
      const wrapper = mountApp()
      await vi.runAllTimersAsync()
      await wrapper.find('.add-task input').setValue('失败任务')
      await wrapper.find('.add-task button').trigger('click')
      await vi.runAllTimersAsync()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
