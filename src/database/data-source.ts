import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { getTypeOrmConfig } from './orm.config';

export const AppDataSource = new DataSource(
  getTypeOrmConfig(),
);

export default AppDataSource;