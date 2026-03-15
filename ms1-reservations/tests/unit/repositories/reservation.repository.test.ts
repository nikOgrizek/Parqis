import { ReservationRepository } from '../../../src/repositories/reservation.repository';
import { prisma } from '../../../src/config/database';
import { ReservationStatus } from '@prisma/client';

describe('ReservationRepository', () => {
  let reservationRepository: ReservationRepository;

  beforeEach(() => {
    reservationRepository = new ReservationRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new reservation', async () => {
      const mockReservation = {
        id: 'res-123',
        userId: 'user-123',
        vehicleId: 'vehicle-123',
        parkingLotId: 'lot-123',
        spotId: null,
        plateNumber: 'LJ-XX-123',
        startTime: new Date('2026-03-10T10:00:00Z'),
        endTime: new Date('2026-03-10T12:00:00Z'),
        status: ReservationStatus.PENDING,
        totalCost: 4,
        actualEntryTime: null,
        actualExitTime: null,
        exitWindowEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        vehicle: {
          id: 'vehicle-123',
          plateNumber: 'LJ-XX-123',
        },
      };

      (prisma.reservation.create as jest.Mock).mockResolvedValue(mockReservation);

      const result = await reservationRepository.create({
        userId: 'user-123',
        vehicleId: 'vehicle-123',
        parkingLotId: 'lot-123',
        plateNumber: 'LJ-XX-123',
        startTime: new Date('2026-03-10T10:00:00Z'),
        endTime: new Date('2026-03-10T12:00:00Z'),
        totalCost: 4,
      });

      expect(result).toEqual(mockReservation);
      expect(prisma.reservation.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find reservation by ID', async () => {
      const mockReservation = {
        id: 'res-123',
        userId: 'user-123',
        status: ReservationStatus.PENDING,
      };

      (prisma.reservation.findUnique as jest.Mock).mockResolvedValue(mockReservation);

      const result = await reservationRepository.findById('res-123');

      expect(result).toEqual(mockReservation);
      expect(prisma.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: 'res-123' },
        include: expect.any(Object),
      });
    });
  });

  describe('findActiveByPlateNumber', () => {
    it('should find active reservation by plate number', async () => {
      const mockReservation = {
        id: 'res-123',
        plateNumber: 'LJ-XX-123',
        status: ReservationStatus.PENDING,
        endTime: new Date('2026-03-11T10:00:00Z'),
      };

      (prisma.reservation.findFirst as jest.Mock).mockResolvedValue(mockReservation);

      const result = await reservationRepository.findActiveByPlateNumber('LJ-XX-123');

      expect(result).toEqual(mockReservation);
      expect(prisma.reservation.findFirst).toHaveBeenCalled();
    });

    it('should return null if no active reservation found', async () => {
      (prisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await reservationRepository.findActiveByPlateNumber('LJ-XX-999');

      expect(result).toBeNull();
    });
  });

  describe('markAsActive', () => {
    it('should mark reservation as active', async () => {
      const mockReservation = {
        id: 'res-123',
        status: ReservationStatus.ACTIVE,
        actualEntryTime: new Date(),
      };

      (prisma.reservation.update as jest.Mock).mockResolvedValue(mockReservation);

      const result = await reservationRepository.markAsActive('res-123');

      expect(result.status).toBe(ReservationStatus.ACTIVE);
      expect(result.actualEntryTime).toBeDefined();
    });
  });

  describe('markAsCompleted', () => {
    it('should mark reservation as completed with exit window', async () => {
      const mockReservation = {
        id: 'res-123',
        status: ReservationStatus.COMPLETED,
        actualExitTime: new Date(),
        exitWindowEnd: new Date(),
      };

      (prisma.reservation.update as jest.Mock).mockResolvedValue(mockReservation);

      const result = await reservationRepository.markAsCompleted('res-123');

      expect(result.status).toBe(ReservationStatus.COMPLETED);
      expect(result.actualExitTime).toBeDefined();
      expect(result.exitWindowEnd).toBeDefined();
    });
  });

  describe('hasOverlap', () => {
    it('should return true if there is an overlap', async () => {
      (prisma.reservation.count as jest.Mock).mockResolvedValue(1);

      const result = await reservationRepository.hasOverlap(
        'lot-123',
        new Date('2026-03-10T10:00:00Z'),
        new Date('2026-03-10T12:00:00Z')
      );

      expect(result).toBe(true);
    });

    it('should return false if there is no overlap', async () => {
      (prisma.reservation.count as jest.Mock).mockResolvedValue(0);

      const result = await reservationRepository.hasOverlap(
        'lot-123',
        new Date('2026-03-10T10:00:00Z'),
        new Date('2026-03-10T12:00:00Z')
      );

      expect(result).toBe(false);
    });
  });

  describe('markExpired', () => {
    it('should mark expired reservations', async () => {
      (prisma.reservation.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const count = await reservationRepository.markExpired();

      expect(count).toBe(5);
      expect(prisma.reservation.updateMany).toHaveBeenCalled();
    });
  });
});
