import { IdentifiedDocument } from 'nano'

export class IrrigationProgram implements IdentifiedDocument {
  constructor(
    public _id: string,
    public duration: number,
    public wateringPeriod: number,
    public startTime: string,
    public switches: number[],
    public simultaneousIrrigation: boolean,
    public nextRunDate?: string
  ) {}
}
