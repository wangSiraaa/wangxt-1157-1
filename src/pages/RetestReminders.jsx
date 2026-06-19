import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ROLES } from '../data/mockData'

function getPriorityClass(priority) {
  const map = {
    high: 'text-danger',
    medium: 'text-warning',
    low: 'text-success'
  }
  return map[priority] || 'text-muted'
}

function getPriorityText(priority) {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

export default function RetestReminders() {
  const { retestReminders, currentRole, updateRetestReminder, testRecords } = useApp()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const filteredReminders = useMemo(() => {
    return retestReminders.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false
      if (filterPriority && r.priority !== filterPriority) return false
      return true
    })
  }, [retestReminders, filterStatus, filterPriority])

  const stats = {
    total: retestReminders.length,
    pending: retestReminders.filter(r => r.status === 'pending').length,
    done: retestReminders.filter(r => r.status === 'done').length,
    overdue: retestReminders.filter(r => {
      if (r.status !== 'pending') return false
      const dueDate = new Date(r.dueDate)
      const today = new Date()
      return dueDate < today
    }).length
  }

  const canHandle = currentRole === ROLES.MAINTENANCE || currentRole === ROLES.SUPERVISOR

  const handleMarkDone = (reminderId) => {
    updateRetestReminder(reminderId, { status: 'done' })
  }

  const goToRecord = (testId) => {
    navigate(`/records/${testId}`)
  }

  const isOverdue = (dueDate) => {
    const due = new Date(dueDate)
    const today = new Date()
    return due < today
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">🔔</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总提醒数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red">⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">待处理</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">✅</div>
          <div className="stat-value">{stats.done}</div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red">⚠️</div>
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">已逾期</div>
        </div>
      </div>

      {stats.overdue > 0 && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>有 {stats.overdue} 条复测提醒已逾期，请及时处理</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">复测提醒列表</div>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="filter-item">
              <label className="filter-label">状态：</label>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">全部</option>
                <option value="pending">待处理</option>
                <option value="done">已完成</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">优先级：</label>
              <select
                className="filter-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">全部</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>提醒编号</th>
                <th>泵房</th>
                <th>异常项</th>
                <th>优先级</th>
                <th>创建日期</th>
                <th>截止日期</th>
                <th>负责人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReminders.map(reminder => (
              <tr key={reminder.id}>
                <td>{reminder.id}</td>
                <td>{reminder.roomName}</td>
                <td>{reminder.abnormalItem}</td>
                <td>
                  <span className={getPriorityClass(reminder.priority)}>
                    {getPriorityText(reminder.priority)}
                  </span>
                </td>
                <td>{reminder.createDate}</td>
                <td>
                  <span className={isOverdue(reminder.dueDate) && reminder.status === 'pending' ? 'text-danger' : ''}>
                    {reminder.dueDate}
                    {isOverdue(reminder.dueDate) && reminder.status === 'pending' && ' (逾期)'}
                  </span>
                </td>
                <td>{reminder.assignee}</td>
                <td>
                  <span className={`status-tag ${reminder.status === 'done' ? 'status-normal' : 'status-pending'}`}>
                    {reminder.status === 'done' ? '已完成' : '待处理'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm btn-default"
                      onClick={() => goToRecord(reminder.testId)}
                    >
                      查看记录
                    </button>
                    {canHandle && reminder.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleMarkDone(reminder.id)}
                      >
                        标记完成
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>

          {filteredReminders.length === 0 && (
            <div className="empty">暂无复测提醒</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">异常闭环规则</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex items-center gap-2">
              <span className="text-danger">❌</span>
              <span>异常未复测不能关闭：所有异常项必须完成复测后才能关闭记录</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-warning">⚠️</span>
              <span>逾期提醒：超过截止日期未处理的提醒将标红显示</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">ℹ️</span>
              <span>三级优先级：严重异常高优先级，一般异常中优先级</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✅</span>
              <span>闭环流程：发现异常 → 创建提醒 → 安排复测 → 验证合格 → 关闭记录</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
