import { ReservationsService } from '../../../src/modules/reservations/application/reservations.service';
import { ReservationRepository } from '../../../src/modules/reservations/infrastructure/reservation.repository.prisma';
import { UserRepository } from '../../../src/modules/auth/infrastructure/user.repository.prisma';
import { KafkaEventsPublisher } from '../../../src/shared/infrastructure/messaging/kafka-events.publisher';

jest.mock('../../../src/modules/reservations/infrastructure/reservation.repository.prisma');
jest.mock('../../../src/modules/auth/infrastructure/user.repository.prisma');
jest.mock('../../../src/shared/infrastructure/messaging/kafka-events.publisher');

describe('ReservationsService', () => {
  let reservationsService: ReservationsService;
  let mockReservationRepository: jest.Mocked<ReservationRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockKafkaService: jest.Mocked<KafkaEventsPublisher>;

  beforeEach(() => {
    reservationsService = new ReservationsService();
    mockReservationRepository = (reservationsService as any).reservationRepository;
    mockUserRepository = (reservationsService as any).userRepository;
    mockKafkaService = (reservationsService as any).kafkaService;
    jest.clearAllMocks();
  });

  describe('createReservation', () => {
    const userId = 'user-123';
    const createDto = {
      parkingLotId: 'lot-123',
      plateNumber: 'LJ-XX-123',
      startTime: new Date(Date.now() + 2 * 3600000),   // 2 hours from now
      endTime: new Date(Date.now() + 4 * 3600000),     // 4 hours from now
    };

    it('should create a reservation successfully', async () => {
      const mockVehicle = { id: 'vehicle-123', plateNumber: 'LJ-XX-123' };
      const mockReservation = {
        id: 'res-123',
        userId,
        vehicleId: 'vehicle-123',
        parkingLotId: 'lot-123',
        plateNumber: 'LJ-XX-123',
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        status: 'PENDING',
        totalCost: 4,
      };

      mockReservationRepository.hasOverlap.mockResolvedValue(false);
      mockUserRepository.getOrCreateVehicle.mockResolvedValue(mockVehicle);
      mockReservationRepository.create.mockResolvedValue(mockReservation as any);
      mockKafkaService.publishReservationCreated.mockResolvedValue(undefined);

      const result = await reservationsService.createReservation(userId, createDto);

      expect(result).toEqual(mockReservation);
      expect(mockReservationRepository.create).toHaveBeenCalled();
      expect(mockKafkaService.publishReservationCreated).toHaveBeenCalled();
    });

    it('should throw error if start time is in the past', async () => {
      const pastDto = {
        ...createDto,
        startTime: new Date('2020-01-01T10:00:00Z'),
      };

      await expect(reservationsService.createReservation(userId, pastDto)).rejects.toThrow(
        'Start time cannot be in the past'
      );
    });

    it('should throw error if parking lot is fully booked', async () => {
      mockReservationRepository.hasOverlap.mockResolvedValue(true);

      await expect(reservationsService.createReservation(userId, createDto)).rejects.toThrow(
        'Parking lot is fully booked for this time slot'
      );
    });
  });

  describe('getReservation', () => {
    it('should return reservation if found and user owns it', async () => {
      const mockReservation = {
        id: 'res-123',
        userId: 'user-123',
        status: 'PENDING',
      };

      mockReservationRepository.findById.mockResolvedValue(mockReservation as any);

      const result = await reservationsService.getReservation('res-123', 'user-123');

      expect(result).toEqual(mockReservation);
    });

    it('should throw error if reservation not found', async () => {
      mockReservationRepository.findById.mockResolvedValue(null);

      await expect(reservationsService.getReservation('res-999', 'user-123')).rejects.toThrow(
        'Reservation not found'
      );
    });

    it('should throw error if user does not own reservation', async () => {
      const mockReservation = {
        id: 'res-123',
        userId: 'user-456',
        status: 'PENDING',
      };

      mockReservationRepository.findById.mockResolvedValue(mockReservation as any);

      await expect(reservationsService.getReservation('res-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', async () => {
      const mockReservation = {
        id: 'res-123',
        userId: 'user-123',
        status: 'PENDING',
      };

      const mockCancelled = {
        ...mockReservation,
        status: 'CANCELLED',
      };

      mockReservationRepository.findById.mockResolvedValue(mockReservation as any);
      mockReservationRepository.cancel.mockResolvedValue(mockCancelled as any);
      mockKafkaService.publishReservationCancelled.mockResolvedValue(undefined);

      const result = await reservationsService.cancelReservation('res-123', 'user-123');

      expect(result.status).toBe('CANCELLED');
      expect(mockKafkaService.publishReservationCancelled).toHaveBeenCalled();
    });

    it('should throw error if reservation is already cancelled', async () => {
      const mockReservation = {
        id: 'res-123',
        userId: 'user-123',
        status: 'CANCELLED',
      };

      mockReservationRepository.findById.mockResolvedValue(mockReservation as any);

      await expect(reservationsService.cancelReservation('res-123', 'user-123')).rejects.toThrow(
        'Reservation is already cancelled'
      );
    });
  });
});
