import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ParticipantsService } from '../participants/participants.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly participantsService: ParticipantsService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for username: ${loginDto.username}`);
    
    try {
      // TODO: Implement actual authentication logic
      const response = {
        token: 'accessToken',
        user: {
          id: '1',
          username: 'john.doe',
          email: 'john.doe@example.com',
          name: 'John Doe',
        },
      };
      
      // Đồng bộ thông tin khách mời vào bảng participants nếu có gửi kèm
      await this.syncParticipantFromLogin(loginDto);

      this.logger.log(`Login successful for username: ${loginDto.username}`);
      return Promise.resolve(response);
    } catch (error) {
      this.logger.error(`Login failed for username: ${loginDto.username}`, error.stack, { username: loginDto.username });
      throw error;
    }
  }

  /**
   * Nếu client gửi kèm full_name, phone, identity_number khi login thì:
   * - Tìm trong bảng participants theo identity_number hoặc phone
   * - Nếu chưa có thì tạo mới bản ghi participant tương ứng
   */
  private async syncParticipantFromLogin(loginDto: LoginDto): Promise<void> {
    const { full_name, phone, identity_number } = loginDto;

    // Không có đủ dữ liệu thì bỏ qua
    if (!full_name || (!identity_number && !phone)) {
      return;
    }

    try {
      const existing = await this.participantsService.findByIdentityNumberOrPhone(
        identity_number,
        phone,
      );

      if (existing) {
        this.logger.debug(
          `Participant already exists for login (id=${existing.id}, identity=${existing.identity_number}, phone=${existing.phone})`,
        );
        return;
      }

      // Tạo mới participant tối thiểu với các thông tin có được từ login
      await this.participantsService.create({
        full_name,
        identity_number: identity_number || `AUTO-${Date.now()}`,
        phone: phone || null,
        email: null,
        organization: null,
        position: null,
        is_receptionist: false,
      } as any);

      this.logger.log(
        `Created new participant from login (full_name=${full_name}, identity_number=${identity_number}, phone=${phone})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to sync participant from login: ${error.message}`,
        error.stack,
        { full_name, phone, identity_number },
      );
      // Không throw để không làm fail luồng login, chỉ log lỗi
    }
  }
}
