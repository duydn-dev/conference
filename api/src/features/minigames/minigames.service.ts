import { Injectable, NotFoundException, Logger, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigameDto } from './dto/create-minigame.dto';
import { UpdateMinigameDto } from './dto/update-minigame.dto';
import { Minigame, MinigameStatus } from './entities/minigame.entity';
import { MinigamePrizesService } from '../minigame-prizes/minigame-prizes.service';
import { MinigameResultsService } from '../minigame-results/minigame-results.service';
import { EventParticipantsService } from '../event-participants/event-participants.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReceiversService } from '../notification-receivers/notification-receivers.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { ParticipantStatus } from '../event-participants/entities/event-participant.entity';
import { SocketGateway } from '../../common/socket/socket.gateway';
import { SocketService } from '../../common/socket/socket.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigamesService {
  private readonly logger = new Logger(MinigamesService.name);

  constructor(
    @InjectRepository(Minigame)
    private readonly minigamesRepository: Repository<Minigame>,
    private readonly minigamePrizesService: MinigamePrizesService,
    private readonly minigameResultsService: MinigameResultsService,
    @Inject(forwardRef(() => EventParticipantsService))
    private readonly eventParticipantsService: EventParticipantsService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationReceiversService: NotificationReceiversService,
    private readonly socketGateway: SocketGateway,
    private readonly socketService: SocketService,
  ) {}

  async create(dto: CreateMinigameDto): Promise<Minigame> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating minigame: ${dto.name} (id: ${id}, event: ${dto.event_id})`);

    try {
      const entity = this.minigamesRepository.create({
        ...dto,
        id,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
      } as any);
      const saved = await this.minigamesRepository.save(entity) as unknown as Minigame;
      this.logger.log(`Minigame created successfully: ${id} - ${saved.name}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create minigame: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<Minigame[]> {
    this.logger.debug('Finding all minigames');
    const minigames = await this.minigamesRepository.find({
      order: { start_time: 'ASC' },
    });
    this.logger.log(`Found ${minigames.length} minigames`);
    return minigames;
  }

  async findAllWithPagination(
    page = 1, 
    limit = 10, 
    search?: string,
    loadRelations = false,
    event_id?: string,
    status?: number,
  ) {
    this.logger.debug(`Finding minigames with pagination: page=${page}, limit=${limit}, search=${search || 'none'}, relations=${loadRelations}`);
    
    const where: any = {};
    
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    
    if (event_id) {
      where.event_id = event_id;
    }
    
    if (status !== undefined) {
      where.status = status;
    }

    const whereCondition = search && Object.keys(where).length === 1
      ? [
          { name: ILike(`%${search}%`) },
          { type: ILike(`%${search}%`) },
          { event_id: ILike(`%${search}%`) },
        ]
      : where;

    const [items, total] = await this.minigamesRepository.findAndCount({
      where: whereCondition,
      relations: loadRelations ? ['event'] : [],
      order: { start_time: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`Found ${total} minigames (returning ${items.length} items)`);
    
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

  async findOne(id: string, loadRelations = false): Promise<Minigame> {
    this.logger.debug(`Finding minigame by id: ${id}, relations=${loadRelations}`);
    
    const minigame = await this.minigamesRepository.findOne({
      where: { id },
      relations: loadRelations ? ['event'] : [],
    });
    if (!minigame) {
      this.logger.warn(`Minigame not found: ${id}`);
      throw new NotFoundException(`Minigame with id ${id} not found`);
    }
    
    this.logger.debug(`Minigame found: ${id} - ${minigame.name}`);
    return minigame;
  }

  async update(id: string, dto: UpdateMinigameDto): Promise<Minigame> {
    this.logger.log(`Updating minigame: ${id}`);
    
    try {
      const minigame = await this.findOne(id);
      const merged = this.minigamesRepository.merge(minigame, {
        ...dto,
        start_time: dto.start_time ? new Date(dto.start_time as any) : minigame.start_time,
        end_time: dto.end_time ? new Date(dto.end_time as any) : minigame.end_time,
      } as any);
      const updated = await this.minigamesRepository.save(merged);
      this.logger.log(`Minigame updated successfully: ${id} - ${updated.name}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update minigame ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting minigame: ${id}`);
    
    const result = await this.minigamesRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Minigame not found for deletion: ${id}`);
      throw new NotFoundException(`Minigame with id ${id} not found`);
    }

    this.logger.log(`Minigame deleted successfully: ${id}`);
  }

  /**
   * Quay giải thưởng cho minigame
   * Lấy danh sách prizes theo order, quay ngẫu nhiên participants cho mỗi prize
   */
  async drawPrizes(minigameId: string): Promise<Array<{ prize: any; winners: any[] }>> {
    this.logger.log(`Drawing prizes for minigame: ${minigameId}`);

    // Lấy minigame với event_id
    const minigame = await this.findOne(minigameId, true);
    if (!minigame) {
      throw new NotFoundException(`Minigame with id ${minigameId} not found`);
    }

    // Lấy danh sách prizes của minigame, sắp xếp theo order
    const allPrizes = await this.minigamePrizesService.findAll();
    const prizes = allPrizes
      .filter(p => p.minigame_id === minigameId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (prizes.length === 0) {
      throw new BadRequestException('Minigame không có giải thưởng nào');
    }

    // Lấy danh sách participants đã check-in của event (với relations để có thông tin participant)
    const allEventParticipants = await this.eventParticipantsService.findByEventId(minigame.event_id, true);
    console.log('allEventParticipants', allEventParticipants)
    
    // Filter chỉ lấy những người đã check-in
    const checkedInParticipants = allEventParticipants.filter(
      ep => ep.status === ParticipantStatus.CHECKED_IN
    );

    if (checkedInParticipants.length === 0) {
      throw new BadRequestException('Không có người tham gia nào đã check-in');
    }

    const results: Array<{ prize: any; winners: any[] }> = [];
    const usedParticipantIds = new Set<string>();

    // Quay từng giải theo thứ tự order
    for (const prize of prizes) {
      // Lấy số lượng người thắng cho giải này
      const quantity = prize.quantity || 1;
      
      // Lọc ra những participants chưa được quay
      const availableParticipants = checkedInParticipants.filter(
        ep => !usedParticipantIds.has(ep.participant_id)
      );

      if (availableParticipants.length === 0) {
        this.logger.warn(`Không còn người tham gia để quay cho giải: ${prize.prize_name}`);
        results.push({ prize, winners: [] });
        continue;
      }

      // Quay ngẫu nhiên số lượng = quantity (nhưng không quá số lượng available)
      const drawCount = Math.min(quantity, availableParticipants.length);
      const shuffled = [...availableParticipants].sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, drawCount);

      // Lưu kết quả vào database và tạo notification cho mỗi người thắng
      for (const winner of winners) {
        await this.minigameResultsService.create({
          minigame_id: minigameId,
          prize_id: prize.id,
          participant_id: winner.participant_id,
        });
        usedParticipantIds.add(winner.participant_id);

        // Tạo notification cho người trúng thưởng
        try {
          const participant = (winner as any).participant;
          if (participant) {
            const notification = await this.notificationsService.create({
              event_id: minigame.event_id,
              title: `Thông báo về việc trúng giải thưởng`,
              message: `Kính gửi Quý đại biểu,\n\nTrân trọng thông báo Quý đại biểu đã trúng giải "${prize.prize_name}" trong minigame "${minigame.name}" của sự kiện.\n\nQuý đại biểu vui lòng liên hệ Ban tổ chức để nhận giải thưởng.\n\nTrân trọng.`,
              type: NotificationType.REMINDER,
            });

            // Gửi notification cho participant
            this.logger.log(`[MINIGAME] Creating NotificationReceiver for winner ${winner.participant_id}...`);
            try {
              await this.notificationReceiversService.create({
                notification_id: notification.id,
                participant_id: winner.participant_id,
                sent_at: new Date(),
              });
              this.logger.log(`[MINIGAME] ✅ NotificationReceiver created for participant ${winner.participant_id}`);

              // Gửi notification qua Socket.IO
              try {
                const socketIds = this.socketService.getSocketIds(winner.participant_id);
                if (socketIds.length > 0) {
                  socketIds.forEach(socketId => {
                    this.socketGateway.server.to(socketId).emit('notification', {
                      id: notification.id,
                      event_id: notification.event_id,
                      title: notification.title,
                      message: notification.message,
                      type: notification.type,
                      created_at: notification.created_at,
                    });
                  });
                  this.logger.log(`[MINIGAME] ✅ Sent prize notification to participant ${winner.participant_id} via Socket.IO (${socketIds.length} socket(s))`);
                } else {
                  this.logger.debug(`[MINIGAME] Participant ${winner.participant_id} is not connected via Socket.IO`);
                }
              } catch (socketError) {
                this.logger.warn(`[MINIGAME] ⚠️ Failed to send prize notification via Socket.IO: ${socketError.message}`);
              }
            } catch (error) {
              this.logger.error(`[MINIGAME] ❌ Failed to create NotificationReceiver for participant ${winner.participant_id}: ${error.message}`, error.stack);
            }

            this.logger.log(`Created notification for winner: ${participant.full_name} - Prize: ${prize.prize_name}`);
          }
        } catch (error) {
          this.logger.error(`Failed to create notification for winner ${winner.participant_id}: ${error.message}`, error.stack);
          // Không throw error để không làm gián đoạn quá trình quay giải
        }
      }

      // Load thông tin đầy đủ của winners
      // Winners đã có thông tin từ checkedInParticipants (đã load relations)
      const winnerDetails = winners.map((w) => ({
        event_participant_id: w.id,
        participant_id: w.participant_id,
        serial_number: w.serial_number || null, // Số thứ tự khi check-in
        participant: (w as any).participant || null,
      }));

      results.push({
        prize: {
          id: prize.id,
          prize_name: prize.prize_name,
          description: prize.description,
          image: prize.image,
          quantity: prize.quantity,
          order: prize.order,
        },
        winners: winnerDetails,
      });

      this.logger.log(`Drew ${winners.length} winners for prize: ${prize.prize_name}`);
    }

    // Cập nhật status minigame thành FINISHED sau khi quay xong tất cả giải
    try {
      await this.update(minigameId, { status: MinigameStatus.FINISHED } as any);
      this.logger.log(`Updated minigame ${minigameId} status to FINISHED`);
    } catch (error) {
      this.logger.error(`Failed to update minigame status to FINISHED: ${error.message}`, error.stack);
      // Không throw error để không làm gián đoạn kết quả quay giải đã hoàn thành
    }

    this.logger.log(`Finished drawing prizes for minigame: ${minigameId}`);
    return results;
  }
}
