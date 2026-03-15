import { LoginDto, AuthResponse } from '../../../models/dto/auth.dto';
import { UserRepository } from '../infrastructure/user.repository.prisma';
import { PasswordUtil } from '../../../shared/security/password.util';
import { JwtUtil } from '../../../shared/security/jwt.util';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';

export class LoginUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(data: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is disabled');
    }

    const isPasswordValid = await PasswordUtil.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    logger.info('User logged in', { userId: user.id, email: user.email });

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
}
