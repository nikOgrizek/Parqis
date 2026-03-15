export interface CreateReservationDto {
  parkingLotId: string;
  plateNumber: string;
  startTime: Date | string;
  endTime: Date | string;
}

export interface UpdateReservationDto {
  endTime?: Date | string;
  status?: string;
}

export interface ExtendReservationDto {
  newEndTime: Date | string;
}

export interface ReservationResponseDto {
  id: string;
  userId: string;
  parkingLotId: string;
  spotId?: string;
  plateNumber: string;
  startTime: Date;
  endTime: Date;
  status: string;
  totalCost: number;
  actualEntryTime?: Date;
  actualExitTime?: Date;
  exitWindowEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
