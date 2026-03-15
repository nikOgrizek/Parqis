import { PrismaClient } from '@prisma/client';
import { logger } from '../../observability/logger';

const prismaClientSingleton = () => {
	return new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'event' },
			{ level: 'warn', emit: 'event' },
		],
	});
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV === 'development') {
	prisma.$on('query' as never, (e: any) => {
		logger.debug('Prisma Query', {
			query: e.query,
			params: e.params,
			duration: e.duration,
		});
	});
}

prisma.$on('error' as never, (e: any) => {
	logger.error('Prisma Error', { error: e });
});

if (process.env.NODE_ENV !== 'production') {
	globalThis.prisma = prisma;
}

export { prisma };
