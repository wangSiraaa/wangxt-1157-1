import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { MONTHLY_STATUS, MONTHLY_STATUS_NAMES, MONTHLY_STATUS_COLORS } from '../data/mockData'

export default function MonthlyStats() {
  const { monthlyStats, testRecords, pumpRooms, getMonthlyStatsForMonth, monthlyClosedLoopStats, getRecordMonthlyStatus } = useApp()
  const [selectedMonth, setSelectedMonth] = useState('2026-05')

  const monthRecords = useMemo(() => {
    return testRecords.filter(r => r.month === selectedMonth)
  }, [testRecords, selectedMonth])

  const closedLoopStats = useMemo(() => {
    return getMonthlyStatsForMonth(selectedMonth)
  }, [getMonthlyStatsForMonth, selectedMonth])

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

  const closedLoopMaxValue = Math.max(
    ...monthlyClosedLoopStats.map(d => Math.max(
      d.statusCounts[MONTHLY_STATUS.RETEST_PASSED],
      d.statusCounts[MONTHLY_STATUS.ABNORMAL],
      d.statusCounts[MONTHLY_STATUS.UNTESTED],
      d.statusCounts[MONTHLY_STATUS.OVERDUE]
    ))
  )

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">{selectedMonth}月度闭环统计</div>
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
              <div className="stat-icon" style={{ background: '#f5f5f5', color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.UNTESTED] }}>⏳</div>
              <div className="stat-value" style={{ color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.UNTESTED] }}>
                {closedLoopStats.statusCounts[MONTHLY_STATUS.UNTESTED]}
              </div>
              <div className="stat-label">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.UNTESTED]}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff2f0', color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.ABNORMAL] }}>⚠️</div>
              <div className="stat-value" style={{ color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.ABNORMAL] }}>
                {closedLoopStats.statusCounts[MONTHLY_STATUS.ABNORMAL]}
              </div>
              <div className="stat-label">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.ABNORMAL]}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f6ffed', color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.RETEST_PASSED] }}>✅</div>
              <div className="stat-value" style={{ color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.RETEST_PASSED] }}>
                {closedLoopStats.statusCounts[MONTHLY_STATUS.RETEST_PASSED]}
              </div>
              <div className="stat-label">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.RETEST_PASSED]}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff7e6', color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.OVERDUE] }}>⏰</div>
              <div className="stat-value" style={{ color: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.OVERDUE] }}>
                {closedLoopStats.statusCounts[MONTHLY_STATUS.OVERDUE]}
              </div>
              <div className="stat-label">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.OVERDUE]}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">🔄</div>
              <div className="stat-value">{closedLoopStats.rotationRate}%</div>
              <div className="stat-label">主备泵轮换率</div>
            </div>
          </div>

          {closedLoopStats.statusCounts[MONTHLY_STATUS.OVERDUE] > 0 && (
            <div className="alert alert-error mt-4">
              <span>⚠️</span>
              <span>有 {closedLoopStats.statusCounts[MONTHLY_STATUS.OVERDUE]} 个泵房月度试泵已逾期，请尽快处理</span>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">月度闭环分布</div>
        </div>
        <div className="card-body">
          <div className="chart-container" style={{ height: '220px' }}>
            <div className="bar-chart stacked-bar-chart">
              {monthlyClosedLoopStats.map(item => {
                const total = item.statusCounts[MONTHLY_STATUS.UNTESTED] +
                  item.statusCounts[MONTHLY_STATUS.ABNORMAL] +
                  item.statusCounts[MONTHLY_STATUS.RETEST_PASSED] +
                  item.statusCounts[MONTHLY_STATUS.OVERDUE]
                const untestedH = closedLoopMaxValue > 0 ? (item.statusCounts[MONTHLY_STATUS.UNTESTED] / closedLoopMaxValue) * 100 : 0
                const abnormalH = closedLoopMaxValue > 0 ? (item.statusCounts[MONTHLY_STATUS.ABNORMAL] / closedLoopMaxValue) * 100 : 0
                const retestH = closedLoopMaxValue > 0 ? (item.statusCounts[MONTHLY_STATUS.RETEST_PASSED] / closedLoopMaxValue) * 100 : 0
                const overdueH = closedLoopMaxValue > 0 ? (item.statusCounts[MONTHLY_STATUS.OVERDUE] / closedLoopMaxValue) * 100 : 0

                return (
                  <div key={item.month} className="bar-item stacked-bar-item">
                    <div className="stacked-bar">
                      {item.statusCounts[MONTHLY_STATUS.OVERDUE] > 0 && (
                        <div
                          className="bar-segment"
                          style={{ height: `${overdueH}%`, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.OVERDUE] }}
                          title={`逾期: ${item.statusCounts[MONTHLY_STATUS.OVERDUE]}`}
                        />
                      )}
                      {item.statusCounts[MONTHLY_STATUS.ABNORMAL] > 0 && (
                        <div
                          className="bar-segment"
                          style={{ height: `${abnormalH}%`, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.ABNORMAL] }}
                          title={`异常: ${item.statusCounts[MONTHLY_STATUS.ABNORMAL]}`}
                        />
                      )}
                      {item.statusCounts[MONTHLY_STATUS.UNTESTED] > 0 && (
                        <div
                          className="bar-segment"
                          style={{ height: `${untestedH}%`, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.UNTESTED] }}
                          title={`未试: ${item.statusCounts[MONTHLY_STATUS.UNTESTED]}`}
                        />
                      )}
                      {item.statusCounts[MONTHLY_STATUS.RETEST_PASSED] > 0 && (
                        <div
                          className="bar-segment"
                          style={{ height: `${retestH}%`, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.RETEST_PASSED] }}
                          title={`复测通过: ${item.statusCounts[MONTHLY_STATUS.RETEST_PASSED]}`}
                        />
                      )}
                    </div>
                    <div className="bar-label">{item.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.UNTESTED], borderRadius: 2 }} />
              <span className="text-muted">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.UNTESTED]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.ABNORMAL], borderRadius: 2 }} />
              <span className="text-muted">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.ABNORMAL]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.RETEST_PASSED], borderRadius: 2 }} />
              <span className="text-muted">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.RETEST_PASSED]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, background: MONTHLY_STATUS_COLORS[MONTHLY_STATUS.OVERDUE], borderRadius: 2 }} />
              <span className="text-muted">{MONTHLY_STATUS_NAMES[MONTHLY_STATUS.OVERDUE]}</span>
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
          <div className="card-title">各泵房月度闭环状态</div>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>泵房</th>
                <th>位置</th>
                <th>本月试泵</th>
                <th>月度闭环状态</th>
                <th>异常项</th>
                <th>主备泵轮换</th>
                <th>上次试泵</th>
              </tr>
            </thead>
            <tbody>
              {pumpRooms.map(room => {
                const record = monthRecords.find(r => r.roomId === room.id)
                const abnormalCount = record?.abnormalItems?.length || 0
                const monthlyStatus = record ? getRecordMonthlyStatus(record) : MONTHLY_STATUS.UNTESTED
                return (
                  <tr key={room.id}>
                    <td className="font-medium">{room.name}</td>
                    <td>{room.location}</td>
                    <td>{record ? '是' : '否'}</td>
                    <td>
                      <span
                        className="status-tag"
                        style={{
                          background: `${MONTHLY_STATUS_COLORS[monthlyStatus]}15`,
                          color: MONTHLY_STATUS_COLORS[monthlyStatus],
                          borderColor: `${MONTHLY_STATUS_COLORS[monthlyStatus]}40`
                        }}
                      >
                        {MONTHLY_STATUS_NAMES[monthlyStatus]}
                      </span>
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
