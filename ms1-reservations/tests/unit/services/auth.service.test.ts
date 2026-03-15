import { AuthService } from '../../../src/modules/auth/application/auth.service';
import { UserRepository } from '../../../src/modules/auth/infrastructure/user.repository.prisma';
import { PasswordUtil } from '../../../src/shared/security/password.util';
import { AppError } from '../../../src/app/http/middlewares/error.middleware';
import { UserRole } from '@prisma/client';

jest.mock('../../../src/modules/auth/infrastructure/user.repository.prisma');
jest.mock('../../../src/shared/security/password.util');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    authService = new AuthService();
    mockUserRepository = (authService as any).userRepository;
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        isActive: true,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PasswordUtil.validateStrength as jest.Mock).mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      (PasswordUtil.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockUserRepository.storeRefreshToken.mockResolvedValue(undefined);

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error if password is weak', async () => {
      (PasswordUtil.validateStrength as jest.Mock).mockReturnValue({
        valid: false,
        message: 'Password too weak',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(AppError);
    });

    it('should throw error if user already exists', async () => {
      (PasswordUtil.validateStrength as jest.Mock).mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any);

      await expect(authService.register(registerDto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isActive: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.storeRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if account is disabled', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: false,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      await expect(authService.login(loginDto)).rejects.toThrow('Account is disabled');
    });
  });
});
