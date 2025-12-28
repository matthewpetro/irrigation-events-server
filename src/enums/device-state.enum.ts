const DeviceState = {
  ON: 'on',
  OFF: 'off',
} as const

type DeviceState = (typeof DeviceState)[keyof typeof DeviceState]

export { DeviceState }
