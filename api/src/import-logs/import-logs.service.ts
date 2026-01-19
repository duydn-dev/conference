import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateImportLogDto } from './dto/create-import-log.dto';
import { UpdateImportLogDto } from './dto/update-import-log.dto';
import { ImportLog } from '../events/entities/import-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImportLogsService {
  constructor(
    @InjectRepository(ImportLog)
    private readonly importLogsRepository: Repository<ImportLog>,
  ) {}

  async create(dto: CreateImportLogDto): Promise<ImportLog> {
    const id = dto.id ?? uuidv4();
    const entity = this.importLogsRepository.create({
      ...dto,
      id,
    } as any);
    return this.importLogsRepository.save(entity) as unknown as Promise<ImportLog>;
  }

  async findAll(): Promise<ImportLog[]> {
    return this.importLogsRepository.find({
      order: { imported_at: 'DESC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
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
    const importLog = await this.importLogsRepository.findOne({
      where: { id },
    });
    if (!importLog) {
      throw new NotFoundException(`ImportLog with id ${id} not found`);
    }
    return importLog;
  }

  async update(id: string, dto: UpdateImportLogDto): Promise<ImportLog> {
    const importLog = await this.findOne(id);
    const merged = this.importLogsRepository.merge(importLog, dto as any);
    return this.importLogsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.importLogsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`ImportLog with id ${id} not found`);
    }
  }
}
