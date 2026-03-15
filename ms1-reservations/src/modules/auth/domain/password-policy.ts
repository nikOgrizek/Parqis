import { AppError } from '../../../app/http/middlewares/error.middleware';
import { PasswordUtil } from '../../../shared/security/password.util';

export const assertPasswordPolicy = (password: string): void => {
  const passwordValidation = PasswordUtil.validateStrength(password);
  if (!passwordValidation.valid) {
    throw new AppError(400, passwordValidation.message || 'Invalid password');
  }
};
