import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { addDays, addMinutes, format, interval as dateFnsInterval, isThisMinute, set, startOfMinute } from 'date-fns'
import { ConfigService } from '@nestjs/config'
import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunset } from '@/sunrise-sunset/interfaces/sunrise-sunset.interface'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { IrrigationProgram } from './irrigation-program'
import { DeviceInterval } from '@/irrigation-programs/interfaces/device-interval.interface'
import type { UpdateIrrigationProgram } from '@/irrigation-programs/types'
import { DeviceState } from '@/enums/device-state.enum'
import { EnvironmentVariables } from '@/environment-variables'

function calculateDeviceIntervals(irrigationProgram: IrrigationProgram): DeviceInterval[] {
  const { deviceIds, simultaneousIrrigation, duration } = irrigationProgram
  return irrigationProgram.getActualStartTimes().flatMap((actualStartTime) => {
    if (simultaneousIrrigation) {
      const interval = dateFnsInterval(actualStartTime, addMinutes(actualStartTime, duration))
      return deviceIds.map((deviceId) => ({ deviceId, interval }) as DeviceInterval)
    }
    return deviceIds.map((deviceId, deviceIndex) => {
      const interval = dateFnsInterval(
        addMinutes(actualStartTime, duration * deviceIndex),
        addMinutes(actualStartTime, duration * deviceIndex + duration)
      )
      return { deviceId, interval } as DeviceInterval
    })
  })
}

function calculateNextRunDate({ wateringPeriod }: IrrigationProgram) {
  return format(addDays(Date.now(), wateringPeriod), 'yyyy-MM-dd')
}

function createDateFromTimeString(timeString: string) {
  const [hours, minutes] = timeString.split(':')
  return startOfMinute(set(Date.now(), { hours: parseInt(hours), minutes: parseInt(minutes) }))
}

@Injectable()
export class IrrigationSchedulerService {
  private readonly logger = new Logger(IrrigationSchedulerService.name)

  private readonly defaultSunriseSunset: SunriseSunset

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private irrigationProgramsService: IrrigationProgramsService,
    private makerApiService: MakerApiService,
    private sunriseSunsetService: SunriseSunsetService
  ) {
    const defaultSunrise = this.configService.get<string>('DEFAULT_SUNRISE_TIME', '06:30', { infer: true })
    const defaultSunset = this.configService.get<string>('DEFAULT_SUNSET_TIME', '18:30', { infer: true })
    this.defaultSunriseSunset = {
      sunrise: createDateFromTimeString(defaultSunrise),
      sunset: createDateFromTimeString(defaultSunset),
    }
  }

  // When the start time of a program is reached, calculate the intervals for each device for the
  // whole program.
  // Save the intervals to the database and also update the next run date in the database.
  // This means that once a program starts running, no more changes can be made to the current run.
  // When all intervals are completed, delete all intervals from the database.
  // When checking programs to see if they should run, look for intervals. If they
  // are stored in the database, that means the program is running. If there are no intervals,
  // then we need to see if the program should start now and calculate the intervals.
  @Cron(CronExpression.EVERY_MINUTE, { name: 'irrigation-scheduler', disabled: process.env.NODE_ENV === 'test' })
  async run() {
    this.logger.log('Running irrigation scheduler')
    let irrigationPrograms: IrrigationProgram[]
    const sunriseSunset = await this.sunriseSunsetService.getSunriseSunset(new Date())
    try {
      const programs = await this.irrigationProgramsService.findAll()
      irrigationPrograms = programs.map(
        (program) => new IrrigationProgram(program, sunriseSunset ?? this.defaultSunriseSunset)
      )
    } catch (error) {
      this.logger.error('Error getting irrigation programs:', error)
      return
    }

    // Get all programs that should start now
    const programsToStart = irrigationPrograms.filter(
      (program) => !program.isProgramRunning() && program.shouldProgramRunToday() && program.isProgramStartTime()
    )

    //  Calculate the intervals for each device and the next start date, then save to the database
    const updateProgramsResults = await Promise.allSettled(
      programsToStart.map(async (program) => {
        try {
          const deviceIntervals = calculateDeviceIntervals(program)
          const nextRunDate = calculateNextRunDate(program)
          await this.irrigationProgramsService.update(program.id, {
            deviceIntervals,
            nextRunDate,
          } as UpdateIrrigationProgram)
          const newProgram = program.clone()
          newProgram.deviceIntervals = deviceIntervals
          newProgram.nextRunDate = nextRunDate
          return newProgram
        } catch (error) {
          this.logger.error(
            `Error setting device intervals and next run date for irrigation program with name ${program.name} and ID ${program.id}:`,
            error
          )
          throw error
        }
      })
    )

    const currentlyRunningPrograms = irrigationPrograms.filter((program) => program.isProgramRunning())
    const updatedPrograms = updateProgramsResults
      .filter((result) => result.status === 'fulfilled')
      .map((result: PromiseFulfilledResult<IrrigationProgram>) => result.value)
    currentlyRunningPrograms.push(...updatedPrograms)

    // Create functions to turn devices on or off as needed and put the functions in an array
    const allDeviceIntervals = currentlyRunningPrograms.flatMap((program) => program.deviceIntervals ?? [])
    const deviceControlFunctions: (() => Promise<void>)[] = []
    allDeviceIntervals
      .filter(({ interval }) => isThisMinute(interval.start))
      .map(({ deviceId }) => async () => {
        try {
          await this.makerApiService.setDeviceState(deviceId, DeviceState.ON)
        } catch (error) {
          this.logger.error(`Error turning on device with ID ${deviceId}:`, error)
        }
      })
      .forEach((fn) => deviceControlFunctions.push(fn))

    allDeviceIntervals
      .filter(({ interval }) => isThisMinute(interval.end))
      .map(({ deviceId }) => async () => {
        try {
          await this.makerApiService.setDeviceState(deviceId, DeviceState.OFF)
        } catch (error) {
          this.logger.error(`Error turning off device with ID ${deviceId}:`, error)
        }
      })
      .forEach((fn) => deviceControlFunctions.push(fn))

    // Run the device control functions with a delay between each function
    const meteringInterval = parseInt(this.configService.get('SWITCH_METERING_INTERVAL', '500'))
    await deviceControlFunctions.reduce(
      (promiseChain, fn) =>
        promiseChain.then(fn).then(
          async () =>
            new Promise((resolve) => {
              setTimeout(resolve, meteringInterval)
            })
        ),
      Promise.resolve()
    )

    // Check if any programs have completed and remove the intervals from the database
    await Promise.all(
      currentlyRunningPrograms
        .filter((program) => program.areAllIntervalsCompleted())
        .map(async (program) => {
          try {
            await this.irrigationProgramsService.update(program.id, {
              deviceIntervals: null,
            } as UpdateIrrigationProgram)
          } catch (error) {
            this.logger.error(
              `Error removing device intervals for irrigation program with name ${program.name} and ID ${program.id}:`,
              error
            )
          }
        })
    )
  }
}
