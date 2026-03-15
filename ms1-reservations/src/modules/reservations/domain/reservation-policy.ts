import { AppError } from '../../../app/http/middlewares/error.middleware';

export const validateReservationTimes = (startTime: Date, endTime: Date): void => {
  const now = new Date();

  if (startTime < now) {
    throw new AppError(400, 'Start time cannot be in the past');
  }

  if (endTime <= startTime) {
    throw new AppError(400, 'End time must be after start time');
  }
};

export const validateExtensionTime = (currentEndTime: Date, newEndTime: Date): void => {
  if (newEndTime <= currentEndTime) {
    throw new AppError(400, 'New end time must be after current end time');
  }
};
