import type { Config } from 'jest';

/**
 * Defines how Jest discovers and executes TypeScript tests across modules.
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/modules/**/tests/**/*.test.ts', '<rootDir>/src/tests/**/*.spec.ts']
};

export default config;
