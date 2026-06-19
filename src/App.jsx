import React from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { ROLES, ROLE_NAMES } from './data/mockData'
import PumpRoomList from './pages/PumpRoomList'
import TestRecords from './pages/TestRecords'
import RetestReminders from './pages/RetestReminders'
import MonthlyStats from './pages/MonthlyStats'
import TestRecordDetail from './pages/TestRecordDetail'

const menuItems = [
  { key: 'rooms', label: '泵房卡片', icon: '🏠', path: '/' },
  { key: 'records', label: '试泵记录', icon: '📋', path: '/records' },
  { key: 'reminders', label: '复测提醒', icon: '🔔', path: '/reminders' },
  { key: 'stats', label: '月度统计', icon: '📊', path: '/stats' }
]

const roleUserNames = {
  [ROLES.DUTY]: '值班员小张',
  [ROLES.MAINTENANCE]: '维保李工',
  [ROLES.SUPERVISOR]: '王主管'
}

export default function App() {
  const { currentRole, setCurrentRole, pendingReminderCount } = useApp()
  const location = useLocation()

  const getUserName = () => roleUserNames[currentRole] || '用户'
  const getAvatar = () => getUserName().charAt(0)

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          消防泵房试泵系统
        </div>
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => 
                `menu-item ${isActive ? 'active' : ''}`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.key === 'reminders' && pendingReminderCount > 0 && (
                <span className="badge">{pendingReminderCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <select
            className="role-selector"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
          >
            {Object.values(ROLES).map(role => (
              <option key={role} value={role}>
                {ROLE_NAMES[role]}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-title">
            {menuItems.find(m => location.pathname === m.path)?.label || '消防泵房试泵系统'}
          </div>
          <div className="header-right">
            <span>当前角色：{ROLE_NAMES[currentRole]}</span>
            <div className="user-info">
              <div className="user-avatar">{getAvatar()}</div>
              <span>{getUserName()}</span>
            </div>
          </div>
        </header>

        <div className="content">
          <Routes>
            <Route path="/" element={<PumpRoomList />} />
            <Route path="/records" element={<TestRecords />} />
            <Route path="/records/:id" element={<TestRecordDetail />} />
            <Route path="/reminders" element={<RetestReminders />} />
            <Route path="/stats" element={<MonthlyStats />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
