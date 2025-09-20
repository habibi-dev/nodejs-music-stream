import { Sequelize } from 'sequelize';
import { DatabaseAdapterInterface } from '../contracts/DatabaseAdapterInterface';
import { MysqlAdapter } from './adapters/MysqlAdapter';
import { MariadbAdapter } from './adapters/MariadbAdapter';
import { PostgresAdapter } from './adapters/PostgresAdapter';
import { SqliteAdapter } from './adapters/SqliteAdapter';
import { MssqlAdapter } from './adapters/MssqlAdapter';
import { UrlAdapter } from './adapters/UrlAdapter';

export class DatabaseManager {
  private static instance: Sequelize;

  /**
   * Returns the singleton Sequelize connection.
   */
  static getConnection(): Sequelize {
    if (!this.instance) {
      this.instance = this.createConnection();
    }

    return this.instance;
  }

  /**
   * Chooses the appropriate adapter and creates the connection.
   */
  private static createConnection(): Sequelize {
    if (process.env.DATABASE_URL) {
      return new UrlAdapter().createConnection();
    }

    const dbType = process.env.DB_TYPE || 'sqlite';

    const adapter = this.resolveAdapter(dbType);
    return adapter.createConnection();
  }

  /**
   * Maps DB_TYPE values to adapter implementations.
   */
  private static resolveAdapter(dbType: string): DatabaseAdapterInterface {
    const map: Record<string, DatabaseAdapterInterface> = {
      sqlite: new SqliteAdapter(),
      mysql: new MysqlAdapter(),
      mariadb: new MariadbAdapter(),
      postgres: new PostgresAdapter(),
      mssql: new MssqlAdapter(),
    };

    const adapter = map[dbType];
    if (!adapter) {
      throw new Error(`Unsupported DB_TYPE: ${dbType}`);
    }

    return adapter;
  }
}

