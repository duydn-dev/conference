import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateOrganizerUnitDto } from './dto/create-organizer-unit.dto';
import { UpdateOrganizerUnitDto } from './dto/update-organizer-unit.dto';
import { OrganizerUnit } from './entities/organizer-unit.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizerUnitsService {
  private readonly logger = new Logger(OrganizerUnitsService.name);

  constructor(
    @InjectRepository(OrganizerUnit)
    private readonly organizerUnitsRepository: Repository<OrganizerUnit>,
  ) {}

  async create(dto: CreateOrganizerUnitDto): Promise<OrganizerUnit> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating new organizer unit: ${dto.name} (id: ${id})`);

    try {
      const entity = this.organizerUnitsRepository.create({
        ...dto,
        id,
      } as any);
      const savedUnit = await this.organizerUnitsRepository.save(entity) as unknown as OrganizerUnit;
      this.logger.log(`Organizer unit created successfully: ${savedUnit.id} - ${savedUnit.name}`);
      return savedUnit;
    } catch (error) {
      this.logger.error(`Failed to create organizer unit: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<OrganizerUnit[]> {
    this.logger.debug('Finding all organizer units');
    const units = await this.organizerUnitsRepository.find({
      order: { created_at: 'DESC' },
    });
    this.logger.log(`Found ${units.length} organizer units`);
    return units;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding organizer units with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { contact_person: ILike(`%${search}%`) },
          { contact_email: ILike(`%${search}%`) },
          { contact_phone: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.organizerUnitsRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`Found ${total} organizer units (returning ${items.length} items)`);
    
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

  async findOne(id: string): Promise<OrganizerUnit> {
    this.logger.debug(`Finding organizer unit by id: ${id}`);
    
    const organizerUnit = await this.organizerUnitsRepository.findOne({
      where: { id },
    });
    if (!organizerUnit) {
      this.logger.warn(`Organizer unit not found: ${id}`);
      throw new NotFoundException(`OrganizerUnit with id ${id} not found`);
    }
    
    this.logger.debug(`Organizer unit found: ${organizerUnit.id} - ${organizerUnit.name}`);
    return organizerUnit;
  }

  async findByName(name: string): Promise<OrganizerUnit | null> {
    this.logger.debug(`Finding organizer unit by name: ${name}`);
    
    const organizerUnit = await this.organizerUnitsRepository.findOne({
      where: { name },
    });
    
    if (organizerUnit) {
      this.logger.debug(`Organizer unit found: ${organizerUnit.id} - ${organizerUnit.name}`);
    } else {
      this.logger.debug(`Organizer unit not found with name: ${name}`);
    }
    
    return organizerUnit;
  }

  async update(id: string, dto: UpdateOrganizerUnitDto): Promise<OrganizerUnit> {
    this.logger.log(`Updating organizer unit: ${id}`);
    
    try {
      const organizerUnit = await this.findOne(id);
      const merged = this.organizerUnitsRepository.merge(organizerUnit, dto as any);
      const updatedUnit = await this.organizerUnitsRepository.save(merged);
      this.logger.log(`Organizer unit updated successfully: ${id} - ${updatedUnit.name}`);
      return updatedUnit;
    } catch (error) {
      this.logger.error(`Failed to update organizer unit ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting organizer unit: ${id}`);
    
    const result = await this.organizerUnitsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Organizer unit not found for deletion: ${id}`);
      throw new NotFoundException(`OrganizerUnit with id ${id} not found`);
    }

    this.logger.log(`Organizer unit deleted successfully: ${id}`);
  }
}
