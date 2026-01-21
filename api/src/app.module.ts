import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './features/events';
import { ParticipantsModule } from './features/participants';
import { OrganizerUnitsModule } from './features/organizer-units';
import { EventDocumentsModule } from './features/event-documents';
import { EventParticipantsModule } from './features/event-participants';
import { NotificationsModule } from './features/notifications';
import { NotificationReceiversModule } from './features/notification-receivers';
import { MinigamesModule } from './features/minigames';
import { MinigamePrizesModule } from './features/minigame-prizes';
import { MinigameResultsModule } from './features/minigame-results';
import { ImportLogsModule } from './features/import-logs';
import { UploadModule } from './features/upload';
import { EventJobsModule } from './features/event-jobs';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    // Logger module (must be imported first)
    LoggerModule,
    // Load environment variables from .env (root of api folder)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    // Database-first TypeORM setup (entities array sẽ bổ sung sau)
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'conference',
        synchronize: process.env.NODE_ENV === 'development', // Auto create tables in dev
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
    }),
    EventsModule,
    ParticipantsModule,
    OrganizerUnitsModule,
    EventDocumentsModule,
    EventParticipantsModule,
    NotificationsModule,
    NotificationReceiversModule,
    MinigamesModule,
    MinigamePrizesModule,
    MinigameResultsModule,
    ImportLogsModule,
    UploadModule,
    AuthModule,
    EventJobsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
