import React, { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { TEST_STATUS, TEST_STATUS_NAMES, ROLES } from '../data/mockData'

function getStatusClass(status) {
  const map = {
    [TEST_STATUS.DRAFT]: 'status-pending',
    [TEST_STATUS.DUTY_DONE]: 'status-processing',
    [TEST_STATUS.MAINTENANCE_DONE]: 'status-pending',
    [TEST_STATUS.QUALIFIED]: 'status-normal',
    [TEST_STATUS.ABNORMAL]: 'status-abnormal',
    [TEST_STATUS.CLOSED]: 'status-closed'
  }
  return map[status] || 'status-pending'
}

export default function TestRecords() {
  const { testRecords, currentRole, pumpRooms } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const roomIdFromState = location.state?.roomId

  const [filterRoom, setFilterRoom] = useState(roomIdFromState || '')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState('2026-05')

  const filteredRecords = useMemo(() => {
    return testRecords.filter(r => {
      if (filterRoom && r.roomId !== filterRoom) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterMonth && r.month !== filterMonth) return false
      return true
    })
  }, [testRecords, filterRoom, filterStatus, filterMonth])

  const canCreateRecord = currentRole === ROLES.DUTY
  const canDoMaintenance = currentRole === ROLES.MAINTENANCE
  const canSupervise = currentRole === ROLES.SUPERVISOR

  const handleRowClick = (record) => {
    navigate(`/records/${record.id}`)
  }

  const handleCreateNew = () => {
    if (!canCreateRecord) return
    const newRecord = {
      id: `test-${Date.now()}`,
      roomId: filterRoom || pumpRooms[0].id,
      roomName: pumpRooms.find(r => r.id === (filterRoom || pumpRooms[0].id))?.name || '',
      month: filterMonth,
      testDate: new Date().toISOString().split('T')[0],
      status: TEST_STATUS.DRAFT,
      dutyPerson: '',
      dutyDate: '',
      waterPressure: 0,
      powerSupply: '',
      maintenancePerson: '',
      maintenanceDate: '',
      usedPump: '',
      rotationDone: false,
      testPressure: 0,
      testFlow: 0,
      testDuration: 0,
      abnormalItems: [],
      supervisorPerson: '',
      supervisorDate: '',
      closeRemark: ''
    }
    navigate(`/records/${newRecord.id}`, { state: { newRecord, isNew: true } })
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">试泵记录</div>
          {canCreateRecord && (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              + 新增试泵
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="filter-item">
              <label className="filter-label">泵房：</label>
              <select
                className="filter-select"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              >
                <option value="">全部泵房</option>
                {pumpRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">状态：</label>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">全部状态</option>
                {Object.entries(TEST_STATUS_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">月份：</label>
              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="2026-05">2026年5月</option>
                <option value="2026-04">2026年4月</option>
                <option value="2026-03">2026年3月</option>
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>记录编号</th>
                <th>泵房</th>
                <th>试泵日期</th>
                <th>状态</th>
                <th>值班人员</th>
                <th>维保人员</th>
                <th>主管审核</th>
                <th>异常项</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id} onClick={() => handleRowClick(record)} style={{ cursor: 'pointer' }}>
                  <td>{record.id}</td>
                  <td>{record.roomName}</td>
                  <td>{record.testDate}</td>
                  <td>
                    <span className={`status-tag ${getStatusClass(record.status)}`}>
                      {TEST_STATUS_NAMES[record.status]}
                    </span>
                  </td>
                  <td>{record.dutyPerson || '-'}</td>
                  <td>{record.maintenancePerson || '-'}</td>
                  <td>{record.supervisorPerson || '-'}</td>
                  <td>
                    {record.abnormalItems?.length > 0
                      ? <span className="text-danger">{record.abnormalItems.length} 项</span>
                      : <span className="text-muted">无</span>
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-default"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(record)
                      }}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="empty">暂无试泵记录</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">各角色操作说明</div>
        </div>
        <div className="card-body">
          <div className="form-row-3">
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 6 }}>
              <div className="font-medium mb-2">🏢 物业值班</div>
              <ul style={{ fontSize: 13, color: '#666', paddingLeft: 20, lineHeight: 1.8 }}>
                <li>检查并登记水压数据</li>
                <li>确认电源状态正常</li>
                <li>检查水池液位高度</li>
                <li>提交后流转到维保</li>
              </ul>
            </div>
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 6 }}>
              <div className="font-medium mb-2">🔧 维保单位</div>
              <ul style={{ fontSize: 13, color: '#666', paddingLeft: 20, lineHeight: 1.8 }}>
                <li>执行主备泵轮换试泵</li>
                <li>记录压力、流量、时长</li>
                <li>登记异常事项</li>
                <li>提交后流转到主管</li>
              </ul>
            </div>
            <div style={{ padding: 16, background: '#fafafa', borderRadius: 6 }}>
              <div className="font-medium mb-2">👮 消防主管</div>
              <ul style={{ fontSize: 13, color: '#666', paddingLeft: 20, lineHeight: 1.8 }}>
                <li>审核试泵结果</li>
                <li>安排异常项复测</li>
                <li>确认全部合格后关闭</li>
                <li>查看月度统计数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
