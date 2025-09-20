import { Options } from 'sequelize';

export class SequelizeOptionsUtil {
  /**
   * Generates Sequelize options for a specific database type.
   * @param dbType optional database type to apply db-specific settings like schema
   */
  static build(dbType?: string): Options {
    const loggingEnv = process.env.DB_LOGGING;
    const logging = loggingEnv === 'true' ? console.log : false;

    const pool = {
      max: Number(process.env.DB_POOL_MAX) || 5,
      min: Number(process.env.DB_POOL_MIN) || 0,
      idle: Number(process.env.DB_POOL_IDLE) || 10000,
      acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
    };

    const dialectOptions: Record<string, unknown> = {};

    if (process.env.DB_SSL === 'true') {
      dialectOptions.ssl = { require: true, rejectUnauthorized: false };
    }

    const options: Options = {
      logging,
      pool,
      timezone: process.env.DB_TIMEZONE,
    };

    if (Object.keys(dialectOptions).length > 0) {
      options.dialectOptions = dialectOptions;
    }

    if (dbType === 'postgres' && process.env.DB_SCHEMA) {
      options.define = { ...(options.define || {}), schema: process.env.DB_SCHEMA };
    }

    return options;
  }
}

