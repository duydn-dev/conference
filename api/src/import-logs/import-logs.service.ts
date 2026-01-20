import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateImportLogDto } from './dto/create-import-log.dto';
import { UpdateImportLogDto } from './dto/update-import-log.dto';
import { ImportLog } from './entities/import-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImportLogsService {
  private readonly logger = new Logger(ImportLogsService.name);

  constructor(
    @InjectRepository(ImportLog)
    private readonly importLogsRepository: Repository<ImportLog>,
  ) {}

  async create(dto: CreateImportLogDto): Promise<ImportLog> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating import log: ${dto.file_name} (id: ${id}, event: ${dto.event_id}, imported_by: ${dto.imported_by})`);

    try {
      const entity = this.importLogsRepository.create({
        ...dto,
        id,
      } as any);
      const saved = await this.importLogsRepository.save(entity) as unknown as ImportLog;
      this.logger.log(`Import log created successfully: ${id} - ${saved.file_name}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create import log: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<ImportLog[]> {
    this.logger.debug('Finding all import logs');
    const logs = await this.importLogsRepository.find({
      order: { imported_at: 'DESC' },
    });
    this.logger.log(`Found ${logs.length} import logs`);
    return logs;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding import logs with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
    const where = search
      ? [
          { file_name: ILike(`%${search}%`) },
          { imported_by: ILike(`%${search}%`) },
          { event_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.importLogsRepository.findAndCount({
      where,
      order: { imported_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`Found ${total} import logs (returning ${items.length} items)`);
    
    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ImportLog> {
    this.logger.debug(`Finding import log by id: ${id}`);
    
    const importLog = await this.importLogsRepository.findOne({
      where: { id },
    });
    if (!importLog) {
      this.logger.warn(`Import log not found: ${id}`);
      throw new NotFoundException(`ImportLog with id ${id} not found`);
    }
    
    this.logger.debug(`Import log found: ${id} - ${importLog.file_name}`);
    return importLog;
  }

  async update(id: string, dto: UpdateImportLogDto): Promise<ImportLog> {
    this.logger.log(`Updating import log: ${id}`);
    
    try {
      const importLog = await this.findOne(id);
      const merged = this.importLogsRepository.merge(importLog, dto as any);
      const updated = await this.importLogsRepository.save(merged);
      this.logger.log(`Import log updated successfully: ${id} - ${updated.file_name}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update import log ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting import log: ${id}`);
    
    const result = await this.importLogsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Import log not found for deletion: ${id}`);
      throw new NotFoundException(`ImportLog with id ${id} not found`);
    }

    this.logger.log(`Import log deleted successfully: ${id}`);
  }
}
