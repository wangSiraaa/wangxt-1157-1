export const ROLES = {
  DUTY: 'duty',
  MAINTENANCE: 'maintenance',
  SUPERVISOR: 'supervisor'
}

export const ROLE_NAMES = {
  [ROLES.DUTY]: '物业值班',
  [ROLES.MAINTENANCE]: '维保单位',
  [ROLES.SUPERVISOR]: '消防主管'
}

export const PUMP_STATUS = {
  NORMAL: 'normal',
  ABNORMAL: 'abnormal',
  PENDING: 'pending',
  CLOSED: 'closed'
}

export const PUMP_STATUS_NAMES = {
  [PUMP_STATUS.NORMAL]: '正常',
  [PUMP_STATUS.ABNORMAL]: '异常',
  [PUMP_STATUS.PENDING]: '待复测',
  [PUMP_STATUS.CLOSED]: '已关闭'
}

export const MONTHLY_STATUS = {
  UNTESTED: 'untested',
  ABNORMAL: 'abnormal',
  RETEST_PASSED: 'retest_passed',
  OVERDUE: 'overdue'
}

export const MONTHLY_STATUS_NAMES = {
  [MONTHLY_STATUS.UNTESTED]: '未试',
  [MONTHLY_STATUS.ABNORMAL]: '异常',
  [MONTHLY_STATUS.RETEST_PASSED]: '复测通过',
  [MONTHLY_STATUS.OVERDUE]: '逾期'
}

export const MONTHLY_STATUS_COLORS = {
  [MONTHLY_STATUS.UNTESTED]: '#8c8c8c',
  [MONTHLY_STATUS.ABNORMAL]: '#ff4d4f',
  [MONTHLY_STATUS.RETEST_PASSED]: '#52c41a',
  [MONTHLY_STATUS.OVERDUE]: '#fa8c16'
}

export const TEST_STATUS = {
  DRAFT: 'draft',
  DUTY_DONE: 'duty_done',
  MAINTENANCE_DONE: 'maintenance_done',
  QUALIFIED: 'qualified',
  ABNORMAL: 'abnormal',
  CLOSED: 'closed'
}

export const TEST_STATUS_NAMES = {
  [TEST_STATUS.DRAFT]: '待登记',
  [TEST_STATUS.DUTY_DONE]: '待试泵',
  [TEST_STATUS.MAINTENANCE_DONE]: '待审核',
  [TEST_STATUS.QUALIFIED]: '合格',
  [TEST_STATUS.ABNORMAL]: '异常',
  [TEST_STATUS.CLOSED]: '已关闭'
}

export const pumpRooms = [
  {
    id: 'room-001',
    name: '1号消防泵房',
    location: 'A座地下一层',
    mainPump: '主泵-01',
    backupPump: '备泵-01',
    tankCapacity: 500,
    currentLevel: 420,
    minLevel: 150,
    lastTestDate: '2026-05-15',
    status: PUMP_STATUS.NORMAL,
    lastRotationDate: '2026-05-15',
    lastUsedPump: 'main'
  },
  {
    id: 'room-002',
    name: '2号消防泵房',
    location: 'B座地下二层',
    mainPump: '主泵-02',
    backupPump: '备泵-02',
    tankCapacity: 600,
    currentLevel: 380,
    minLevel: 180,
    lastTestDate: '2026-05-20',
    status: PUMP_STATUS.PENDING,
    lastRotationDate: '2026-04-20',
    lastUsedPump: 'main'
  },
  {
    id: 'room-003',
    name: '3号消防泵房',
    location: 'C座地下一层',
    mainPump: '主泵-03',
    backupPump: '备泵-03',
    tankCapacity: 450,
    currentLevel: 120,
    minLevel: 150,
    lastTestDate: '2026-05-10',
    status: PUMP_STATUS.ABNORMAL,
    lastRotationDate: '2026-05-10',
    lastUsedPump: 'backup'
  },
  {
    id: 'room-004',
    name: '4号消防泵房',
    location: 'D座地下三层',
    mainPump: '主泵-04',
    backupPump: '备泵-04',
    tankCapacity: 550,
    currentLevel: 500,
    minLevel: 160,
    lastTestDate: '2026-05-25',
    status: PUMP_STATUS.NORMAL,
    lastRotationDate: '2026-05-25',
    lastUsedPump: 'backup'
  }
]

