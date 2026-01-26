import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { readFileSync } from 'fs';
import { join } from 'path';
const XLSX = require('xlsx');

@Controller('participants')
export class ParticipantsController {
  private readonly logger = new Logger(ParticipantsController.name);

  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.participantsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get('import-template')
  async downloadImportTemplate(@Res() res: Response) {
    this.logger.log('Downloading import template');
    
    try {
      // Đọc file template có sẵn từ thư mục templates
      // Trong production: __dirname = dist/participants, cần lên 1 level để đến dist/templates
      // Trong development: __dirname = dist/participants (sau build) hoặc src/participants (khi chạy ts-node)
      let templatePath = join(__dirname, '..', '..', 'templates', 'import-khachmoi.xlsx');
      
      // Kiểm tra file có tồn tại không, nếu không thử đường dẫn khác
      try {
        readFileSync(templatePath);
      } catch {
        // Thử đường dẫn từ process.cwd() (root của project)
        templatePath = join(process.cwd(), 'dist', 'templates', 'import-khachmoi.xlsx');
        // Nếu vẫn không có, thử từ src (development)
        try {
          readFileSync(templatePath);
        } catch {
          templatePath = join(process.cwd(), 'src', 'templates', 'import-khachmoi.xlsx');
        }
      }
      
      this.logger.debug(`Reading template file from: ${templatePath}`);
      
      const fileBuffer = readFileSync(templatePath);
      
      this.logger.log(`Template file loaded, size: ${fileBuffer.length} bytes`);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="import-khachmoi.xlsx"',
      );
      res.setHeader('Content-Length', fileBuffer.length.toString());

      res.send(fileBuffer);
    } catch (error) {
      this.logger.error(`Error reading template file: ${error.message}`, error.stack, {
        __dirname,
        cwd: process.cwd(),
        attemptedPaths: [
          join(__dirname, '..', '..', 'templates', 'import-khachmoi.xlsx'),
          join(process.cwd(), 'dist', 'templates', 'import-khachmoi.xlsx'),
          join(process.cwd(), 'src', 'templates', 'import-khachmoi.xlsx'),
        ],
      });
      res.status(500).json({
        message: 'Lỗi khi đọc file template',
        error: error.message,
      });
    }
  }

  @Get('by-identity')
  async findByIdentityNumber(@Query('identityNumber') identityNumber: string) {
    const participant = await this.participantsService.findByIdentityNumber(identityNumber);
    if (!participant) {
      throw new BadRequestException(`Participant with identity number ${identityNumber} not found`);
    }
    return participant;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParticipantDto: UpdateParticipantDto) {
    return this.participantsService.update(id, updateParticipantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.participantsService.remove(id);
  }

  @Post('by-identities')
  async findByIdentities(@Body('identity_numbers') identityNumbers: string[]) {
    if (!Array.isArray(identityNumbers) || identityNumbers.length === 0) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.participantsService.findByIdentityNumbers(identityNumbers);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    this.logger.log(`Importing Excel file: ${file.originalname}`);
    
    try {
      // Parse Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        throw new BadRequestException('File Excel rỗng');
      }
      console.log('jsonData', jsonData);
      // Import data
      const result = await this.participantsService.importFromExcel(jsonData);

      return {
        message: 'Import thành công',
        total: jsonData.length,
        ...result,
      };
    } catch (error) {
      throw new BadRequestException(`Lỗi khi import Excel: ${error.message}`);
    }
  }
}
