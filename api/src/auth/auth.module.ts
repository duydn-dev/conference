import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ParticipantsModule } from '../features/participants';
import { OrganizerUnitsModule } from '../features/organizer-units/organizer-units.module';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    ParticipantsModule,
    OrganizerUnitsModule, // Import để sử dụng OrganizerUnitsService
    EncryptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule], // Export JwtModule để các module khác có thể sử dụng
})
export class AuthModule {}
