import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  TEST_STATUS,
  TEST_STATUS_NAMES,
  ROLES,
  ROLE_NAMES
} from '../data/mockData'

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

const roleUserNames = {
  [ROLES.DUTY]: '值班员小张',
  [ROLES.MAINTENANCE]: '维保李工',
  [ROLES.SUPERVISOR]: '王主管'
}

export default function TestRecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    testRecords,
    currentRole,
    pumpRooms,
    retestReminders,
    updateTestRecord,
    addTestRecord,
    checkCanStartTest,
    checkCanSubmitQualified,
    checkCanClose,
    assignRetest,
    isOverdue
  } = useApp()

  const isNew = location.state?.isNew
  const newRecordData = location.state?.newRecord

  const [record, setRecord] = useState(null)
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState([])
  const [dutyForm, setDutyForm] = useState({
    waterPressure: '',
    powerSupply: '',
    dutyPerson: ''
  })
  const [maintenanceForm, setMaintenanceForm] = useState({
    usedPump: '',
    rotationDone: false,
    testPressure: '',
    testFlow: '',
    testDuration: '',
    maintenancePerson: ''
  })
  const [abnormalList, setAbnormalList] = useState([])
  const [newAbnormal, setNewAbnormal] = useState({
    item: '',
    description: '',
    level: 'minor'
  })
  const [closeForm, setCloseForm] = useState({
    remark: '',
    supervisorPerson: ''
  })
  const [activeTab, setActiveTab] = useState('info')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [currentAssignItem, setCurrentAssignItem] = useState(null)
  const [assignForm, setAssignForm] = useState({
    assignee: '',
    dueDate: ''
  })

  useEffect(() => {
    if (isNew && newRecordData) {
      const roomData = pumpRooms.find(r => r.id === newRecordData.roomId)
      setRecord(newRecordData)
      setEditing(true)
      setDutyForm({
        waterPressure: '0.85',
        powerSupply: '正常',
        liquidLevel: roomData?.currentLevel?.toString() || '',
        dutyPerson: roleUserNames[currentRole]
      })
      setAbnormalList([])
    } else {
      const found = testRecords.find(r => r.id === id)
      if (found) {
        setRecord(found)
        setDutyForm({
          waterPressure: found.waterPressure || '',
          powerSupply: found.powerSupply || '',
          liquidLevel: found.liquidLevel?.toString() || '',
          dutyPerson: found.dutyPerson || ''
        })
        setMaintenanceForm({
          usedPump: found.usedPump || '',
          rotationDone: found.rotationDone || false,
          testPressure: found.testPressure || '',
          testFlow: found.testFlow || '',
          testDuration: found.testDuration || '',
          maintenancePerson: found.maintenancePerson || ''
        })
        setAbnormalList(found.abnormalItems || [])
        setCloseForm({
          remark: found.closeRemark || '',
          supervisorPerson: found.supervisorPerson || ''
        })
      }
    }
  }, [id, isNew, newRecordData, testRecords, currentRole])

  if (!record) {
    return <div className="empty">加载中...</div>
  }

  const room = pumpRooms.find(r => r.id === record.roomId)

  const canEditDuty = currentRole === ROLES.DUTY &&
    (record.status === TEST_STATUS.DRAFT)

  const canDoMaintenance = currentRole === ROLES.MAINTENANCE &&
    (record.status === TEST_STATUS.DUTY_DONE)

  const canSupervise = currentRole === ROLES.SUPERVISOR &&
    (record.status === TEST_STATUS.MAINTENANCE_DONE || record.status === TEST_STATUS.ABNORMAL)

  const canClose = currentRole === ROLES.SUPERVISOR &&
    (record.status === TEST_STATUS.ABNORMAL)

  const levelCheckResult = checkCanStartTest(record.roomId, dutyForm.liquidLevel)

  const handleDutySubmit = () => {
    const errs = []
    if (!dutyForm.waterPressure) errs.push('请填写水压')
    if (!dutyForm.powerSupply) errs.push('请选择电源状态')
    if (!dutyForm.liquidLevel) errs.push('请填写水池液位')
    if (!dutyForm.dutyPerson) errs.push('请填写值班人员')

    if (!levelCheckResult.canStart) {
      errs.push(levelCheckResult.reason)
    }

    if (errs.length > 0) {
      setErrors(errs)
      return
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    const updates = {
      ...record,
      waterPressure: parseFloat(dutyForm.waterPressure),
      powerSupply: dutyForm.powerSupply,
      liquidLevel: parseFloat(dutyForm.liquidLevel),
      dutyPerson: dutyForm.dutyPerson,
      dutyDate: now,
      status: TEST_STATUS.DUTY_DONE
    }

    if (isNew) {
      addTestRecord(updates)
    } else {
      updateTestRecord(id, updates)
    }
    setRecord(updates)
    setEditing(false)
    setErrors([])
    if (isNew) {
      navigate('/records')
    }
  }

  const handleMaintenanceSubmit = () => {
    const errs = []
    if (!maintenanceForm.usedPump) errs.push('请选择使用水泵')
    if (!maintenanceForm.testPressure) errs.push('请填写测试压力')
    if (!maintenanceForm.testFlow) errs.push('请填写测试流量')
    if (!maintenanceForm.testDuration) errs.push('请填写测试时长')
    if (!maintenanceForm.maintenancePerson) errs.push('请填写维保人员')

    if (errs.length > 0) {
      setErrors(errs)
      return
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    const hasAbnormal = abnormalList.length > 0
    const newStatus = hasAbnormal ? TEST_STATUS.ABNORMAL : TEST_STATUS.MAINTENANCE_DONE

    const updates = {
      ...record,
      usedPump: maintenanceForm.usedPump,
      rotationDone: maintenanceForm.rotationDone,
      testPressure: parseFloat(maintenanceForm.testPressure),
      testFlow: parseFloat(maintenanceForm.testFlow),
      testDuration: parseInt(maintenanceForm.testDuration),
      maintenancePerson: maintenanceForm.maintenancePerson,
      maintenanceDate: now,
      abnormalItems: abnormalList,
      status: newStatus
    }

    updateTestRecord(id, updates)
    setRecord(updates)
    setErrors([])
  }

  const currentRecord = { ...record, abnormalItems: abnormalList }

  const handleSubmitQualified = () => {
    const result = checkCanSubmitQualified(currentRecord)
    if (!result.canSubmit) {
      setErrors([result.reason])
      return
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    const updates = {
      ...record,
      status: TEST_STATUS.QUALIFIED,
      supervisorPerson: roleUserNames[currentRole],
      supervisorDate: now,
      closeRemark: '试泵合格，审核通过'
    }
    updateTestRecord(id, updates)
    setRecord(updates)
    setErrors([])
  }

  const handleClose = () => {
    const result = checkCanClose(currentRecord)
    if (!result.canClose) {
      setErrors([result.reason])
      return
    }
    if (!closeForm.remark) {
      setErrors(['请填写关闭备注'])
      return
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    const updates = {
      ...record,
      status: TEST_STATUS.CLOSED,
      closeRemark: closeForm.remark,
      supervisorPerson: roleUserNames[currentRole],
      supervisorDate: now
    }
    updateTestRecord(id, updates)
    setRecord(updates)
    setErrors([])
  }

  const addAbnormalItem = () => {
    if (!newAbnormal.item) {
      setErrors(['请填写异常项名称'])
      return
    }
    const item = {
      id: `ab-${Date.now()}`,
      ...newAbnormal,
      retested: false
    }
    setAbnormalList([...abnormalList, item])
    setNewAbnormal({ item: '', description: '', level: 'minor' })
    setErrors([])
  }

  const removeAbnormalItem = (itemId) => {
    setAbnormalList(abnormalList.filter(a => a.id !== itemId))
  }

  const toggleRetest = (itemId) => {
    setAbnormalList(abnormalList.map(a =>
      a.id === itemId ? { ...a, retested: !a.retested } : a
    ))
  }

  const openAssignModal = (item) => {
    setCurrentAssignItem(item)
    setAssignForm({
      assignee: '赵工',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    setAssignModalOpen(true)
  }

  const handleAssignRetest = () => {
    if (!assignForm.assignee) {
      setErrors(['请选择负责人'])
      return
    }
    if (!assignForm.dueDate) {
      setErrors(['请选择截止日期'])
      return
    }

    if (assignRetest && currentAssignItem) {
      assignRetest(id, currentAssignItem.id, assignForm.assignee, assignForm.dueDate)
    }

    setAssignModalOpen(false)
    setCurrentAssignItem(null)
    setErrors([])
  }

  const getLevelClass = (level) => {
    return level === 'major' ? 'level-major' : 'level-minor'
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{record.roomName} - 月度试泵记录</div>
            <div className="text-sm text-muted mt-1">
              记录编号：{record.id} | 月份：{record.month}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`status-tag ${getStatusClass(record.status)}`}>
              {TEST_STATUS_NAMES[record.status]}
            </span>
            <button
              className="btn btn-sm btn-default"
              onClick={() => navigate(-1)}
            >
              返回列表
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="tabs">
            <div
              className={`tab-item ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              基本信息
            </div>
            <div
              className={`tab-item ${activeTab === 'duty' ? 'active' : ''}`}
              onClick={() => setActiveTab('duty')}
            >
              值班登记
            </div>
            <div
              className={`tab-item ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              试泵执行
            </div>
            <div
              className={`tab-item ${activeTab === 'abnormal' ? 'active' : ''}`}
              onClick={() => setActiveTab('abnormal')}
            >
              异常项 {abnormalList.length > 0 && `(${abnormalList.length})`}
            </div>
            <div
              className={`tab-item ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              流程时间线
            </div>
          </div>

          {errors.length > 0 && (
            <div className="alert alert-error">
              <span>❌</span>
              <div>
                {errors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div>
              <div className="detail-section">
                <div className="detail-section-title">泵房信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">泵房名称</span>
                    <span className="detail-value">{record.roomName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">位置</span>
                    <span className="detail-value">{room?.location || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">主泵</span>
                    <span className="detail-value">{room?.mainPump || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">备泵</span>
                    <span className="detail-value">{room?.backupPump || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">水池容量</span>
                    <span className="detail-value">{room?.tankCapacity || 0} m³</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">当前液位</span>
                    <span className={`detail-value ${room && room.currentLevel < room.minLevel ? 'text-danger' : ''}`}>
                      {room?.currentLevel || 0} m³
                      {room && room.currentLevel < room.minLevel && ' (过低)'}
                    </span>
                  </div>
                </div>
              </div>

              {room && room.currentLevel < room.minLevel && (
                <div className="alert alert-error">
                  <span>⚠️</span>
                  <span>水池液位低于最低值 {room.minLevel} m³，已阻断试泵操作</span>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">试泵状态</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className="detail-value">
                      <span className={`status-tag ${getStatusClass(record.status)}`}>
                        {TEST_STATUS_NAMES[record.status]}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">试泵日期</span>
                    <span className="detail-value">{record.testDate || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">值班人员</span>
                    <span className="detail-value">{record.dutyPerson || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">维保人员</span>
                    <span className="detail-value">{record.maintenancePerson || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">主管审核</span>
                    <span className="detail-value">{record.supervisorPerson || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">主备泵轮换</span>
                    <span className={`detail-value ${record.rotationDone ? 'text-success' : 'text-warning'}`}>
                      {record.rotationDone ? '已轮换' : '未轮换'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'duty' && (
            <div>
              <div className="detail-section">
                <div className="detail-section-title">值班登记信息</div>
                {(canEditDuty || isNew) ? (
                  <div>
                    <div className="form-row">
                      <div className="form-item">
                        <label className="form-label">水压 (MPa)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={dutyForm.waterPressure}
                          onChange={(e) => setDutyForm({ ...dutyForm, waterPressure: e.target.value })}
                          placeholder="请输入水压"
                        />
                      </div>
                      <div className="form-item">
                        <label className="form-label">电源状态</label>
                        <select
                          className="form-select"
                          value={dutyForm.powerSupply}
                          onChange={(e) => setDutyForm({ ...dutyForm, powerSupply: e.target.value })}
                        >
                          <option value="">请选择</option>
                          <option value="正常">正常</option>
                          <option value="异常">异常</option>
                        </select>
                      </div>
                      <div className="form-item">
                        <label className="form-label">水池液位 (m³)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={dutyForm.liquidLevel}
                          onChange={(e) => setDutyForm({ ...dutyForm, liquidLevel: e.target.value })}
                          placeholder="请输入水池液位"
                          min="0"
                          step="1"
                        />
                        {room && (
                          <div className="text-sm text-muted mt-1">
                            最低液位要求: {room.minLevel} m³
                            {parseFloat(dutyForm.liquidLevel) < room.minLevel && dutyForm.liquidLevel && (
                              <span className="text-danger"> ⚠️ 液位过低</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-item">
                      <label className="form-label">值班人员</label>
                      <input
                        type="text"
                        className="form-input"
                        value={dutyForm.dutyPerson}
                        onChange={(e) => setDutyForm({ ...dutyForm, dutyPerson: e.target.value })}
                        placeholder="请输入值班人员姓名"
                      />
                    </div>
                    <div className="mt-4">
                      <button
                        className="btn btn-primary"
                        onClick={handleDutySubmit}
                        disabled={!levelCheckResult.canStart}
                        title={!levelCheckResult.canStart ? levelCheckResult.reason : ''}
                      >
                        {!levelCheckResult.canStart ? '试泵已阻断，请先补水' : '提交登记'}
                      </button>
                      <button
                        className="btn btn-default"
                        style={{ marginLeft: 10 }}
                        onClick={() => navigate(-1)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">水压</span>
                      <span className="detail-value">{record.waterPressure || '-'} MPa</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">电源状态</span>
                      <span className="detail-value">{record.powerSupply || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">水池液位</span>
                      <span className="detail-value">
                        {record.liquidLevel || '-'} m³
                        {room && record.liquidLevel < room.minLevel && (
                          <span className="text-danger" style={{ marginLeft: 8 }}>⚠️ 过低</span>
                        )}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">值班人员</span>
                      <span className="detail-value">{record.dutyPerson || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">登记时间</span>
                      <span className="detail-value">{record.dutyDate || '-'}</span>
                    </div>
                  </div>
                )}
              </div>

              {!canEditDuty && !isNew && currentRole !== ROLES.DUTY && record.status !== TEST_STATUS.DRAFT && (
                <div className="alert alert-info">
                  <span>ℹ️</span>
                  <span>值班登记已完成，等待维保人员执行试泵</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <div className="detail-section">
                <div className="detail-section-title">试泵执行信息</div>
                {record.status === TEST_STATUS.DRAFT && (
                  <div className="alert alert-warning">
                    <span>⏳</span>
                    <span>请先完成值班登记</span>
                  </div>
                )}
                {record.status !== TEST_STATUS.DRAFT && !levelCheckResult.canStart && (
                  <div className="alert alert-error">
                    <span>🚫</span>
                    <span>{levelCheckResult.reason}，无法执行试泵</span>
                  </div>
                )}
                {canDoMaintenance && levelCheckResult.canStart ? (
                  <div>
                    <div className="form-row">
                      <div className="form-item">
                        <label className="form-label">使用水泵</label>
                        <select
                          className="form-select"
                          value={maintenanceForm.usedPump}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, usedPump: e.target.value })}
                        >
                          <option value="">请选择</option>
                          <option value="main">主泵</option>
                          <option value="backup">备泵</option>
                        </select>
                      </div>
                      <div className="form-item">
                        <label className="form-label">主备泵轮换</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                          <input
                            type="checkbox"
                            id="rotationCheck"
                            checked={maintenanceForm.rotationDone}
                            onChange={(e) => setMaintenanceForm({
                              ...maintenanceForm,
                              rotationDone: e.target.checked
                            })}
                          />
                          <label htmlFor="rotationCheck">已完成主备泵轮换</label>
                        </div>
                      </div>
                    </div>
                    <div className="form-row-3">
                      <div className="form-item">
                        <label className="form-label">测试压力 (MPa)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={maintenanceForm.testPressure}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, testPressure: e.target.value })}
                          placeholder="请输入"
                        />
                      </div>
                      <div className="form-item">
                        <label className="form-label">测试流量 (L/s)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={maintenanceForm.testFlow}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, testFlow: e.target.value })}
                          placeholder="请输入"
                        />
                      </div>
                      <div className="form-item">
                        <label className="form-label">测试时长 (分钟)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={maintenanceForm.testDuration}
                          onChange={(e) => setMaintenanceForm({ ...maintenanceForm, testDuration: e.target.value })}
                          placeholder="请输入"
                        />
                      </div>
                    </div>
                    <div className="form-item">
                      <label className="form-label">维保人员</label>
                      <input
                        type="text"
                        className="form-input"
                        value={maintenanceForm.maintenancePerson}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenancePerson: e.target.value })}
                        placeholder="请输入维保人员姓名"
                      />
                    </div>

                    <div className="detail-section">
                      <div className="detail-section-title">异常项登记</div>
                      {abnormalList.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          {abnormalList.map(item => (
                            <div key={item.id} className="abnormal-item">
                              <div className="abnormal-item-header">
                                <span className="abnormal-item-name">{item.item}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`level-tag ${getLevelClass(item.level)}`}>
                                    {item.level === 'major' ? '严重' : '一般'}
                                  </span>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeAbnormalItem(item.id)}
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                              <div className="abnormal-item-desc">{item.description}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="form-row">
                        <div className="form-item">
                          <label className="form-label">异常项名称</label>
                          <input
                            type="text"
                            className="form-input"
                            value={newAbnormal.item}
                            onChange={(e) => setNewAbnormal({ ...newAbnormal, item: e.target.value })}
                            placeholder="如：压力不足、异常噪音等"
                          />
                        </div>
                        <div className="form-item">
                          <label className="form-label">严重程度</label>
                          <select
                            className="form-select"
                            value={newAbnormal.level}
                            onChange={(e) => setNewAbnormal({ ...newAbnormal, level: e.target.value })}
                          >
                            <option value="minor">一般</option>
                            <option value="major">严重</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-item">
                        <label className="form-label">异常描述</label>
                        <textarea
                          className="form-textarea"
                          value={newAbnormal.description}
                          onChange={(e) => setNewAbnormal({ ...newAbnormal, description: e.target.value })}
                          placeholder="请详细描述异常情况"
                        />
                      </div>
                      <button className="btn btn-default" onClick={addAbnormalItem}>
                        + 添加异常项
                      </button>
                    </div>

                    <div className="mt-4">
                      <button
                        className="btn btn-primary"
                        onClick={handleMaintenanceSubmit}
                      >
                        提交试泵结果
                      </button>
                      <span className="text-muted text-sm" style={{ marginLeft: 12 }}>
                        {abnormalList.length > 0
                          ? '提交后状态为：异常（待主管处理）'
                          : '提交后状态为：待审核'
                        }
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    {record.maintenancePerson ? (
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">使用水泵</span>
                          <span className="detail-value">
                            {record.usedPump === 'main' ? '主泵' : record.usedPump === 'backup' ? '备泵' : '-'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">主备泵轮换</span>
                          <span className={`detail-value ${record.rotationDone ? 'text-success' : 'text-warning'}`}>
                            {record.rotationDone ? '已轮换' : '未轮换'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">测试压力</span>
                          <span className="detail-value">{record.testPressure || '-'} MPa</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">测试流量</span>
                          <span className="detail-value">{record.testFlow || '-'} L/s</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">测试时长</span>
                          <span className="detail-value">{record.testDuration || '-'} 分钟</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">维保人员</span>
                          <span className="detail-value">{record.maintenancePerson || '-'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">试泵时间</span>
                          <span className="detail-value">{record.maintenanceDate || '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="empty">暂无试泵数据</div>
                    )}
                  </div>
                )}
              </div>

              {!maintenanceForm.rotationDone && record.status !== TEST_STATUS.DRAFT && (
                <div className="alert alert-warning">
                  <span>⚠️</span>
                  <span>未完成主备泵轮换的记录不能提交为"合格"，将标记为异常或待主管审核</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'abnormal' && (
            <div>
              <div className="detail-section">
                <div className="detail-section-title">
                  异常项列表
                  <span className="text-sm text-muted" style={{ marginLeft: 8 }}>
                    共 {abnormalList.length} 项
                    ，已复测 {abnormalList.filter(a => a.retested).length} 项
                  </span>
                </div>
                {abnormalList.length === 0 ? (
                  <div className="empty">暂无异常项</div>
                ) : (
                  <div>
                    {abnormalList.map(item => {
                      const reminder = retestReminders.find(
                        r => r.testId === id && r.abnormalItemId === item.id && r.status === 'pending'
                      )
                      const hasOverdueReminder = reminder && isOverdue(reminder.dueDate)
                      return (
                        <div key={item.id} className={`abnormal-item ${item.retested ? 'retested' : ''}`}>
                          <div className="abnormal-item-header">
                            <div className="flex items-center gap-2">
                              <span className="abnormal-item-name">{item.item}</span>
                              <span className={`level-tag ${getLevelClass(item.level)}`}>
                                {item.level === 'major' ? '严重' : '一般'}
                              </span>
                              {hasOverdueReminder && (
                                <span className="text-danger text-sm">⚠️ 复测逾期</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {canSupervise && !item.retested && (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => openAssignModal(item)}
                                >
                                  派复测
                                </button>
                              )}
                              {canSupervise && (
                                <button
                                  className={`btn btn-sm ${item.retested ? 'btn-default' : 'btn-success'}`}
                                  onClick={() => toggleRetest(item.id)}
                                >
                                  {item.retested ? '取消复测' : '标记已复测'}
                                </button>
                              )}
                              <span className={`status-tag ${item.retested ? 'status-normal' : 'status-pending'}`}>
                                {item.retested ? '已复测' : '待复测'}
                              </span>
                            </div>
                          </div>
                          <div className="abnormal-item-desc">{item.description}</div>
                          {reminder && (
                            <div className="text-sm text-muted mt-1">
                              📋 复测负责人：{reminder.assignee} | 截止日期：
                              <span className={hasOverdueReminder ? 'text-danger' : ''}>
                                {reminder.dueDate}
                                {hasOverdueReminder && ' (已逾期)'}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {canSupervise && abnormalList.length > 0 && (
                <div className="alert alert-info">
                  <span>ℹ️</span>
                  <span>点击"派复测"分配复测任务给维保人员。所有异常项复测完成后才能关闭记录。</span>
                </div>
              )}

              {canClose && (
                <div className="mt-4">
                  <div className="form-item">
                    <label className="form-label">关闭备注</label>
                    <textarea
                      className="form-textarea"
                      value={closeForm.remark}
                      onChange={(e) => setCloseForm({ ...closeForm, remark: e.target.value })}
                      placeholder="请填写关闭备注"
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={handleClose}
                  >
                    关闭记录
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <div className="timeline">
                <div className={`timeline-item ${record.dutyPerson ? 'done' : 'pending'}`}>
                  <div className="timeline-title">值班登记</div>
                  <div className="timeline-time">
                    {record.dutyDate || '待执行'}
                  </div>
                  <div className="timeline-desc">
                    {record.dutyPerson
                      ? `由 ${record.dutyPerson} 完成登记`
                      : '物业值班人员进行水压、电源检查登记'
                    }
                  </div>
                </div>
                <div className={`timeline-item ${record.maintenancePerson ? 'done' : 'pending'}`}>
                  <div className="timeline-title">维保试泵</div>
                  <div className="timeline-time">
                    {record.maintenanceDate || '待执行'}
                  </div>
                  <div className="timeline-desc">
                    {record.maintenancePerson
                      ? `由 ${record.maintenancePerson} 执行试泵`
                      : '维保单位执行主备泵轮换试泵'
                    }
                  </div>
                </div>
                <div className={`timeline-item ${record.supervisorPerson ? 'done' : 'pending'}`}>
                  <div className="timeline-title">主管审核</div>
                  <div className="timeline-time">
                    {record.supervisorDate || '待执行'}
                  </div>
                  <div className="timeline-desc">
                    {record.supervisorPerson
                      ? `由 ${record.supervisorPerson} 审核`
                      : '消防主管审核试泵结果并关闭'
                    }
                  </div>
                </div>
                <div className={`timeline-item ${record.status === TEST_STATUS.CLOSED || record.status === TEST_STATUS.QUALIFIED ? 'done' : 'pending'}`}>
                  <div className="timeline-title">记录关闭</div>
                  <div className="timeline-time">
                    {record.status === TEST_STATUS.CLOSED || record.status === TEST_STATUS.QUALIFIED
                      ? '已完成'
                      : '待完成'
                    }
                  </div>
                  <div className="timeline-desc">
                    {record.closeRemark || '试泵记录闭环结束'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="divider" />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted">
              当前角色：{ROLE_NAMES[currentRole]}
            </div>
            <div className="flex gap-2">
              {canSupervise && record.status === TEST_STATUS.MAINTENANCE_DONE && (
                <button
                  className="btn btn-success"
                  onClick={handleSubmitQualified}
                >
                  审核通过（合格）
                </button>
              )}
              {canSupervise && record.status === TEST_STATUS.ABNORMAL && (
                <button
                  className="btn btn-warning"
                  onClick={() => setActiveTab('abnormal')}
                >
                  处理异常
                </button>
              )}
              <button
                className="btn btn-default"
                onClick={() => navigate(-1)}
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">业务规则校验</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex items-center gap-2">
              <span className={levelCheckResult.canStart ? 'text-success' : 'text-danger'}>
                {levelCheckResult.canStart ? '✅' : '❌'}
              </span>
              <span>水池液位检查：{levelCheckResult.canStart ? '正常，可试泵' : levelCheckResult.reason}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={record.rotationDone ? 'text-success' : 'text-warning'}>
                {record.rotationDone ? '✅' : '⚠️'}
              </span>
              <span>
                主备泵轮换：{record.rotationDone ? '已轮换，可提交合格' : '未轮换，不能提交合格'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={checkCanClose(currentRecord).canClose ? 'text-success' : 'text-warning'}>
                {checkCanClose(currentRecord).canClose ? '✅' : '⚠️'}
              </span>
              <span>
                异常复测检查：{checkCanClose(currentRecord).canClose ? '全部复测完成，可关闭' : '存在未复测异常，不能关闭'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {assignModalOpen && (
        <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                派复测 - {currentAssignItem?.item}
              </div>
              <button
                className="modal-close"
                onClick={() => setAssignModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label className="form-label">异常描述</label>
                <div className="text-muted">{currentAssignItem?.description}</div>
              </div>
              <div className="form-item">
                <label className="form-label">严重程度</label>
                <span className={`level-tag ${currentAssignItem?.level === 'major' ? 'level-major' : 'level-minor'}`}>
                  {currentAssignItem?.level === 'major' ? '严重' : '一般'}
                </span>
              </div>
              <div className="form-item">
                <label className="form-label">负责人</label>
                <select
                  className="form-select"
                  value={assignForm.assignee}
                  onChange={(e) => setAssignForm({ ...assignForm, assignee: e.target.value })}
                >
                  <option value="">请选择负责人</option>
                  <option value="李工">维保李工</option>
                  <option value="赵工">维保赵工</option>
                  <option value="孙工">维保孙工</option>
                </select>
              </div>
              <div className="form-item">
                <label className="form-label">截止日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={assignForm.dueDate}
                  onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-default"
                onClick={() => setAssignModalOpen(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignRetest}
              >
                确认派单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
