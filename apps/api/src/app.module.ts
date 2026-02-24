import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'path';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/supabase-jwt.guard';
import { RolesGuard } from './auth/roles.guard';
import { CatalogsModule } from './catalogs/catalogs.module';
import { HealthController } from './health.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), 'apps/api/.env'),
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../../.env'),
      ],
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    CatalogsModule,
    TicketsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
