import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ParticipantsService } from '../features/participants/participants.service';
import { OrganizerUnitsService } from '../features/organizer-units/organizer-units.service';
import { RSAEncryptHelper } from 'src/common/encryption/rsa-encrypt-helper.service';
import { HttpService } from '@nestjs/axios';
import { IhanoiLoginResponse } from './dto/ihanoi.login.response';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly participantsService: ParticipantsService,
    private readonly organizerUnitsService: OrganizerUnitsService,
    private readonly rsaEncryptHelper: RSAEncryptHelper,
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log('LoginDto:', loginDto);
    const encryptedPassword = this.rsaEncryptHelper.genaratePassword(loginDto.password);
    
    // Lấy và validate URL
    const iHanoiUrl = this.configService.get<string>('IHANOI_API');
    if (!iHanoiUrl || !iHanoiUrl.trim()) {
      throw new Error('IHANOI_API chưa được cấu hình trong file .env. Vui lòng thêm biến môi trường IHANOI_API.');
    }

    // Validate URL format
    try {
      new URL(iHanoiUrl);
    } catch (error) {
      throw new Error(`IHANOI_API không hợp lệ: ${iHanoiUrl}. Vui lòng kiểm tra lại cấu hình.`);
    }

    this.logger.log(`Calling iHanoi API: ${iHanoiUrl}`);
    
    try {
      // Gọi API iHanoi để login
      const response = await firstValueFrom(
        this.httpService.post<IhanoiLoginResponse>(
          iHanoiUrl + "api/1.0/login",
          {
            username: loginDto.username,
            password: encryptedPassword,
            captcha: "",
            captchaToken: ""
          }
        )
      );

      const ihanoiData = response.data;
      const identificationNo = ihanoiData.user.identification_no;

      if (!identificationNo) {
        throw new Error('Không tìm thấy identification_no trong response');
      }

      // Xử lý department từ iHanoi response - tạo organizer unit nếu chưa có
      if (ihanoiData.user.department) {
        try {
          let organizerUnit = await this.organizerUnitsService.findByName(ihanoiData.user.department);
          
          if (!organizerUnit) {
            // Tạo mới organizer unit nếu chưa có
            this.logger.log(`Creating new organizer unit: ${ihanoiData.user.department}`);
            organizerUnit = await this.organizerUnitsService.create({
              id: uuidv4(),
              name: ihanoiData.user.department,
            });
            this.logger.log(`Organizer unit created successfully: ${organizerUnit.id} - ${organizerUnit.name}`);
          } else {
            this.logger.debug(`Organizer unit already exists: ${organizerUnit.id} - ${organizerUnit.name}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to process organizer unit: ${error.message}`);
          // Không throw error để không làm fail login process
        }
      }

      // Kiểm tra participant theo identification_no (identity_number trong DB)
      let participant = await this.participantsService.findByIdentityNumber(identificationNo);

      // Map dữ liệu từ API sang participant
      const participantData = {
        identity_number: identificationNo,
        full_name: ihanoiData.user.fullname,
        email: ihanoiData.user.email || undefined,
        phone: ihanoiData.user.phone || ihanoiData.user.cell || undefined,
        organization: ihanoiData.user.department || undefined,
        position: ihanoiData.user.position || undefined,
      };

      if (participant) {
        // TH1: Đã có participant -> Update
        this.logger.log(`Updating existing participant: ${participant.id} - ${participant.full_name}`);
        participant = await this.participantsService.update(participant.id, participantData);
      } else {
        // TH2: Chưa có participant -> Create
        this.logger.log(`Creating new participant: ${identificationNo} - ${participantData.full_name}`);
        participant = await this.participantsService.create({
          ...participantData,
          id: uuidv4(),
        });
      }

      // Map sang LoginResponseDto
      const loginResponse: LoginResponseDto = {
        user: {
          id: participant.id,
          email: participant.email || '',
          fullname: participant.full_name,
          sdt: participant.phone || '',
          identity_number: participant.identity_number,
        },
        token: '', // Sẽ được gán sau
      };

      // Generate JWT token
      const jwtPayload = {
        sub: participant.id,
        email: participant.email,
        identity_number: participant.identity_number,
      };
      loginResponse.token = this.jwtService.sign(jwtPayload);

      this.logger.log(`Login successful for participant: ${participant.id} - ${participant.full_name}`);
      return loginResponse;
    } catch (error: any) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      
      // Xử lý các loại lỗi khác nhau
      if (error.code === 'ERR_INVALID_URL' || error.message?.includes('Invalid URL')) {
        throw new Error(`URL không hợp lệ: ${iHanoiUrl}. Vui lòng kiểm tra biến môi trường IHANOI_API.`);
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(`Không thể kết nối đến iHanoi API tại ${iHanoiUrl}. Vui lòng kiểm tra kết nối mạng và URL.`);
      }
      
      const errorMessage = error?.response?.data?.message || error.message || 'Đăng nhập thất bại';
      throw new Error(errorMessage);
    }
  }
}