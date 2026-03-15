import { UserRepository } from '../infrastructure/user.repository.prisma';
import { logger } from '../../../shared/observability/logger';

export class LogoutUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      await this.userRepository.deleteRefreshToken(refreshToken);
      logger.info('User logged out');
    } catch (error) {
      logger.warn('Logout: Refresh token not found', { error });
    }
  }
}
