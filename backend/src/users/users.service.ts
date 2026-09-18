import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    const result = await this.database
      .getPool()
      .query('SELECT id, name, email FROM users ORDER BY id');

    return result.rows;
  }

  async findOne(id: number) {
    const result = await this.database
      .getPool()
      .query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [id],
      );

    return result.rows[0] ?? null;
  }
}