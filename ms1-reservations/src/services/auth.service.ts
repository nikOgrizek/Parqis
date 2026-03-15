import { UserRepository } from '../repositories/user.repository';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { RegisterDto, LoginDto, AuthResponse } from '../models/dto/auth.dto';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Validate password strength
    const passwordValidation = PasswordUtil.validateStrength(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(400, passwordValidation.message || 'Invalid password');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(data.password);

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    // Generate tokens
    const accessToken = JwtUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JwtUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.userRepository.storeRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError(403, 'Account is disabled');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    logger.info('User logged in', { userId: user.id, email: user.email });

    // Generate tokens
    const accessToken = JwtUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JwtUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.userRepository.storeRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    let payload;
    try {
      payload = JwtUtil.verifyRefreshToken(token);
    } catch (error) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await this.userRepository.findRefreshToken(token);
    if (!storedToken) {
      throw new AppError(401, 'Refresh token not found');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await this.userRepository.deleteRefreshToken(token);
      throw new AppError(401, 'Refresh token expired');
    }

    // Generate new access token
    const accessToken = JwtUtil.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return { accessToken };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await this.userRepository.deleteRefreshToken(refreshToken);
      logger.info('User logged out');
    } catch (error) {
      // Token might not exist, which is fine
      logger.warn('Logout: Refresh token not found', { error });
    }
  }

  /**
   * Clean expired refresh tokens (run periodically)
   */
  async cleanExpiredTokens(): Promise<void> {
    await this.userRepository.deleteExpiredTokens();
    logger.info('Expired refresh tokens cleaned');
  }
}
