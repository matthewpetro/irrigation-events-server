import { DeviceId } from '@/types'
import { DeviceInterval } from '../interfaces/device-interval.interface'

export class IrrigationProgramEntity {
  constructor(
    public readonly name: string,
    public readonly duration: number,
    public readonly wateringPeriod: number,
    public readonly startTimes: string[],
    public readonly deviceIds: DeviceId[],
    public readonly simultaneousIrrigation: boolean,
    public readonly nextRunDate?: string | null,
    public readonly deviceIntervals?: DeviceInterval[] | null
  ) {}
}
