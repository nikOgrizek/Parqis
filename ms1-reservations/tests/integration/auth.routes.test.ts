import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from '../../src/routes/auth.routes';
import { AuthService } from '../../src/services/auth.service';
import { AppError } from '../../src/middleware/error.middleware';

const app: Application = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Error handler matching production setup
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

const mockAuthResult = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
  },
};

describe('Auth Routes Integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should validate password minimum length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should validate password complexity (no uppercase)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'alllowercase1',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should register a new user and return 201 with tokens', async () => {
      jest.spyOn(AuthService.prototype, 'register').mockResolvedValueOnce(mockAuthResult);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 409 if email already exists', async () => {
      jest.spyOn(AuthService.prototype, 'register').mockRejectedValueOnce(
        new AppError(409, 'User with this email already exists')
      );

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password',
        });

      expect(response.status).toBe(400);
    });

    it('should login successfully and return 200 with tokens', async () => {
      jest.spyOn(AuthService.prototype, 'login').mockResolvedValueOnce(mockAuthResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('id');
    });

    it('should return 401 for invalid credentials', async () => {
      jest.spyOn(AuthService.prototype, 'login').mockRejectedValueOnce(
        new AppError(401, 'Invalid credentials')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass1' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 403 for a disabled account', async () => {
      jest.spyOn(AuthService.prototype, 'login').mockRejectedValueOnce(
        new AppError(403, 'Account is disabled')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'disabled@example.com', password: 'Password123' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Account is disabled');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should require refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return new access token on valid refresh', async () => {
      jest.spyOn(AuthService.prototype, 'refreshToken').mockResolvedValueOnce({
        accessToken: 'new-access-token',
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken', 'new-access-token');
    });

    it('should return 401 for expired refresh token', async () => {
      jest.spyOn(AuthService.prototype, 'refreshToken').mockRejectedValueOnce(
        new AppError(401, 'Refresh token expired')
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'expired-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should require refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should logout successfully', async () => {
      jest.spyOn(AuthService.prototype, 'logout').mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});
