import { Sequelize } from 'sequelize';
import { DatabaseAdapterInterface } from '../../contracts/DatabaseAdapterInterface';
import { SequelizeOptionsUtil } from '../utils/SequelizeOptionsUtil';

/**
 * Creates a Sequelize connection for MySQL databases.
 */
export class MysqlAdapter implements DatabaseAdapterInterface {
  createConnection(): Sequelize {
    const database = process.env.DB_NAME as string;
    const username = process.env.DB_USER as string;
    const password = process.env.DB_PASSWORD as string;
    const host = process.env.DB_HOST;
    const port = Number(process.env.DB_PORT);

    const options = SequelizeOptionsUtil.build('mysql');

    return new Sequelize(database, username, password, {
      host,
      port,
      dialect: 'mysql',
      ...options,
    });
  }
}

