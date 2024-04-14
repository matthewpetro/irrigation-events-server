const Warning = {
  MISSING_ON: 'The ON event is missing. The time shown is the OFF time.',
  MISSING_OFF: 'The OFF event is missing. The time shown is the ON time.',
  DEVICE_STATE_UNKNOWN: 'The OFF event is missing and the current device state cannot be determined.',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Warning = (typeof Warning)[keyof typeof Warning]

export { Warning }
