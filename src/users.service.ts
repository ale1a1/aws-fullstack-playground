import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from './db';

@Injectable()
export class UsersService {
  async findAll() {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    return result.rows;
  }

  async findOne(id: number) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException(`User ${id} not found`);
    return result.rows[0];
  }

  async create(name: string, email: string) {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email],
    );
    return result.rows[0];
  }

  async update(id: number, name: string, email: string) {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, id],
    );
    if (result.rows.length === 0) throw new NotFoundException(`User ${id} not found`);
    return result.rows[0];
  }

  async remove(id: number) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) throw new NotFoundException(`User ${id} not found`);
    return result.rows[0];
  }
}
