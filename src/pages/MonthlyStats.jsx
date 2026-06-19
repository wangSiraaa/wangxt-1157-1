import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function MonthlyStats() {
  const { monthlyStats, testRecords, pumpRooms } = useApp()
  const [selectedMonth, setSelectedMonth] = useState('2026-05')

  const monthRecords = useMemo(() => {
    return testRecords.filter(r => r.month === selectedMonth)
  }, [testRecords, selectedMonth])

  const monthStats = useMemo(() => {
    const records = monthRecords
    const total = pumpRooms.length
    const tested = records.length
    const qualified = records.filter(r => r.status === 'qualified' || r.status === 'closed').length
    const abnormal = records.filter(r => r.status === 'abnormal').length
    const pending = records.filter(r => r.status === 'duty_done' || r.status === 'maintenance_done').length
    
    let abnormalItems = 0
    let retestedItems = 0
    records.forEach(r => {
      abnormalItems += r.abnormalItems?.length || 0
      retestedItems += (r.abnormalItems || []).filter(a => a.retested).length
    })

    const withRotation = records.filter(r => r.rotationDone).length
    const rotationRate = tested > 0 ? Math.round((withRotation / tested) * 100) : 0

    return {
      total,
      tested,
      qualified,
      abnormal,
      pending,
      abnormalItems,
      retestedItems,
      pendingRetest: abnormalItems - retestedItems,
      rotationRate,
      testRate: Math.round((tested / total) * 100)
    }
  }, [monthRecords, pumpRooms])

  const chartData = monthlyStats.details

  const maxValue = Math.max(...chartData.map(d => d.tested))

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">{selectedMonth}月度统计概览</div>
          <select
            className="filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="2026-05">2026年5月</option>
            <option value="2026-04">2026年4月</option>
            <option value="2026-03">2026年3月</option>
          </select>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">🏠</div>
              <div className="stat-value">{monthStats.total}</div>
              <div className="stat-label">泵房总数</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">✅</div>
              <div className="stat-value">{monthStats.tested}</div>
              <div className="stat-label">已试泵 ({monthStats.testRate}%)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">🏆</div>
              <div className="stat-value">{monthStats.qualified}</div>
              <div className="stat-label">合格数</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-red">⚠️</div>
              <div className="stat-value">{monthStats.abnormal}</div>
              <div className="stat-label">异常泵房</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange">⏳</div>
              <div className="stat-value">{monthStats.pending}</div>
              <div className="stat-label">待处理</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">🔄</div>
              <div className="stat-value">{monthStats.rotationRate}%</div>
              <div className="stat-label">主备泵轮换率</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">近5个月趋势</div>
        </div>
        <div className="card-body">
          <div className="chart-container">
            <div className="bar-chart">
              {chartData.map(item => {
                const height = maxValue > 0 ? (item.tested / maxValue) * 100 : 0
                return (
                  <div key={item.month} className="bar-item">
                    <div className="bar-value">{item.tested}</div>
                    <div
                      className="bar"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${item.month}: 已试泵${item.tested}个，合格${item.qualified}个，异常${item.abnormal}个`}
                    />
                    <div className="bar-label">{item.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, background: '#1890ff', borderRadius: 2 }} />
              <span className="text-muted">已试泵数</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">各泵房试泵情况</div>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>泵房</th>
                <th>位置</th>
                <th>本月试泵</th>
                <th>状态</th>
                <th>异常项</th>
                <th>主备泵轮换</th>
                <th>上次试泵</th>
              </tr>
            </thead>
            <tbody>
              {pumpRooms.map(room => {
                const record = monthRecords.find(r => r.roomId === room.id)
                const abnormalCount = record?.abnormalItems?.length || 0
                return (
                  <tr key={room.id}>
                    <td className="font-medium">{room.name}</td>
                    <td>{room.location}</td>
                    <td>{record ? '是' : '否'}</td>
                    <td>
                      {record ? (
                        <span className={`status-tag ${
                          record.status === 'qualified' || record.status === 'closed'
                            ? 'status-normal'
                            : record.status === 'abnormal'
                            ? 'status-abnormal'
                            : 'status-pending'
                        }`}>
                          {record.status === 'qualified' || record.status === 'closed' ? '合格' :
                           record.status === 'abnormal' ? '异常' : '进行中'}
                        </span>
                      ) : (
                        <span className="text-muted">未试泵</span>
                      )}
                    </td>
                    <td>
                      {abnormalCount > 0
                        ? <span className="text-danger">{abnormalCount} 项</span>
                        : <span className="text-success">0 项</span>
                      }
                    </td>
                    <td>
                      {record ? (
                        record.rotationDone
                          ? <span className="text-success">已轮换</span>
                          : <span className="text-warning">未轮换</span>
                      ) : '-'}
                    </td>
                    <td>{room.lastTestDate || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">异常项统计</div>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-red">🔴</div>
              <div className="stat-value">{monthStats.abnormalItems}</div>
              <div className="stat-label">异常项总数</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">✅</div>
              <div className="stat-value">{monthStats.retestedItems}</div>
              <div className="stat-label">已复测</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange">⏳</div>
              <div className="stat-value">{monthStats.pendingRetest}</div>
              <div className="stat-label">待复测</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">📊</div>
              <div className="stat-value">
                {monthStats.abnormalItems > 0
                  ? Math.round((monthStats.retestedItems / monthStats.abnormalItems) * 100)
                  : 0}%
              </div>
              <div className="stat-label">复测完成率</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">历史数据明细</div>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th>泵房总数</th>
                <th>已试泵</th>
                <th>合格</th>
                <th>异常</th>
                <th>试泵率</th>
                <th>合格率</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map(item => (
                <tr key={item.month}>
                  <td>{item.month}</td>
                  <td>{item.total}</td>
                  <td>{item.tested}</td>
                  <td>{item.qualified}</td>
                  <td>{item.abnormal}</td>
                  <td>{Math.round((item.tested / item.total) * 100)}%</td>
                  <td>
                    {item.tested > 0
                      ? <span className="text-success">
                          {Math.round((item.qualified / item.tested) * 100)}%
                        </span>
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
