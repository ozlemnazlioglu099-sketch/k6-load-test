import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseService } from './database/database.service.js';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { UsersService } from './users/users.service.js';
import { MetricsController } from './metrics/metrics.controller.js';
import { MetricsService } from './metrics/metrics.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    MetricsController,
  ],
  providers: [
    AppService,
    DatabaseService,
    AuthService,
    UsersService,
    MetricsService,
  ],
})
export class AppModule {}
