// Mock Prisma Client for tests
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock Kafka for tests
jest.mock('../src/config/kafka', () => ({
  kafkaConfig: {
    getProducer: jest.fn().mockResolvedValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    }),
    getConsumer: jest.fn().mockResolvedValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
    }),
    disconnect: jest.fn(),
  },
}));

// Mock logger for cleaner test output
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  loggerStream: {
    write: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.INTERNAL_API_KEY = 'test-internal-api-key';

beforeAll(() => {
  // Global test setup
});

afterAll(async () => {
  // Global test teardown
  jest.clearAllMocks();
});
