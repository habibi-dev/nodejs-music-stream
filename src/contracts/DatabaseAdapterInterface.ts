import { Sequelize } from 'sequelize';

/**
 * Defines the contract for all database adapters.
 * Each adapter must create and return a Sequelize instance based on its own configuration.
 */
export interface DatabaseAdapterInterface {
  /**
   * Creates a new Sequelize connection using environment variables.
   */
  createConnection(): Sequelize;
}

