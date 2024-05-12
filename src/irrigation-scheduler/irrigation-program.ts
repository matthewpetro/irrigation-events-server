import {
  addMinutes,
  isBefore,
  isEqual,
  isPast,
  isThisMinute,
  isToday,
  parseISO,
  set,
  startOfMinute,
  startOfToday,
} from 'date-fns'
import { DeviceInterval } from '@/irrigation-programs/interfaces/device-interval.interface'
import { IrrigationProgram as IrrigationProgramInterface } from '@/irrigation-programs/interfaces/irrigation-program.interface'
import { SunriseSunset } from '@/sunrise-sunset/interfaces/sunrise-sunset.interface'
import { DeviceId } from '@/types'

export class IrrigationProgram implements IrrigationProgramInterface {
  id: string

  name: string

  duration: number

  wateringPeriod: number

  startTimes: string[]

  deviceIds: DeviceId[]

  simultaneousIrrigation: boolean

  nextRunDate?: string | null

  deviceIntervals?: DeviceInterval[] | null

  private readonly sunriseSunset: SunriseSunset

  constructor(irrigationProgram: IrrigationProgramInterface, sunriseSunset: SunriseSunset) {
    this.id = irrigationProgram.id
    this.name = irrigationProgram.name
    this.duration = irrigationProgram.duration
    this.wateringPeriod = irrigationProgram.wateringPeriod
    this.startTimes = [...irrigationProgram.startTimes]
    this.deviceIds = [...irrigationProgram.deviceIds]
    this.simultaneousIrrigation = irrigationProgram.simultaneousIrrigation
    this.nextRunDate = irrigationProgram.nextRunDate
    this.deviceIntervals = irrigationProgram.deviceIntervals ? [...irrigationProgram.deviceIntervals] : null
    this.sunriseSunset = sunriseSunset
  }

  clone() {
    return new IrrigationProgram(this, this.sunriseSunset)
  }

  private getActualStartTime(startTime: string) {
    const sunriseSunsetRegex = /^(?<sunriseOrSunset>sunset|sunrise)(?<offset>[+-]?\d+)?$/
    const matches = startTime.match(sunriseSunsetRegex)
    let actualStartTime: Date
    if (matches) {
      // If the start time is a sunrise or sunset, then we need to determine the actual time
      // based on the sunrise or sunset and offset.
      const { sunriseOrSunset, offset } = matches.groups!
      const realTimeOfDay = this.sunriseSunset[sunriseOrSunset] as Date
      actualStartTime = offset ? addMinutes(realTimeOfDay, parseInt(offset)) : realTimeOfDay
    } else {
      // Otherwise, we just need to turn the start time into a Date object
      const [hours, minutes] = startTime.split(':')
      actualStartTime = set(Date.now(), { hours: parseInt(hours), minutes: parseInt(minutes) })
    }
    return startOfMinute(actualStartTime)
  }

  getActualStartTimes() {
    return this.startTimes
      .map((startTime) => this.getActualStartTime(startTime))
      .sort((a, b) => a.getTime() - b.getTime())
  }

  // A program should run today if it has no next run date, or if the next run date is today or in the past.
  // Next run dates in the past shouldn't happen, but in case of a bug or weird edge case, this will handle it.
  shouldProgramRunToday() {
    return (
      !this.nextRunDate || isToday(parseISO(this.nextRunDate)) || isBefore(parseISO(this.nextRunDate), startOfToday())
    )
  }

  isProgramStartTime() {
    return isThisMinute(this.getActualStartTimes()[0])
  }

  isProgramRunning() {
    return !!this.deviceIntervals
  }

  areAllIntervalsCompleted() {
    if (!this.deviceIntervals) {
      return false
    }
    const lastInterval = this.deviceIntervals[this.deviceIntervals.length - 1]
    return isPast(lastInterval.interval.end) || isEqual(lastInterval.interval.end, Date.now())
  }
}
