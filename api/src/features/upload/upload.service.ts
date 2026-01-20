import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // Service có thể thêm logic xử lý file sau này
  // ví dụ: resize ảnh, tối ưu hóa, upload lên cloud storage, etc.
  
  // Example method với logging
  async processFile(filename: string): Promise<void> {
    this.logger.log(`Processing file: ${filename}`);
    // TODO: Implement file processing logic
  }
}
