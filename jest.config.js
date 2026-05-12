module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'scripts/*.ts',
    '!scripts/**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 30000, // 30 seconds for ZK proof generation
};
