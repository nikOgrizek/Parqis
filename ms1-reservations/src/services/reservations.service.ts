import { ReservationRepository } from '../repositories/reservation.repository';
import { UserRepository } from '../repositories/user.repository';
import { KafkaService } from './kafka.service';
import { CreateReservationDto, ExtendReservationDto } from '../models/dto/reservation.dto';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class ReservationsService {
  private reservationRepository: ReservationRepository;
  private userRepository: UserRepository;
  private kafkaService: KafkaService;

  constructor() {
    this.reservationRepository = new ReservationRepository();
    this.userRepository = new UserRepository();
    this.kafkaService = new KafkaService();
  }

  /**
   * Create a new reservation
   */
  async createReservation(userId: string, data: CreateReservationDto): Promise<any> {
    // Validate times
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const now = new Date();

    if (startTime < now) {
      throw new AppError(400, 'Start time cannot be in the past');
    }

    if (endTime <= startTime) {
      throw new AppError(400, 'End time must be after start time');
    }

    // Check for overlapping reservations
    // Note: In real scenario, we would call MS2 to check actual spot availability
    // For now, we just check if user has overlapping reservations
    const hasOverlap = await this.reservationRepository.hasOverlap(
      data.parkingLotId,
      startTime,
      endTime
    );

    if (hasOverlap) {
      throw new AppError(409, 'Parking lot is fully booked for this time slot');
    }

    // Get or create vehicle
    const vehicle = await this.userRepository.getOrCreateVehicle(userId, data.plateNumber);

    // Calculate cost (simple: €2/hour)
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalCost = Math.ceil(hours) * 2;

    // Create reservation
    const reservation = await this.reservationRepository.create({
      userId,
      vehicleId: vehicle.id,
      parkingLotId: data.parkingLotId,
      plateNumber: data.plateNumber,
      startTime,
      endTime,
      totalCost,
    });

    logger.info('Reservation created', {
      reservationId: reservation.id,
      userId,
      plateNumber: data.plateNumber,
    });

    // Publish event to Kafka
    try {
      await this.kafkaService.publishReservationCreated(reservation);
    } catch (error) {
      logger.error('Failed to publish reservation created event', { error });
      // Don't fail the request if Kafka publish fails
    }

    return reservation;
  }

  /**
   * Get reservation by ID
   */
  async getReservation(id: string, userId?: string): Promise<any> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new AppError(404, 'Reservation not found');
    }

    // Check ownership (unless it's an internal call)
    if (userId && reservation.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return reservation;
  }

  /**
   * Get reservation by plate number (internal API)
   */
  async getReservationByPlateNumber(plateNumber: string): Promise<any> {
    const reservation = await this.reservationRepository.findActiveByPlateNumber(
      plateNumber.toUpperCase()
    );

    if (!reservation) {
      return null;
    }

    return reservation;
  }

  /**
   * Get user's reservations
   */
  async getUserReservations(userId: string): Promise<any[]> {
    return this.reservationRepository.findByUserId(userId);
  }

  /**
   * Extend reservation
   */
  async extendReservation(id: string, userId: string, data: ExtendReservationDto): Promise<any> {
    const reservation = await this.getReservation(id, userId);

    const newEndTime = new Date(data.newEndTime);

    if (newEndTime <= reservation.endTime) {
      throw new AppError(400, 'New end time must be after current end time');
    }

    // Check if extension is possible
    const hasOverlap = await this.reservationRepository.hasOverlap(
      reservation.parkingLotId,
      reservation.endTime,
      newEndTime,
      id
    );

    if (hasOverlap) {
      throw new AppError(409, 'Cannot extend: time slot is already booked');
    }

    // Update reservation
    const updated = await this.reservationRepository.extend(id, newEndTime);

    logger.info('Reservation extended', {
      reservationId: id,
      userId,
      newEndTime: newEndTime.toISOString(),
    });

    // Publish event
    try {
      await this.kafkaService.publishReservationExtended(updated);
    } catch (error) {
      logger.error('Failed to publish reservation extended event', { error });
    }

    return updated;
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(id: string, userId: string): Promise<any> {
    const reservation = await this.getReservation(id, userId);

    if (reservation.status === 'CANCELLED') {
      throw new AppError(400, 'Reservation is already cancelled');
    }

    if (reservation.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot cancel completed reservation');
    }

    if (reservation.status === 'ACTIVE') {
      throw new AppError(400, 'Cannot cancel active reservation (vehicle already entered)');
    }

    const updated = await this.reservationRepository.cancel(id);

    logger.info('Reservation cancelled', { reservationId: id, userId });

    // Publish event
    try {
      await this.kafkaService.publishReservationCancelled(updated);
    } catch (error) {
      logger.error('Failed to publish reservation cancelled event', { error });
    }

    return updated;
  }

  /**
   * Complete reservation (internal API - called when vehicle exits)
   */
  async completeReservation(id: string): Promise<any> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new AppError(404, 'Reservation not found');
    }

    const updated = await this.reservationRepository.markAsCompleted(id);

    logger.info('Reservation completed', { reservationId: id });

    // Publish event
    try {
      await this.kafkaService.publishReservationCompleted(updated);
    } catch (error) {
      logger.error('Failed to publish reservation completed event', { error });
    }

    return updated;
  }

  /**
   * Mark reservation as active (internal API - called when vehicle enters)
   */
  async activateReservation(id: string): Promise<any> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new AppError(404, 'Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new AppError(400, 'Reservation is not in pending status');
    }

    const updated = await this.reservationRepository.markAsActive(id);

    logger.info('Reservation activated', { reservationId: id });

    return updated;
  }

  /**
   * Cleanup expired reservations (run periodically)
   */
  async cleanupExpiredReservations(): Promise<number> {
    const count = await this.reservationRepository.markExpired();
    logger.info('Expired reservations marked', { count });
    return count;
  }
}
