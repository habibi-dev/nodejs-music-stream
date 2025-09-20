import { Sequelize } from 'sequelize';
import { DatabaseAdapterInterface } from '../../contracts/DatabaseAdapterInterface';
import { SequelizeOptionsUtil } from '../utils/SequelizeOptionsUtil';

/**
 * Creates a Sequelize connection for SQLite databases.
 */
export class SqliteAdapter implements DatabaseAdapterInterface {
  createConnection(): Sequelize {
    const storage = process.env.DB_STORAGE as string;
    const options = SequelizeOptionsUtil.build('sqlite');

    return new Sequelize({
      dialect: 'sqlite',
      storage,
      ...options,
    });
  }
}

