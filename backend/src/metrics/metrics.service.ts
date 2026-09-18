import { Injectable, OnModuleInit } from '@nestjs/common';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly eventLoopDelay = monitorEventLoopDelay({
    resolution: 10,
  });

  private previousCpu = process.cpuUsage();
  private previousTime = process.hrtime.bigint();

  constructor(
    private readonly database: DatabaseService,
  ) {}

  onModuleInit() {
    this.eventLoopDelay.enable();
  }

  getMetrics() {
    const memory = process.memoryUsage();

    // --- CPU Hesaplaması ---
    const currentCpu = process.cpuUsage();
    const currentTime = process.hrtime.bigint();

    // Geçen süreyi milisaniyeye çevirme
    const elapsedMs = Number(currentTime - this.previousTime) / 1e6;

    // Kullanılan CPU süresini mikrosaniyeden milisaniyeye çevirme (user + system)
    const cpuUsedMicros =
      (currentCpu.user - this.previousCpu.user) +
      (currentCpu.system - this.previousCpu.system);

    const cpuUsedMs = cpuUsedMicros / 1000;

    // Yüzde hesaplama (Elapsed sürenin ne kadarı CPU tarafından harcandı)
    const cpuPercent =
      elapsedMs > 0
        ? (cpuUsedMs / elapsedMs) * 100
        : 0;

    // Bir sonraki ölçüm için referansları güncelleme
    this.previousCpu = currentCpu;
    this.previousTime = currentTime;

    // --- Metrik Nesnesi Dönüşü ---
    return {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
      },

      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },

      cpu: {
        percent: Number(cpuPercent.toFixed(2)),
      },

      eventLoop: {
        meanMs: this.eventLoopDelay.mean / 1e6,
        maxMs: this.eventLoopDelay.max / 1e6,
        p95Ms: this.eventLoopDelay.percentile(95) / 1e6,
      },

      database: this.database.getPoolMetrics(),
    };
  }
}