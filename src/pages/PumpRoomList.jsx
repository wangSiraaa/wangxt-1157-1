import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PUMP_STATUS, PUMP_STATUS_NAMES, ROLES } from '../data/mockData'

function getLevelPercent(current, min, max) {
  const percent = ((current - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, percent))
}

function getLevelClass(current, min) {
  const ratio = current / min
  if (ratio < 1) return 'level-danger'
  if (ratio < 1.5) return 'level-warning'
  return 'level-normal'
}

function getStatusClass(status) {
  const map = {
    [PUMP_STATUS.NORMAL]: 'status-normal',
    [PUMP_STATUS.ABNORMAL]: 'status-abnormal',
    [PUMP_STATUS.PENDING]: 'status-pending',
    [PUMP_STATUS.CLOSED]: 'status-closed'
  }
  return map[status] || 'status-normal'
}

function PumpRoomCard({ room, onClick }) {
  const levelPercent = getLevelPercent(room.currentLevel, room.minLevel, room.tankCapacity)
  const levelClass = getLevelClass(room.currentLevel, room.minLevel)

  return (
    <div className="pump-room-card" onClick={onClick}>
      <div className="pump-room-card-header">
        <div>
          <div className="pump-room-name">{room.name}</div>
          <div className="pump-room-location">{room.location}</div>
        </div>
        <span className={`status-tag ${getStatusClass(room.status)}`}>
          {PUMP_STATUS_NAMES[room.status]}
        </span>
      </div>

      <div className="pump-room-info">
        <div className="info-item">
          <span className="info-label">主泵</span>
          <span className="info-value">{room.mainPump}</span>
        </div>
        <div className="info-item">
          <span className="info-label">备泵</span>
          <span className="info-value">{room.backupPump}</span>
        </div>
        <div className="info-item">
          <span className="info-label">上次试泵</span>
          <span className="info-value">{room.lastTestDate || '-'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">上次使用</span>
          <span className="info-value">
            {room.lastUsedPump === 'main' ? '主泵' : '备泵'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <span className="info-label">水池液位</span>
          <span className="text-sm font-medium">
            {room.currentLevel} / {room.tankCapacity} m³
          </span>
        </div>
        <div className="level-bar">
          <div
            className={`level-fill ${levelClass}`}
            style={{ width: `${levelPercent}%` }}
          />
        </div>
        {room.currentLevel < room.minLevel && (
          <div className="text-danger text-sm mt-2">
            ⚠️ 低于最低液位 {room.minLevel} m³
          </div>
        )}
      </div>
    </div>
  )
}

export default function PumpRoomList() {
  const { pumpRooms, currentRole, testRecords, checkCanStartTest } = useApp()
  const navigate = useNavigate()

  const handleCardClick = (room) => {
    navigate('/records', { state: { roomId: room.id } })
  }

  const stats = {
    total: pumpRooms.length,
    normal: pumpRooms.filter(r => r.status === PUMP_STATUS.NORMAL).length,
    abnormal: pumpRooms.filter(r => r.status === PUMP_STATUS.ABNORMAL).length,
    pending: pumpRooms.filter(r => r.status === PUMP_STATUS.PENDING).length,
    lowLevel: pumpRooms.filter(r => r.currentLevel < r.minLevel).length
  }

  const thisMonthRecords = testRecords.filter(r => r.month === '2026-05')

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">🏠</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">泵房总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">✅</div>
          <div className="stat-value">{stats.normal}</div>
          <div className="stat-label">正常运行</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red">⚠️</div>
          <div className="stat-value">{stats.abnormal}</div>
          <div className="stat-label">异常泵房</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">待复测</div>
        </div>
      </div>

      {stats.lowLevel > 0 && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>有 {stats.lowLevel} 个泵房水池液位过低，已阻断试泵操作</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">泵房列表</div>
          <div className="text-sm text-muted">
            本月已试泵 {thisMonthRecords.length} / {stats.total} 个泵房
          </div>
        </div>
        <div className="card-body">
          <div className="pump-room-grid">
            {pumpRooms.map(room => (
              <PumpRoomCard
                key={room.id}
                room={room}
                onClick={() => handleCardClick(room)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">操作指引</div>
        </div>
        <div className="card-body">
          <div className="timeline">
            <div className="timeline-item done">
              <div className="timeline-title">物业值班登记</div>
              <div className="timeline-time">第一步</div>
              <div className="timeline-desc">
                值班员检查并登记水压、电源状态，确认水池液位正常
              </div>
            </div>
            <div className="timeline-item done">
              <div className="timeline-title">维保单位试泵</div>
              <div className="timeline-time">第二步</div>
              <div className="timeline-desc">
                维保人员执行主备泵轮换试泵，记录压力、流量、运行时间等参数
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-title">消防主管审核</div>
              <div className="timeline-time">第三步</div>
              <div className="timeline-desc">
                主管审核试泵结果，异常项安排复测，全部合格后关闭
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
