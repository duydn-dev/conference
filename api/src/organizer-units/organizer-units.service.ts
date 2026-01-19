import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateOrganizerUnitDto } from './dto/create-organizer-unit.dto';
import { UpdateOrganizerUnitDto } from './dto/update-organizer-unit.dto';
import { OrganizerUnit } from '../events/entities/organizer-unit.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizerUnitsService {
  constructor(
    @InjectRepository(OrganizerUnit)
    private readonly organizerUnitsRepository: Repository<OrganizerUnit>,
  ) {}

  async create(dto: CreateOrganizerUnitDto): Promise<OrganizerUnit> {
    const id = dto.id ?? uuidv4();
    const entity = this.organizerUnitsRepository.create({
      ...dto,
      id,
    } as any);
    return this.organizerUnitsRepository.save(entity) as unknown as Promise<OrganizerUnit>;
  }

  async findAll(): Promise<OrganizerUnit[]> {
    return this.organizerUnitsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
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
    const organizerUnit = await this.organizerUnitsRepository.findOne({
      where: { id },
    });
    if (!organizerUnit) {
      throw new NotFoundException(`OrganizerUnit with id ${id} not found`);
    }
    return organizerUnit;
  }

  async update(id: string, dto: UpdateOrganizerUnitDto): Promise<OrganizerUnit> {
    const organizerUnit = await this.findOne(id);
    const merged = this.organizerUnitsRepository.merge(organizerUnit, dto as any);
    return this.organizerUnitsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.organizerUnitsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`OrganizerUnit with id ${id} not found`);
    }
  }
}
