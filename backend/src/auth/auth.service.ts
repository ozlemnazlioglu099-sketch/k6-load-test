import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  async login(email: string, password: string) {
    const result = await this.database.getPool().query(
      'SELECT id, name, email FROM users WHERE email = $1 AND password = $2',
      [email, password],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'Login successful',
      user: result.rows[0],
    };
  }
}