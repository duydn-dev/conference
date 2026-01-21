import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventParticipantDto } from './dto/create-event-participant.dto';
import { UpdateEventParticipantDto } from './dto/update-event-participant.dto';
import { EventParticipant, ImportSource, ParticipantStatus } from './entities/event-participant.entity';
import { ParticipantsService } from '../participants/participants.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReceiversService } from '../notification-receivers/notification-receivers.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventParticipantsService {
  private readonly logger = new Logger(EventParticipantsService.name);

  constructor(
    @InjectRepository(EventParticipant)
    private readonly eventParticipantsRepository: Repository<EventParticipant>,
    @Inject(forwardRef(() => ParticipantsService))
    private readonly participantsService: ParticipantsService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationReceiversService))
    private readonly notificationReceiversService: NotificationReceiversService,
  ) {}

  async create(dto: CreateEventParticipantDto): Promise<EventParticipant> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating event-participant: event=${dto.event_id}, participant=${dto.participant_id} (id: ${id})`);
    
    try {
      // Tạo số ngẫu nhiên từ 1000 đến 999999 nếu không được cung cấp
      const serial_number = dto.serial_number ?? Math.floor(Math.random() * (999999 - 1000 + 1)) + 1000;
      const entity = this.eventParticipantsRepository.create({
        ...dto,
        id,
        serial_number,
        checkin_time: dto.checkin_time ? new Date(dto.checkin_time) : null,
        checkout_time: dto.checkout_time ? new Date(dto.checkout_time) : null,
      } as any);
      const saved = await this.eventParticipantsRepository.save(entity) as unknown as EventParticipant;
      this.logger.log(`Event-participant created successfully: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create event-participant: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<EventParticipant[]> {
    this.logger.debug('Finding all event-participants');
    const participants = await this.eventParticipantsRepository.find({
      order: { created_at: 'DESC' },
    });
    this.logger.log(`Found ${participants.length} event-participants`);
    return participants;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding event-participants with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
    const where = search
      ? [
          { event_id: ILike(`%${search}%`) },
          { participant_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.eventParticipantsRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`Found ${total} event-participants (returning ${items.length} items)`);
    
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

  async findOne(id: string): Promise<EventParticipant> {
    this.logger.debug(`Finding event-participant by id: ${id}`);
    
    const eventParticipant = await this.eventParticipantsRepository.findOne({
      where: { id },
    });
    if (!eventParticipant) {
      this.logger.warn(`Event-participant not found: ${id}`);
      throw new NotFoundException(`EventParticipant with id ${id} not found`);
    }
    
    this.logger.debug(`Event-participant found: ${id}`);
    return eventParticipant;
  }

  async findByEventId(eventId: string): Promise<EventParticipant[]> {
    this.logger.debug(`Finding event-participants by event id: ${eventId}`);
    
    const eventParticipants = await this.eventParticipantsRepository.find({
      where: { event_id: eventId },
    });
    
    this.logger.log(`Found ${eventParticipants.length} event-participants for event ${eventId}`);
    return eventParticipants;
  }

  async update(id: string, dto: UpdateEventParticipantDto): Promise<EventParticipant> {
    this.logger.log(`Updating event-participant: ${id}`);
    
    try {
      const eventParticipant = await this.findOne(id);
      const merged = this.eventParticipantsRepository.merge(eventParticipant, {
        ...dto,
        checkin_time: dto.checkin_time ? new Date(dto.checkin_time as any) : eventParticipant.checkin_time,
        checkout_time: dto.checkout_time ? new Date(dto.checkout_time as any) : eventParticipant.checkout_time,
      } as any);
      const updated = await this.eventParticipantsRepository.save(merged);
      this.logger.log(`Event-participant updated successfully: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update event-participant ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting event-participant: ${id}`);
    
    const result = await this.eventParticipantsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Event-participant not found for deletion: ${id}`);
      throw new NotFoundException(`EventParticipant with id ${id} not found`);
    }

    this.logger.log(`Event-participant deleted successfully: ${id}`);
  }

  async importFromExcel(eventId: string, data: any[]): Promise<{ success: number; failed: number; errors: any[]; participants: any[] }> {
    this.logger.log(`Starting Excel import for event ${eventId} with ${data.length} rows`);
    
    let success = 0;
    let failed = 0;
    const errors: any[] = [];
    const participants: any[] = [];

    // Normalize Excel column names (map Vietnamese to English)
    const normalizeRow = (row: any) => {
      // Map Vietnamese column names to English
      const normalized: any = {};
      
      // Identity number - can be from multiple column names
      normalized.identity_number = row['Số CCCD/ID (*)'] || row['Số CCCD/ID'] || row['identity_number'] || row['identityNumber'];
      
      // Full name
      normalized.full_name = row['Họ và tên (*)'] || row['Họ và tên'] || row['full_name'] || row['fullName'];
      
      // Email
      normalized.email = row['Email'] || row['email'] || null;
      
      // Phone
      normalized.phone = row['Số điện thoại'] || row['phone'] || row['phoneNumber'] || null;
      
      // Organization - normalize to lowercase for comparison
      normalized.organization = row['Tổ chức'] || row['organization'] || null;
      
      // Position
      normalized.position = row['Chức vụ'] || row['position'] || null;
      
      // Receptionist flag
      const receptionistValue = row['Cần đón tiếp?'] || row['is_receptionist'] || row['isReceptionist'] || false;
      normalized.is_receptionist = receptionistValue === 'X' || receptionistValue === 'x' || 
                                    receptionistValue === true || receptionistValue === 1 || 
                                    receptionistValue === 'true' || receptionistValue === '1';
      
      return normalized;
    };

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      try {
        const normalizedRow = normalizeRow(row);
        
        // Validate required fields
        if ((!normalizedRow.identity_number && !normalizedRow.phone) || !normalizedRow.full_name) {
          failed++;
          const errorMsg = 'Thiếu thông tin bắt buộc: Số CCCD/ID hoặc Số điện thoại, và Họ và tên';
          this.logger.warn(`Row ${index + 1}: ${errorMsg}`, { row: normalizedRow });
          errors.push({
            row: index + 1,
            data: normalizedRow,
            error: errorMsg
          });
          continue;
        }

        // Check if participant already exists by identity_number or phone
        let participant = await this.participantsService.findByIdentityNumberOrPhone(
          normalizedRow.identity_number,
          normalizedRow.phone
        );

        if (!participant) {
          // Check if organization exists (case-insensitive comparison)
          if (normalizedRow.organization) {
            const normalizedOrg = normalizedRow.organization.toLowerCase().trim();
            const existingParticipantsWithOrg = await this.participantsService.findByOrganization(normalizedOrg);
            
            // If organization exists, use the same organization format from existing participant
            if (existingParticipantsWithOrg.length > 0) {
              normalizedRow.organization = existingParticipantsWithOrg[0].organization;
            }
          }

          // If no identity_number but has phone, generate identity_number from phone
          let identityNumber = normalizedRow.identity_number;
          if (!identityNumber && normalizedRow.phone) {
            // Use phone as identity_number if no identity_number provided
            identityNumber = `PHONE_${normalizedRow.phone.trim()}`;
          } else if (!identityNumber) {
            // Generate a unique identity_number if neither is provided
            identityNumber = `AUTO_${uuidv4()}`;
          }

          // Create new participant
          const participantId = uuidv4();
          participant = await this.participantsService.create({
            id: participantId,
            identity_number: identityNumber,
            full_name: normalizedRow.full_name,
            email: normalizedRow.email || null,
            phone: normalizedRow.phone || null,
            organization: normalizedRow.organization || null,
            position: normalizedRow.position || null,
            is_receptionist: normalizedRow.is_receptionist || false,
          });
        } else {
          // Participant exists - update information if needed
          const updateData: any = {};
          if (normalizedRow.full_name && normalizedRow.full_name !== participant.full_name) {
            updateData.full_name = normalizedRow.full_name;
          }
          if (normalizedRow.email && normalizedRow.email !== participant.email) {
            updateData.email = normalizedRow.email;
          }
          if (normalizedRow.phone && normalizedRow.phone !== participant.phone) {
            updateData.phone = normalizedRow.phone;
          }
          if (normalizedRow.organization) {
            const normalizedOrg = normalizedRow.organization.toLowerCase().trim();
            const participantOrg = participant.organization?.toLowerCase().trim() || '';
            
            // If organization doesn't match (case-insensitive), update it
            if (participantOrg !== normalizedOrg) {
              // Check if organization exists in other participants (already normalized)
              const existingParticipantsWithOrg = await this.participantsService.findByOrganization(normalizedRow.organization);
              if (existingParticipantsWithOrg.length > 0) {
                // Use the organization format from existing participant
                updateData.organization = existingParticipantsWithOrg[0].organization;
              } else {
                // Use the organization from Excel as-is (will be normalized in findByOrganization)
                updateData.organization = normalizedRow.organization;
              }
            }
          }
          if (normalizedRow.position && normalizedRow.position !== participant.position) {
            updateData.position = normalizedRow.position;
          }
          if (normalizedRow.is_receptionist !== undefined) {
            updateData.is_receptionist = normalizedRow.is_receptionist;
          }

          if (Object.keys(updateData).length > 0) {
            participant = await this.participantsService.update(participant.id, updateData);
          }
        }

        // Check if event-participant relationship already exists
        const existingEventParticipant = await this.eventParticipantsRepository.findOne({
          where: {
            event_id: eventId,
            participant_id: participant.id,
          },
        });

        if (!existingEventParticipant) {
          // Create new event-participant relationship
          const eventParticipantId = uuidv4();
          const serialNumber = Math.floor(Math.random() * (999999 - 1000 + 1)) + 1000;
          
          await this.eventParticipantsRepository.save({
            id: eventParticipantId,
            event_id: eventId,
            participant_id: participant.id,
            status: 0, // REGISTERED
            source: ImportSource.EXCEL_IMPORT,
            serial_number: serialNumber,
          } as EventParticipant);

          participants.push(participant);
          success++;
          this.logger.debug(`Created event-participant for participant ${participant.id} in event ${eventId}`);
        } else {
          // Relationship already exists, but participant is processed
          participants.push(participant);
          success++;
          this.logger.debug(`Event-participant already exists for participant ${participant.id} in event ${eventId}`);
        }
      } catch (error) {
        failed++;
        const errorMsg = error.message || 'Lỗi không xác định';
        this.logger.error(`Error processing row ${index + 1}: ${errorMsg}`, error.stack, {
          row: index + 1,
          data: row,
          error: errorMsg
        });
        errors.push({
          row: index + 1,
          data: row,
          error: errorMsg
        });
      }
    }

    this.logger.log(`Excel import completed for event ${eventId}: ${success} succeeded, ${failed} failed`);
    return { success, failed, errors, participants };
  }

  /**
   * Check-in participant và cấp số thứ tự
   * Nếu participant là receptionist, gửi thông báo cho representative của event
   */
  async checkIn(id: string): Promise<EventParticipant> {
    this.logger.log(`Checking in event-participant: ${id}`);

    // Lấy event participant với relations
    const eventParticipant = await this.eventParticipantsRepository.findOne({
      where: { id },
      relations: ['participant', 'event'],
    });

    if (!eventParticipant) {
      throw new NotFoundException(`EventParticipant with id ${id} not found`);
    }

    // Kiểm tra đã check-in chưa
    if (eventParticipant.status === ParticipantStatus.CHECKED_IN) {
      throw new BadRequestException('Participant đã được check-in rồi');
    }

    // Đếm số người đã check-in trong event để cấp serial_number
    const checkedInCount = await this.eventParticipantsRepository.count({
      where: {
        event_id: eventParticipant.event_id,
        status: ParticipantStatus.CHECKED_IN,
      },
    });

    const serialNumber = checkedInCount + 1;
    const checkinTime = new Date();

    // Cập nhật event participant
    eventParticipant.status = ParticipantStatus.CHECKED_IN;
    eventParticipant.checkin_time = checkinTime;
    eventParticipant.serial_number = serialNumber;

    const updated = await this.eventParticipantsRepository.save(eventParticipant);

    // Kiểm tra participant có phải là receptionist không
    const participant = await this.participantsService.findOne(eventParticipant.participant_id);
    
    if (participant.is_receptionist && eventParticipant.event.representative_identity) {
      // Tìm representative của event
      const representative = await this.participantsService.findByIdentityNumber(
        eventParticipant.event.representative_identity
      );

      if (representative) {
        // Tạo thông báo
        const notification = await this.notificationsService.create({
          event_id: eventParticipant.event_id,
          title: `Người đón tiếp đã đến sự kiện`,
          message: `${participant.full_name} (${participant.identity_number}) đã check-in vào sự kiện ${eventParticipant.event.name} với số thứ tự ${serialNumber}`,
          type: NotificationType.REMINDER,
        });

        // Gửi thông báo cho representative
        await this.notificationReceiversService.create({
          notification_id: notification.id,
          participant_id: representative.id,
          sent_at: new Date(),
        });

        this.logger.log(`Sent notification to representative ${representative.id} about receptionist check-in`);
      }
    }

    this.logger.log(`Event-participant checked in successfully: ${id} with serial number ${serialNumber}`);
    return updated;
  }
}