export const testRecords = [
  {
    id: 'test-001',
    roomId: 'room-001',
    roomName: '1号消防泵房',
    month: '2026-05',
    testDate: '2026-05-15',
    status: TEST_STATUS.QUALIFIED,
    dutyPerson: '张三',
    dutyDate: '2026-05-15 08:30',
    waterPressure: 0.85,
    powerSupply: '正常',
    liquidLevel: 420,
    maintenancePerson: '李工',
    maintenanceDate: '2026-05-15 09:00',
    usedPump: 'main',
    rotationDone: true,
    testPressure: 0.82,
    testFlow: 120,
    testDuration: 30,
    abnormalItems: [],
    supervisorPerson: '王主管',
    supervisorDate: '2026-05-15 14:00',
    closeRemark: '试泵正常，合格关闭'
  },
  {
    id: 'test-002',
    roomId: 'room-002',
    roomName: '2号消防泵房',
    month: '2026-05',
    testDate: '2026-05-20',
    status: TEST_STATUS.ABNORMAL,
    dutyPerson: '李四',
    dutyDate: '2026-05-20 08:00',
    waterPressure: 0.75,
    powerSupply: '正常',
    liquidLevel: 380,
    maintenancePerson: '赵工',
    maintenanceDate: '2026-05-20 09:30',
    usedPump: 'main',
    rotationDone: false,
    testPressure: 0.68,
    testFlow: 95,
    testDuration: 20,
    abnormalItems: [
      { id: 'ab-001', item: '压力不足', description: '测试压力低于标准值0.7MPa', level: 'major', retested: false },
      { id: 'ab-002', item: '流量异常', description: '流量偏低，需检查管路', level: 'minor', retested: false }
    ],
    supervisorPerson: '',
    supervisorDate: '',
    closeRemark: ''
  },
  {
    id: 'test-003',
    roomId: 'room-003',
    roomName: '3号消防泵房',
    month: '2026-05',
    testDate: '2026-05-10',
    status: TEST_STATUS.MAINTENANCE_DONE,
    dutyPerson: '王五',
    dutyDate: '2026-05-10 07:30',
    waterPressure: 0.80,
    powerSupply: '正常',
    liquidLevel: 120,
    maintenancePerson: '孙工',
    maintenanceDate: '2026-05-10 08:45',
    usedPump: 'backup',
    rotationDone: true,
    testPressure: 0.78,
    testFlow: 110,
    testDuration: 25,
    abnormalItems: [
      { id: 'ab-003', item: '异常噪音', description: '主泵运行时有异常噪音', level: 'minor', retested: true }
    ],
    supervisorPerson: '',
    supervisorDate: '',
    closeRemark: ''
  },
  {
    id: 'test-004',
    roomId: 'room-004',
    roomName: '4号消防泵房',
    month: '2026-05',
    testDate: '2026-05-25',
    status: TEST_STATUS.DUTY_DONE,
    dutyPerson: '赵六',
    dutyDate: '2026-05-25 09:00',
    waterPressure: 0.90,
    powerSupply: '正常',
    liquidLevel: 500,
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
  },
  {
    id: 'test-005',
    roomId: 'room-001',
    roomName: '1号消防泵房',
    month: '2026-04',
    testDate: '2026-04-18',
    status: TEST_STATUS.QUALIFIED,
    dutyPerson: '张三',
    dutyDate: '2026-04-18 08:00',
    waterPressure: 0.88,
    powerSupply: '正常',
    liquidLevel: 450,
    maintenancePerson: '李工',
    maintenanceDate: '2026-04-18 09:00',
    usedPump: 'backup',
    rotationDone: true,
    testPressure: 0.85,
    testFlow: 125,
    testDuration: 30,
    abnormalItems: [],
    supervisorPerson: '王主管',
    supervisorDate: '2026-04-18 15:00',
    closeRemark: '试泵合格'
  }
]

export const retestReminders = [
  {
    id: 'reminder-001',
    testId: 'test-002',
    roomId: 'room-002',
    roomName: '2号消防泵房',
    abnormalItem: '压力不足',
    createDate: '2026-05-20',
    dueDate: '2026-05-27',
    status: 'pending',
    priority: 'high',
    assignee: '赵工'
  },
  {
    id: 'reminder-002',
    testId: 'test-002',
    roomId: 'room-002',
    roomName: '2号消防泵房',
    abnormalItem: '流量异常',
    createDate: '2026-05-20',
    dueDate: '2026-05-27',
    status: 'pending',
    priority: 'medium',
    assignee: '赵工'
  }
]

export const monthlyStats = {
  totalRooms: 4,
  testedRooms: 3,
  qualifiedRooms: 1,
  abnormalRooms: 2,
  pendingRooms: 1,
  abnormalItems: 3,
  retestedItems: 1,
  pendingRetestItems: 2,
  rotationRate: 75,
  details: [
    { month: '2026-01', total: 4, tested: 4, qualified: 4, abnormal: 0 },
    { month: '2026-02', total: 4, tested: 4, qualified: 3, abnormal: 1 },
    { month: '2026-03', total: 4, tested: 4, qualified: 4, abnormal: 0 },
    { month: '2026-04', total: 4, tested: 4, qualified: 4, abnormal: 0 },
    { month: '2026-05', total: 4, tested: 3, qualified: 1, abnormal: 2 }
  ]
}
