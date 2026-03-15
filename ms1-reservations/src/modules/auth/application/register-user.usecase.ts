import { RegisterDto, AuthResponse } from '../../../models/dto/auth.dto';
import { UserRepository } from '../infrastructure/user.repository.prisma';
import { assertPasswordPolicy } from '../domain/password-policy';
import { PasswordUtil } from '../../../shared/security/password.util';
import { JwtUtil } from '../../../shared/security/jwt.util';
import { AppError } from '../../../app/http/middlewares/error.middleware';
import { logger } from '../../../shared/observability/logger';

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(data: RegisterDto): Promise<AuthResponse> {
    assertPasswordPolicy(data.password);

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    const hashedPassword = await PasswordUtil.hash(data.password);
    const user = await this.userRepository.create({ ...data, password: hashedPassword });

    logger.info('User registered', { userId: user.id, email: user.email });

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
