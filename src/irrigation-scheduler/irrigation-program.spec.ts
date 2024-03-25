import { set, format, subDays, addDays, addHours, interval } from 'date-fns'
import { IrrigationProgram } from './irrigation-program'

describe('IrrigationProgram', () => {
  let irrigationProgram: IrrigationProgram

  beforeEach(() => {
    irrigationProgram = new IrrigationProgram(
      {
        id: '1',
        name: 'Test Program',
        duration: 10,
        wateringPeriod: 1,
        startTime: '07:00',
        deviceIds: [1, 2],
        simultaneousIrrigation: false,
        nextRunDate: null,
        deviceIntervals: null,
      },
      {
        sunrise: set(Date.now(), { hours: 6, minutes: 0 }),
        sunset: set(Date.now(), { hours: 17, minutes: 0 }),
      }
    )
  })

  describe('getActualStartTime', () => {
    it('should return the start time as a Date object', () => {
      expect(irrigationProgram.getActualStartTime()).toEqual(
        set(Date.now(), { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 })
      )
    })

    it('should return the start time as a Date object with an offset', () => {
      irrigationProgram.startTime = 'sunrise+30'
      expect(irrigationProgram.getActualStartTime()).toEqual(
        set(Date.now(), { hours: 6, minutes: 30, seconds: 0, milliseconds: 0 })
      )
    })

    it('should return the start time as a Date object with a positive offset', () => {
      irrigationProgram.startTime = 'sunset-15'
      expect(irrigationProgram.getActualStartTime()).toEqual(
        set(Date.now(), { hours: 16, minutes: 45, seconds: 0, milliseconds: 0 })
      )
    })

    it('should return the start time as a Date object with no offset', () => {
      irrigationProgram.startTime = 'sunrise'
      expect(irrigationProgram.getActualStartTime()).toEqual(
        set(Date.now(), { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 })
      )
    })
  })

  describe('shouldProgramRunToday', () => {
    it('should return true if the next run date is null', () => {
      irrigationProgram.nextRunDate = null
      expect(irrigationProgram.shouldProgramRunToday()).toBe(true)
    })

    it('should return true if the next run date is today', () => {
      irrigationProgram.nextRunDate = format(Date.now(), 'yyyy-MM-dd')
      expect(irrigationProgram.shouldProgramRunToday()).toBe(true)
    })

    it('should return true if the next run date is in the past', () => {
      irrigationProgram.nextRunDate = format(subDays(Date.now(), 1), 'yyyy-MM-dd')
      expect(irrigationProgram.shouldProgramRunToday()).toBe(true)
    })

    it('should return false if the next run date is in the future', () => {
      irrigationProgram.nextRunDate = format(addDays(Date.now(), 1), 'yyyy-MM-dd')
      expect(irrigationProgram.shouldProgramRunToday()).toBe(false)
    })
  })

  describe('isProgramStartTime', () => {
    it('should return true if the current time is the start time', () => {
      irrigationProgram.startTime = format(Date.now(), 'HH:mm')
      expect(irrigationProgram.isProgramStartTime()).toBe(true)
    })

    it('should return false if the current time is not the start time', () => {
      irrigationProgram.startTime = format(addHours(Date.now(), 1), 'HH:mm')
      expect(irrigationProgram.isProgramStartTime()).toBe(false)
    })
  })

  describe('isProgramRunning', () => {
    it('should return false if there are no device intervals', () => {
      expect(irrigationProgram.isProgramRunning()).toBe(false)
    })

    it('should return true if there are device intervals', () => {
      irrigationProgram.deviceIntervals = [{ deviceId: 1, interval: interval(Date.now(), Date.now() + 10000) }]
      expect(irrigationProgram.isProgramRunning()).toBe(true)
    })
  })
})
