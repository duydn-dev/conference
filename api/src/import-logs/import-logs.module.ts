import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportLogsService } from './import-logs.service';
import { ImportLogsController } from './import-logs.controller';
import { ImportLog } from './entities/import-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImportLog])],
  controllers: [ImportLogsController],
  providers: [ImportLogsService],
})
export class ImportLogsModule {}
