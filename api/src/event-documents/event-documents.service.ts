import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventDocumentDto } from './dto/create-event-document.dto';
import { UpdateEventDocumentDto } from './dto/update-event-document.dto';
import { EventDocument } from './entities/event-document.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventDocumentsService {
  private readonly logger = new Logger(EventDocumentsService.name);

  constructor(
    @InjectRepository(EventDocument)
    private readonly eventDocumentsRepository: Repository<EventDocument>,
  ) {}

  async create(dto: CreateEventDocumentDto): Promise<EventDocument> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating event document: ${dto.file_name} (id: ${id}, event: ${dto.event_id})`);

    try {
      const entity = this.eventDocumentsRepository.create({
        ...dto,
        id,
      } as any);
      const saved = await this.eventDocumentsRepository.save(entity) as unknown as EventDocument;
      this.logger.log(`Event document created successfully: ${id} - ${saved.file_name}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create event document: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<EventDocument[]> {
    this.logger.debug('Finding all event documents');
    const documents = await this.eventDocumentsRepository.find({
      order: { uploaded_at: 'DESC' },
    });
    this.logger.log(`Found ${documents.length} event documents`);
    return documents;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding event documents with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
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

    this.logger.log(`Found ${total} event documents (returning ${items.length} items)`);
    
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
    this.logger.debug(`Finding event document by id: ${id}`);
    
    const eventDocument = await this.eventDocumentsRepository.findOne({
      where: { id },
    });
    if (!eventDocument) {
      this.logger.warn(`Event document not found: ${id}`);
      throw new NotFoundException(`EventDocument with id ${id} not found`);
    }
    
    this.logger.debug(`Event document found: ${id} - ${eventDocument.file_name}`);
    return eventDocument;
  }

  async update(id: string, dto: UpdateEventDocumentDto): Promise<EventDocument> {
    this.logger.log(`Updating event document: ${id}`);
    
    try {
      const eventDocument = await this.findOne(id);
      const merged = this.eventDocumentsRepository.merge(eventDocument, dto as any);
      const updated = await this.eventDocumentsRepository.save(merged);
      this.logger.log(`Event document updated successfully: ${id} - ${updated.file_name}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update event document ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting event document: ${id}`);
    
    const result = await this.eventDocumentsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Event document not found for deletion: ${id}`);
      throw new NotFoundException(`EventDocument with id ${id} not found`);
    }

    this.logger.log(`Event document deleted successfully: ${id}`);
  }
}
