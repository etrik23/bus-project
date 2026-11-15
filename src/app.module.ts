import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { AwsModule } from './aws/aws.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { ManagersModule } from './managers/managers.module.js';
import { RoutesModule } from './routes/routes.module.js';
import { SeatsModule } from './seats/seats.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { TripsModule } from './trips/trips.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.host,
      port: Number(process.env.DB_PORT ?? 5433),
      username: 'postgres',
      password: process.env.pass,
      database: process.env.name,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    AwsModule,
    EmployeesModule,
    ManagersModule,
    RoutesModule,
    SeatsModule,
    TicketsModule,
    TripsModule,
  ],
})
export class AppModule {}