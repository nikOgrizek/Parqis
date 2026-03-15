import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(`Missing required environment variable: ${envVar}`);
	}
}

export const env = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: parseInt(process.env.PORT || '3000', 10),

	DATABASE_URL: process.env.DATABASE_URL!,

	JWT_SECRET: process.env.JWT_SECRET!,
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
	JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
	JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

	KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
	KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'ms1-reservations',
	KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'reservations-group',

	REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

	INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',

	LOG_LEVEL: process.env.LOG_LEVEL || 'info',

	RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
	RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};
