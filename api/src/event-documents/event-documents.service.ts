import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventDocumentDto } from './dto/create-event-document.dto';
import { UpdateEventDocumentDto } from './dto/update-event-document.dto';
import { EventDocument } from '../events/entities/event-document.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventDocumentsService {
  constructor(
    @InjectRepository(EventDocument)
    private readonly eventDocumentsRepository: Repository<EventDocument>,
  ) {}

  async create(dto: CreateEventDocumentDto): Promise<EventDocument> {
    const id = dto.id ?? uuidv4();
    const entity = this.eventDocumentsRepository.create({
      ...dto,
      id,
    } as any);
    return this.eventDocumentsRepository.save(entity) as unknown as Promise<EventDocument>;
  }

  async findAll(): Promise<EventDocument[]> {
    return this.eventDocumentsRepository.find({
      order: { uploaded_at: 'DESC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { file_name: ILike(`%${search}%`) },
          { file_type: ILike(`%${search}%`) },
          { event_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.eventDocumentsRepository.findAndCount({
      where,
      order: { uploaded_at: 'DESC' },
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

  async findOne(id: string): Promise<EventDocument> {
    const eventDocument = await this.eventDocumentsRepository.findOne({
      where: { id },
    });
    if (!eventDocument) {
      throw new NotFoundException(`EventDocument with id ${id} not found`);
    }
    return eventDocument;
  }

  async update(id: string, dto: UpdateEventDocumentDto): Promise<EventDocument> {
    const eventDocument = await this.findOne(id);
    const merged = this.eventDocumentsRepository.merge(eventDocument, dto as any);
    return this.eventDocumentsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventDocumentsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`EventDocument with id ${id} not found`);
    }
  }
}
