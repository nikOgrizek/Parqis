import { UserRepository } from '../../../src/repositories/user.repository';
import { prisma } from '../../../src/config/database';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID with vehicles', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        vehicles: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { vehicles: true },
      });
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token', async () => {
      const expiresAt = new Date();
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await userRepository.storeRefreshToken('user-123', 'token-abc', expiresAt);

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          token: 'token-abc',
          expiresAt,
        },
      });
    });
  });

  describe('getOrCreateVehicle', () => {
    it('should return existing vehicle', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        plateNumber: 'LJ-XX-123',
        userId: 'user-123',
        manufacturer: null,
        model: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(mockVehicle);

      const result = await userRepository.getOrCreateVehicle('user-123', 'LJ-XX-123');

      expect(result).toEqual(mockVehicle);
      expect(prisma.vehicle.create).not.toHaveBeenCalled();
    });

    it('should create new vehicle if not exists', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        plateNumber: 'LJ-XX-123',
        userId: 'user-123',
        manufacturer: null,
        model: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.vehicle.create as jest.Mock).mockResolvedValue(mockVehicle);

      const result = await userRepository.getOrCreateVehicle('user-123', 'LJ-XX-123');

      expect(result).toEqual(mockVehicle);
      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: {
          plateNumber: 'LJ-XX-123',
          userId: 'user-123',
        },
      });
    });
  });
});
