import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  ROLES,
  pumpRooms as initialRooms,
  testRecords as initialRecords,
  retestReminders as initialReminders,
  monthlyStats as initialStats,
  TEST_STATUS
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

  const checkCanStartTest = useCallback((roomId) => {
    const room = pumpRooms.find(r => r.id === roomId)
    if (!room) return { canStart: false, reason: '泵房不存在' }
    if (room.currentLevel < room.minLevel) {
      return { canStart: false, reason: '水池液位过低，阻断试泵' }
    }
    return { canStart: true, reason: '' }
  }, [pumpRooms])

  const checkCanSubmitQualified = useCallback((recordIdOrRecord) => {
    const record = typeof recordIdOrRecord === 'object'
      ? recordIdOrRecord
      : testRecords.find(r => r.id === recordIdOrRecord)
    if (!record) return { canSubmit: false, reason: '记录不存在' }
    if (!record.rotationDone) {
      return { canSubmit: false, reason: '主备泵未轮换，不能提交合格' }
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
      return { canClose: false, reason: '存在异常未复测，不能关闭' }
    }
    return { canClose: true, reason: '' }
  }, [testRecords])

  const getPendingReminderCount = retestReminders.filter(r => r.status === 'pending').length

  return (
    <AppContext.Provider value={{
      currentRole,
      setCurrentRole,
      pumpRooms,
      testRecords,
      retestReminders,
      monthlyStats,
      updateTestRecord,
      addTestRecord,
      updateRetestReminder,
      checkCanStartTest,
      checkCanSubmitQualified,
      checkCanClose,
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
