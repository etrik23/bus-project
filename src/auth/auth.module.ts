import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { User } from './entities/user.entity.js';
import { EXPIRES_IN, JWT_KEY } from './constants/jwt.constants.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { Manager } from '../managers/entities/manager.entity.js';
import { AwsModule } from '../aws/aws.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Employee, Manager]),
    AwsModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt_key') ?? JWT_KEY,
        signOptions: {
          expiresIn: EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
