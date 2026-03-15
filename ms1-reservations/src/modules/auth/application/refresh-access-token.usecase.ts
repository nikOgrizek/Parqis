import { JwtUtil } from '../../../shared/security/jwt.util';
import { UserRepository } from '../infrastructure/user.repository.prisma';
import { AppError } from '../../../app/http/middlewares/error.middleware';

export class RefreshAccessTokenUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(token: string): Promise<{ accessToken: string }> {
    let payload;
    try {
      payload = JwtUtil.verifyRefreshToken(token);
    } catch (_error) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const storedToken = await this.userRepository.findRefreshToken(token);
    if (!storedToken) {
      throw new AppError(401, 'Refresh token not found');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.userRepository.deleteRefreshToken(token);
      throw new AppError(401, 'Refresh token expired');
    }

    const accessToken = JwtUtil.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return { accessToken };
  }
}
