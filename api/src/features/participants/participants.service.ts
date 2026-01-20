import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
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

  async findByIdentityNumbers(identityNumbers: string[]): Promise<Participant[]> {
    if (!identityNumbers || identityNumbers.length === 0) {
      return [];
    }

    const trimmed = identityNumbers
      .map((v) => v?.toString().trim())
      .filter((v) => !!v);

    if (trimmed.length === 0) {
      return [];
    }

    return this.participantsRepository.find({
      where: {
        identity_number: In(trimmed),
      },
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

  /**
   * Chuẩn hoá dữ liệu Excel về dạng object participant:
   * { identity_number, full_name, email, phone, organization, position, is_receptionist }
   *
   * Hỗ trợ cả 2 dạng:
   *  - Đã là dữ liệu chuẩn (đã có identity_number, full_name, ...)
   *  - Dữ liệu đọc từ Excel có header tiếng Việt giống ví dụ jsonData của FE.
   */
  private normalizeExcelData(data: any[]): any[] {
    if (!data || data.length === 0) {
      return [];
    }

    const firstRow = data[0];
    const headerValues = Object.values(firstRow || {}).map((v) => (v ?? '').toString().trim());

    const looksLikeHeader =
      headerValues.some((v) => /Số CCCD\/ID/i.test(v)) &&
      headerValues.some((v) => /Họ và tên/i.test(v));

    // Nếu không phải dạng header tiếng Việt, coi như data đã chuẩn rồi
    if (!looksLikeHeader) {
      return data;
    }

    // Map key trong JSON (Import danh sách khách mời, __EMPTY, __EMPTY_1, ...) -> field name
    const keyToField: Record<string, keyof Omit<Participant, 'id' | 'created_at'>> = {};

    for (const [key, rawHeader] of Object.entries(firstRow)) {
      const header = (rawHeader ?? '').toString().trim();

      if (/Số CCCD\/ID/i.test(header)) {
        keyToField[key] = 'identity_number';
      } else if (/Họ và tên/i.test(header)) {
        keyToField[key] = 'full_name';
      } else if (/Email/i.test(header)) {
        keyToField[key] = 'email';
      } else if (/Số điện thoại/i.test(header)) {
        keyToField[key] = 'phone';
      } else if (/Tổ chức/i.test(header)) {
        keyToField[key] = 'organization';
      } else if (/Chức vụ/i.test(header)) {
        keyToField[key] = 'position';
      } else if (/Cần đón tiếp\?/i.test(header)) {
        keyToField[key] = 'is_receptionist';
      }
    }

    const normalized: any[] = [];

    // Bỏ qua hàng header (index 0), xử lý các hàng dữ liệu
    for (let i = 1; i < data.length; i++) {
      const row = data[i] || {};
      const out: any = {};

      for (const [colKey, field] of Object.entries(keyToField)) {
        const rawValue = (row as any)[colKey];
        if (rawValue === undefined || rawValue === null) continue;

        if (field === 'is_receptionist') {
          const v = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
          out.is_receptionist =
            v === 'X' ||
            v === 'x' ||
            v === true ||
            v === 1 ||
            v === 'true' ||
            v === '1';
        } else {
          out[field] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        }
      }

      // Bỏ qua hàng trống hoàn toàn
      if (!out.identity_number && !out.full_name) {
        continue;
      }

      normalized.push(out);
    }

    return normalized;
  }

  async importFromExcel(
    data: any[],
  ): Promise<{ success: number; failed: number; errors: any[]; identity_numbers: string[] }> {
    this.logger.log(`Starting Excel import for participants with ${data.length} raw rows`);

    const normalizedData = this.normalizeExcelData(data);
    this.logger.log(`Normalized Excel data into ${normalizedData.length} participant rows`);
    
    let success = 0;
    let failed = 0;
    const errors: any[] = [];
    const identityNumbers: string[] = [];

    for (const row of normalizedData) {
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

        // Chuẩn hoá identity_number dùng cho log + trả về
        const identityNumber = String(row.identity_number).trim();

        // Check if participant already exists
        const existing = await this.participantsRepository.findOne({
        where: { identity_number: identityNumber },
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
            is_receptionist:
              row.is_receptionist === true ||
              row.is_receptionist === 'true' ||
              row.is_receptionist === 1 ||
              false,
          });
          await this.participantsRepository.save(merged);
        } else {
          // Create new participant
          const id = uuidv4();
          this.logger.debug(`Creating new participant: ${row.full_name} (id: ${id})`);
          const entity = this.participantsRepository.create({
            id,
            identity_number: identityNumber,
            full_name: row.full_name,
            email: row.email || null,
            phone: row.phone || null,
            organization: row.organization || null,
            position: row.position || null,
            is_receptionist:
              row.is_receptionist === true ||
              row.is_receptionist === 'true' ||
              row.is_receptionist === 1 ||
              false,
          });
          await this.participantsRepository.save(entity);
        }
        
        success++;
        if (identityNumber) {
          identityNumbers.push(identityNumber);
        }
      } catch (error) {
        failed++;
        this.logger.error(`Error importing participant row: ${error.message}`, error.stack, { row });
        errors.push({
          row,
          error: error.message
        });
      }
    }

    this.logger.log(
      `Excel import completed: ${success} succeeded, ${failed} failed, ${identityNumbers.length} identity_numbers collected`,
    );
    return { success, failed, errors, identity_numbers: identityNumbers };
  }
}
