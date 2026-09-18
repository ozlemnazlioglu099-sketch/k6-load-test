import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 60,
        });
    }

    getPool(): Pool {
        return this.pool;
    }

    getPoolMetrics() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            max: this.pool.options.max,
        };
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}