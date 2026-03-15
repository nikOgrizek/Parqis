import request from 'supertest';
import express, { Application } from 'express';
import reservationsRoutes from '../../src/modules/reservations/api/reservations.routes';
import { JwtUtil } from '../../src/shared/security/jwt.util';
import { ReservationsService } from '../../src/modules/reservations/application/reservations.service';
import { AppError } from '../../src/app/http/middlewares/error.middleware';

const app: Application = express();
app.use(express.json());
app.use('/api/reservations', reservationsRoutes);

// Error handler matching production setup
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

const USER_ID = 'test-user-123';
const OTHER_USER_ID = 'other-user-456';
const VALID_LOT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_RES_ID = '123e4567-e89b-12d3-a456-426614174001';

// Times safely in the future so Joi min('now') passes
const futureStart = new Date(Date.now() + 2 * 3600000).toISOString();
const futureEnd = new Date(Date.now() + 4 * 3600000).toISOString();

const mockReservation = {
  id: VALID_RES_ID,
  userId: USER_ID,
  vehicleId: 'vehicle-123',
  parkingLotId: VALID_LOT_ID,
  plateNumber: 'LJ-XX-123',
  startTime: new Date(futureStart),
  endTime: new Date(futureEnd),
  status: 'PENDING',
  totalCost: 4,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Reservations Routes Integration', () => {
  let authToken: string;
  let otherUserToken: string;

  beforeAll(() => {
    authToken = JwtUtil.generateAccessToken({
      userId: USER_ID,
      email: 'test@example.com',
      role: 'USER',
    });
    otherUserToken = JwtUtil.generateAccessToken({
      userId: OTHER_USER_ID,
      email: 'other@example.com',
      role: 'USER',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/reservations', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .send({
          parkingLotId: VALID_LOT_ID,
          plateNumber: 'LJ-XX-123',
          startTime: futureStart,
          endTime: futureEnd,
        });

      expect(response.status).toBe(401);
    });

    it('should validate plate number format', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parkingLotId: VALID_LOT_ID,
          plateNumber: 'INVALID',
          startTime: futureStart,
          endTime: futureEnd,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate UUID format for parkingLotId', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parkingLotId: 'invalid-uuid',
          plateNumber: 'LJ-XX-123',
          startTime: futureStart,
          endTime: futureEnd,
        });

      expect(response.status).toBe(400);
    });

    it('should validate time range (endTime before startTime)', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parkingLotId: VALID_LOT_ID,
          plateNumber: 'LJ-XX-123',
          startTime: futureStart,
          endTime: new Date(Date.now() + 3600000).toISOString(), // only 1h ahead, before startTime
        });

      expect(response.status).toBe(400);
    });

    it('should create a reservation and return 201', async () => {
      jest.spyOn(ReservationsService.prototype, 'createReservation').mockResolvedValueOnce(mockReservation as any);

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parkingLotId: VALID_LOT_ID,
          plateNumber: 'LJ-XX-123',
          startTime: futureStart,
          endTime: futureEnd,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Reservation created successfully');
      expect(response.body.data.id).toBe(VALID_RES_ID);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should return 409 if parking lot is fully booked', async () => {
      jest.spyOn(ReservationsService.prototype, 'createReservation').mockRejectedValueOnce(
        new AppError(409, 'Parking lot is fully booked for this time slot')
      );

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parkingLotId: VALID_LOT_ID,
          plateNumber: 'LJ-XX-123',
          startTime: futureStart,
          endTime: futureEnd,
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('fully booked');
    });
  });

  describe('GET /api/reservations/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/reservations/${VALID_RES_ID}`);

      expect(response.status).toBe(401);
    });

    it('should return reservation for the owner', async () => {
      jest.spyOn(ReservationsService.prototype, 'getReservation').mockResolvedValueOnce(mockReservation as any);

      const response = await request(app)
        .get(`/api/reservations/${VALID_RES_ID}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(VALID_RES_ID);
      expect(response.body.data.plateNumber).toBe('LJ-XX-123');
    });

    it('should return 403 when non-owner accesses the reservation', async () => {
      jest.spyOn(ReservationsService.prototype, 'getReservation').mockRejectedValueOnce(
        new AppError(403, 'Access denied')
      );

      const response = await request(app)
        .get(`/api/reservations/${VALID_RES_ID}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for a non-existent reservation', async () => {
      jest.spyOn(ReservationsService.prototype, 'getReservation').mockRejectedValueOnce(
        new AppError(404, 'Reservation not found')
      );

      const response = await request(app)
        .get(`/api/reservations/${VALID_RES_ID}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reservations/plate/:plateNumber', () => {
    it('should require API key', async () => {
      const response = await request(app)
        .get('/api/reservations/plate/LJ-XX-123');

      expect(response.status).toBe(401);
    });

    it('should accept valid API key', async () => {
      const response = await request(app)
        .get('/api/reservations/plate/LJ-XX-123')
        .set('X-API-Key', 'test-internal-api-key');

      // Will fail at service level since we're mocked, but should pass auth
      expect(response.status).not.toBe(401);
    });

    it('should return active reservation for a plate number', async () => {
      jest.spyOn(ReservationsService.prototype, 'getReservationByPlateNumber').mockResolvedValueOnce(mockReservation as any);

      const response = await request(app)
        .get('/api/reservations/plate/LJ-XX-123')
        .set('X-API-Key', 'test-internal-api-key');

      expect(response.status).toBe(200);
      expect(response.body.data.plateNumber).toBe('LJ-XX-123');
    });

    it('should return 404 when no active reservation found for plate', async () => {
      jest.spyOn(ReservationsService.prototype, 'getReservationByPlateNumber').mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/reservations/plate/LJ-ZZ-999')
        .set('X-API-Key', 'test-internal-api-key');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reservations/user/:userId', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/reservations/user/${USER_ID}`);

      expect(response.status).toBe(401);
    });

    it('should return all reservations for the owner', async () => {
      jest.spyOn(ReservationsService.prototype, 'getUserReservations').mockResolvedValueOnce([mockReservation] as any);

      const response = await request(app)
        .get(`/api/reservations/user/${USER_ID}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it('should return 403 when accessing another user\'s reservations', async () => {
      const response = await request(app)
        .get(`/api/reservations/user/${USER_ID}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/reservations/:id/extend', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/reservations/${VALID_RES_ID}/extend`)
        .send({ newEndTime: futureEnd });

      expect(response.status).toBe(401);
    });

    it('should validate newEndTime is present', async () => {
      const response = await request(app)
        .put(`/api/reservations/${VALID_RES_ID}/extend`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should extend reservation and return 200', async () => {
      const newEnd = new Date(Date.now() + 6 * 3600000).toISOString();
      jest.spyOn(ReservationsService.prototype, 'extendReservation').mockResolvedValueOnce({
        ...mockReservation,
        endTime: new Date(newEnd),
      } as any);

      const response = await request(app)
        .put(`/api/reservations/${VALID_RES_ID}/extend`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newEndTime: newEnd });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reservation extended successfully');
    });
  });

  describe('DELETE /api/reservations/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/reservations/${VALID_RES_ID}`);

      expect(response.status).toBe(401);
    });

    it('should cancel reservation and return 200', async () => {
      jest.spyOn(ReservationsService.prototype, 'cancelReservation').mockResolvedValueOnce({
        ...mockReservation,
        status: 'CANCELLED',
      } as any);

      const response = await request(app)
        .delete(`/api/reservations/${VALID_RES_ID}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reservation cancelled successfully');
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should return 404 if reservation to cancel does not exist', async () => {
      jest.spyOn(ReservationsService.prototype, 'cancelReservation').mockRejectedValueOnce(
        new AppError(404, 'Reservation not found')
      );

      const response = await request(app)
        .delete(`/api/reservations/${VALID_RES_ID}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/reservations/:id/complete', () => {
    it('should require API key', async () => {
      const response = await request(app)
        .post(`/api/reservations/${VALID_RES_ID}/complete`);

      expect(response.status).toBe(401);
    });

    it('should complete reservation with valid API key', async () => {
      jest.spyOn(ReservationsService.prototype, 'completeReservation').mockResolvedValueOnce({
        ...mockReservation,
        status: 'COMPLETED',
      } as any);

      const response = await request(app)
        .post(`/api/reservations/${VALID_RES_ID}/complete`)
        .set('X-API-Key', 'test-internal-api-key');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reservation completed successfully');
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });
});
