import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
	userId: string;
	email: string;
	role: string;
}

export class JwtUtil {
	static generateAccessToken(payload: JwtPayload): string {
		return jwt.sign(payload, env.JWT_SECRET, {
			expiresIn: env.JWT_ACCESS_EXPIRY,
			issuer: 'parqis-ms1',
			audience: 'parqis-api',
		} as any);
	}

	static generateRefreshToken(payload: JwtPayload): string {
		return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
			expiresIn: env.JWT_REFRESH_EXPIRY,
			issuer: 'parqis-ms1',
			audience: 'parqis-api',
		} as any);
	}

	static verifyAccessToken(token: string): JwtPayload {
		try {
			return jwt.verify(token, env.JWT_SECRET, {
				issuer: 'parqis-ms1',
				audience: 'parqis-api',
			}) as JwtPayload;
		} catch (_error) {
			throw new Error('Invalid or expired access token');
		}
	}

	static verifyRefreshToken(token: string): JwtPayload {
		try {
			return jwt.verify(token, env.JWT_REFRESH_SECRET, {
				issuer: 'parqis-ms1',
				audience: 'parqis-api',
			}) as JwtPayload;
		} catch (_error) {
			throw new Error('Invalid or expired refresh token');
		}
	}

	static decode(token: string): any {
		return jwt.decode(token);
	}
}
