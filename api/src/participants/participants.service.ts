import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { Participant } from '../events/entities/participant.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
  ) {}

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { full_name: ILike(`%${search}%`) },
          { identity_number: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.participantsRepository.findAndCount({
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

  async create(dto: CreateParticipantDto): Promise<Participant> {
    const id = dto.id ?? uuidv4();
    const entity = this.participantsRepository.create({
      ...dto,
      id,
    } as any);
    return this.participantsRepository.save(entity) as unknown as Promise<Participant>;
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { id },
    });
    if (!participant) {
      throw new NotFoundException(`Participant with id ${id} not found`);
    }
    return participant;
  }

  async update(id: string, dto: UpdateParticipantDto): Promise<Participant> {
    const participant = await this.findOne(id);
    const merged = this.participantsRepository.merge(participant, dto as any);
    return this.participantsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.participantsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Participant with id ${id} not found`);
    }
  }
}
