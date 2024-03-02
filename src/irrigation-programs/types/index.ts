import { IrrigationProgram } from '../interfaces/irrigation-program.interface'

export type CreateIrrigationProgram = Omit<IrrigationProgram, 'id'>

export type UpdateIrrigationProgram = Partial<Omit<IrrigationProgram, 'id'>>
