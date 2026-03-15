import winston from 'winston';
import { env } from '../config/env';

const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
	winston.format.errors({ stack: true }),
	winston.format.json()
);

const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		let msg = `${timestamp} [${level}]: ${message}`;
		if (Object.keys(meta).length > 0) {
			msg += ` ${JSON.stringify(meta)}`;
		}
		return msg;
	})
);

export const logger = winston.createLogger({
	level: env.LOG_LEVEL,
	format: logFormat,
	defaultMeta: { service: 'ms1-reservations' },
	transports: [
		new winston.transports.Console({
			format: env.NODE_ENV === 'development' ? consoleFormat : logFormat,
		}),
		new winston.transports.File({
			filename: 'logs/error.log',
			level: 'error',
			maxsize: 5242880,
			maxFiles: 5,
		}),
		new winston.transports.File({
			filename: 'logs/combined.log',
			maxsize: 5242880,
			maxFiles: 5,
		}),
	],
});

export const loggerStream = {
	write: (message: string) => {
		logger.info(message.trim());
	},
};
