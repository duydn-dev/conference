import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { Participant } from './entities/participant.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
  ) {}

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding participants with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
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

    this.logger.log(`Found ${total} participants (returning ${items.length} items)`);
    
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
    this.logger.log(`Creating new participant: ${dto.full_name} (id: ${id}, identity: ${dto.identity_number})`);

    try {
      const entity = this.participantsRepository.create({
        ...dto,
        id,
      } as any);
      const savedParticipant = await this.participantsRepository.save(entity) as unknown as Participant;
      this.logger.log(`Participant created successfully: ${savedParticipant.id} - ${savedParticipant.full_name}`);
      return savedParticipant;
    } catch (error) {
      this.logger.error(`Failed to create participant: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findOne(id: string): Promise<Participant> {
    this.logger.debug(`Finding participant by id: ${id}`);
    
    const participant = await this.participantsRepository.findOne({
      where: { id },
    });
    if (!participant) {
      this.logger.warn(`Participant not found: ${id}`);
      throw new NotFoundException(`Participant with id ${id} not found`);
    }
    
    this.logger.debug(`Participant found: ${id} - ${participant.full_name}`);
    return participant;
  }

  async findByIdentityNumber(identityNumber: string): Promise<Participant | null> {
    this.logger.debug(`Finding participant by identity number: ${identityNumber}`);
    const participant = await this.participantsRepository.findOne({
      where: { identity_number: identityNumber },
    });
    if (participant) {
      this.logger.debug(`Participant found by identity number: ${participant.id}`);
    }
    return participant;
  }

  async findByPhone(phone: string): Promise<Participant | null> {
    if (!phone) {
      return null;
    }
    this.logger.debug(`Finding participant by phone: ${phone}`);
    const participant = await this.participantsRepository.findOne({
      where: { phone: phone.trim() },
    });
    if (participant) {
      this.logger.debug(`Participant found by phone: ${participant.id}`);
    }
    return participant;
  }

  async findByIdentityNumberOrPhone(identityNumber?: string, phone?: string): Promise<Participant | null> {
    if (identityNumber) {
      const byIdentity = await this.findByIdentityNumber(identityNumber);
      if (byIdentity) {
        return byIdentity;
      }
    }
    if (phone) {
      const byPhone = await this.findByPhone(phone);
      if (byPhone) {
        return byPhone;
      }
    }
    return null;
  }

  async findByOrganization(organization: string): Promise<Participant[]> {
    // Normalize organization to lowercase for comparison
    const normalizedOrg = organization?.toLowerCase().trim() || '';
    if (!normalizedOrg) {
      return [];
    }
    
    const allParticipants = await this.participantsRepository.find();
    return allParticipants.filter(p => {
      const participantOrg = p.organization?.toLowerCase().trim() || '';
      return participantOrg === normalizedOrg;
    });
  }

  async update(id: string, dto: UpdateParticipantDto): Promise<Participant> {
    this.logger.log(`Updating participant: ${id}`);
    
    try {
      const participant = await this.findOne(id);
      const merged = this.participantsRepository.merge(participant, dto as any);
      const updatedParticipant = await this.participantsRepository.save(merged);
      this.logger.log(`Participant updated successfully: ${id} - ${updatedParticipant.full_name}`);
      return updatedParticipant;
    } catch (error) {
      this.logger.error(`Failed to update participant ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting participant: ${id}`);
    
    const result = await this.participantsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Participant not found for deletion: ${id}`);
      throw new NotFoundException(`Participant with id ${id} not found`);
    }

    this.logger.log(`Participant deleted successfully: ${id}`);
  }

  async importFromExcel(data: any[]): Promise<{ success: number; failed: number; errors: any[] }> {
    this.logger.log(`Starting Excel import for participants with ${data.length} rows`);
    
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.identity_number || !row.full_name) {
          failed++;
          errors.push({
            row,
            error: 'Missing required fields: identity_number or full_name'
          });
          continue;
        }

        // Check if participant already exists
        const existing = await this.participantsRepository.findOne({
          where: { identity_number: row.identity_number },
        });

        if (existing) {
          // Update existing participant
          this.logger.debug(`Updating existing participant: ${existing.id} - ${existing.full_name}`);
          const merged = this.participantsRepository.merge(existing, {
            full_name: row.full_name,
            email: row.email || null,
            phone: row.phone || null,
            organization: row.organization || null,
            position: row.position || null,
            is_receptionist: row.is_receptionist === true || row.is_receptionist === 'true' || row.is_receptionist === 1 || false
          });
          await this.participantsRepository.save(merged);
        } else {
          // Create new participant
          const id = uuidv4();
          this.logger.debug(`Creating new participant: ${row.full_name} (id: ${id})`);
          const entity = this.participantsRepository.create({
            id,
            identity_number: row.identity_number,
            full_name: row.full_name,
            email: row.email || null,
            phone: row.phone || null,
            organization: row.organization || null,
            position: row.position || null,
            is_receptionist: row.is_receptionist === true || row.is_receptionist === 'true' || row.is_receptionist === 1 || false
          });
          await this.participantsRepository.save(entity);
        }
        
        success++;
      } catch (error) {
        failed++;
        this.logger.error(`Error importing participant row: ${error.message}`, error.stack, { row });
        errors.push({
          row,
          error: error.message
        });
      }
    }

    this.logger.log(`Excel import completed: ${success} succeeded, ${failed} failed`);
    return { success, failed, errors };
  }
}
