import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
  ROLES,
  pumpRooms as initialRooms,
  testRecords as initialRecords,
  retestReminders as initialReminders,
  monthlyStats as initialStats,
  TEST_STATUS,
  MONTHLY_STATUS,
  MONTHLY_STATUS_NAMES
} from '../data/mockData'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(ROLES.DUTY)
  const [pumpRooms, setPumpRooms] = useState(initialRooms)
  const [testRecords, setTestRecords] = useState(initialRecords)
  const [retestReminders, setRetestReminders] = useState(initialReminders)
  const [monthlyStats] = useState(initialStats)

  const updateTestRecord = useCallback((recordId, updates) => {
    setTestRecords(prev => prev.map(r => 
      r.id === recordId ? { ...r, ...updates } : r
    ))
  }, [])

  const addTestRecord = useCallback((record) => {
    setTestRecords(prev => [record, ...prev])
  }, [])

  const updateRetestReminder = useCallback((reminderId, updates) => {
    setRetestReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, ...updates } : r
    ))
  }, [])

  const addRetestReminder = useCallback((reminder) => {
    setRetestReminders(prev => [reminder, ...prev])
  }, [])

  const checkCanStartTest = useCallback((roomId, enteredLevel) => {
    const room = pumpRooms.find(r => r.id === roomId)
    if (!room) return { canStart: false, reason: '泵房不存在' }

    const levelToCheck = enteredLevel !== undefined && enteredLevel !== null && enteredLevel !== ''
      ? parseFloat(enteredLevel)
      : room.currentLevel

    if (levelToCheck < room.minLevel) {
      return {
        canStart: false,
        reason: `水池液位过低（当前: ${levelToCheck} m³，最低要求: ${room.minLevel} m³），请先补水`
      }
    }
    return { canStart: true, reason: '' }
  }, [pumpRooms])

  const checkCanSubmitQualified = useCallback((recordIdOrRecord) => {
    const record = typeof recordIdOrRecord === 'object'
      ? recordIdOrRecord
      : testRecords.find(r => r.id === recordIdOrRecord)
    if (!record) return { canSubmit: false, reason: '记录不存在' }
    if (!record.rotationDone) {
      return { canSubmit: false, reason: '主备泵未完成轮换，不能提交合格' }
    }
    return { canSubmit: true, reason: '' }
  }, [testRecords])

  const checkCanClose = useCallback((recordIdOrRecord) => {
    const record = typeof recordIdOrRecord === 'object'
      ? recordIdOrRecord
      : testRecords.find(r => r.id === recordIdOrRecord)
    if (!record) return { canClose: false, reason: '记录不存在' }
    const abnormalItems = record.abnormalItems || []
    const unretested = abnormalItems.filter(item => !item.retested)
    if (unretested.length > 0) {
      return { canClose: false, reason: '存在未复测异常项，不能关闭' }
    }
    return { canClose: true, reason: '' }
  }, [testRecords])

  const isOverdue = useCallback((dateStr) => {
    const dueDate = new Date(dateStr)
    const today = new Date()
    dueDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  }, [])

  const getRecordMonthlyStatus = useCallback((record) => {
    if (!record) return MONTHLY_STATUS.UNTESTED

    if (record.status === TEST_STATUS.DRAFT) {
      return MONTHLY_STATUS.UNTESTED
    }

    if (record.status === TEST_STATUS.ABNORMAL) {
      const abnormalItems = record.abnormalItems || []
      const allRetested = abnormalItems.length > 0 && abnormalItems.every(item => item.retested)
      if (allRetested) {
        return MONTHLY_STATUS.RETEST_PASSED
      }
      return MONTHLY_STATUS.ABNORMAL
    }

    if (record.status === TEST_STATUS.QUALIFIED || record.status === TEST_STATUS.CLOSED) {
      return MONTHLY_STATUS.RETEST_PASSED
    }

    return MONTHLY_STATUS.UNTESTED
  }, [])

  const getMonthlyStatsForMonth = useCallback((month) => {
    const monthRecords = testRecords.filter(r => r.month === month)
    const totalRooms = pumpRooms.length

    const statusCounts = {
      [MONTHLY_STATUS.UNTESTED]: 0,
      [MONTHLY_STATUS.ABNORMAL]: 0,
      [MONTHLY_STATUS.RETEST_PASSED]: 0,
      [MONTHLY_STATUS.OVERDUE]: 0
    }

    pumpRooms.forEach(room => {
      const record = monthRecords.find(r => r.roomId === room.id)

      if (!record) {
        statusCounts[MONTHLY_STATUS.UNTESTED]++
        return
      }

      const recordStatus = getRecordMonthlyStatus(record)

      if (recordStatus === MONTHLY_STATUS.ABNORMAL || recordStatus === MONTHLY_STATUS.UNTESTED) {
        const testDate = new Date(record.testDate)
        const monthEnd = new Date(month + '-28')
        if (testDate < monthEnd && new Date() > monthEnd) {
          statusCounts[MONTHLY_STATUS.OVERDUE]++
          return
        }
      }

      const relatedReminders = retestReminders.filter(
        r => r.testId === record.id && r.status === 'pending'
      )
      const hasOverdueReminder = relatedReminders.some(r => isOverdue(r.dueDate))
      if (hasOverdueReminder && recordStatus !== MONTHLY_STATUS.RETEST_PASSED) {
        statusCounts[MONTHLY_STATUS.OVERDUE]++
        return
      }

      statusCounts[recordStatus]++
    })

    const testedRooms = monthRecords.length
    const withRotation = monthRecords.filter(r => r.rotationDone).length
    const rotationRate = testedRooms > 0 ? Math.round((withRotation / testedRooms) * 100) : 0

    let abnormalItems = 0
    let retestedItems = 0
    monthRecords.forEach(r => {
      abnormalItems += r.abnormalItems?.length || 0
      retestedItems += (r.abnormalItems || []).filter(a => a.retested).length
    })

    return {
      month,
      totalRooms,
      statusCounts,
      testedRooms,
      withRotation,
      rotationRate,
      abnormalItems,
      retestedItems,
      pendingRetest: abnormalItems - retestedItems,
      testRate: Math.round((testedRooms / totalRooms) * 100)
    }
  }, [testRecords, pumpRooms, retestReminders, getRecordMonthlyStatus, isOverdue])

  const assignRetest = useCallback((testId, abnormalItemId, assignee, dueDate) => {
    const record = testRecords.find(r => r.id === testId)
    const abnormalItem = record?.abnormalItems?.find(a => a.id === abnormalItemId)

    if (!record || !abnormalItem) return null

    const newReminder = {
      id: `reminder-${Date.now()}`,
      testId,
      roomId: record.roomId,
      roomName: record.roomName,
      abnormalItem: abnormalItem.item,
      abnormalItemId,
      createDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'pending',
      priority: abnormalItem.level === 'major' ? 'high' : 'medium',
      assignee
    }

    addRetestReminder(newReminder)
    return newReminder
  }, [testRecords, addRetestReminder])

  const getPendingReminderCount = retestReminders.filter(r => r.status === 'pending').length

  const monthlyClosedLoopStats = useMemo(() => {
    const months = ['2026-05', '2026-04', '2026-03', '2026-02', '2026-01']
    return months.map(month => getMonthlyStatsForMonth(month))
  }, [getMonthlyStatsForMonth])

  return (
    <AppContext.Provider value={{
      currentRole,
      setCurrentRole,
      pumpRooms,
      setPumpRooms,
      testRecords,
      retestReminders,
      monthlyStats,
      updateTestRecord,
      addTestRecord,
      updateRetestReminder,
      addRetestReminder,
      checkCanStartTest,
      checkCanSubmitQualified,
      checkCanClose,
      isOverdue,
      getRecordMonthlyStatus,
      getMonthlyStatsForMonth,
      assignRetest,
      monthlyClosedLoopStats,
      pendingReminderCount: getPendingReminderCount
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
