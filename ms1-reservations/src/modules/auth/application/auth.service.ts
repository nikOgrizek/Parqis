import { RegisterDto, LoginDto, AuthResponse } from '../../../models/dto/auth.dto';
import { UserRepository } from '../infrastructure/user.repository.prisma';
import { RegisterUserUseCase } from './register-user.usecase';
import { LoginUserUseCase } from './login-user.usecase';
import { RefreshAccessTokenUseCase } from './refresh-access-token.usecase';
import { LogoutUserUseCase } from './logout-user.usecase';

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly registerUseCase: RegisterUserUseCase;
  private readonly loginUseCase: LoginUserUseCase;
  private readonly refreshUseCase: RefreshAccessTokenUseCase;
  private readonly logoutUseCase: LogoutUserUseCase;

  constructor() {
    this.userRepository = new UserRepository();
    this.registerUseCase = new RegisterUserUseCase(this.userRepository);
    this.loginUseCase = new LoginUserUseCase(this.userRepository);
    this.refreshUseCase = new RefreshAccessTokenUseCase(this.userRepository);
    this.logoutUseCase = new LogoutUserUseCase(this.userRepository);
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    return this.registerUseCase.execute(data);
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    return this.loginUseCase.execute(data);
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    return this.refreshUseCase.execute(token);
  }

  async logout(refreshToken: string): Promise<void> {
    return this.logoutUseCase.execute(refreshToken);
  }

  async cleanExpiredTokens(): Promise<void> {
    await this.userRepository.deleteExpiredTokens();
  }
}
