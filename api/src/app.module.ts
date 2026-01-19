import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { ParticipantsModule } from './participants/participants.module';
import { OrganizerUnitsModule } from './organizer-units/organizer-units.module';
import { EventContentsModule } from './event-contents/event-contents.module';
import { EventDocumentsModule } from './event-documents/event-documents.module';
import { EventParticipantsModule } from './event-participants/event-participants.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationReceiversModule } from './notification-receivers/notification-receivers.module';
import { MinigamesModule } from './minigames/minigames.module';
import { MinigamePrizesModule } from './minigame-prizes/minigame-prizes.module';
import { MinigameResultsModule } from './minigame-results/minigame-results.module';
import { ImportLogsModule } from './import-logs/import-logs.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
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
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
    }),
    EventsModule,
    ParticipantsModule,
    OrganizerUnitsModule,
    EventContentsModule,
    EventDocumentsModule,
    EventParticipantsModule,
    NotificationsModule,
    NotificationReceiversModule,
    MinigamesModule,
    MinigamePrizesModule,
    MinigameResultsModule,
    ImportLogsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
