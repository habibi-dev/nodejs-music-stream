import { Sequelize } from 'sequelize';
import { DatabaseAdapterInterface } from '../../contracts/DatabaseAdapterInterface';
import { SequelizeOptionsUtil } from '../utils/SequelizeOptionsUtil';

/**
 * Creates a Sequelize connection from a DATABASE_URL environment variable.
 */
export class UrlAdapter implements DatabaseAdapterInterface {
  createConnection(): Sequelize {
    const url = process.env.DATABASE_URL as string;
    const dbType = process.env.DB_TYPE;
    const options = SequelizeOptionsUtil.build(dbType);

    return new Sequelize(url, options);
  }
}

