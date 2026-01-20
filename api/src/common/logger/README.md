# Logger Module

Logger module sử dụng Winston để ghi log ra file txt tương tự Serilog của .NET.

## Cấu hình

Logger được cấu hình tự động khi ứng dụng khởi động. Logs được ghi vào thư mục `logs/` trong thư mục gốc của API.

### File logs được tạo:

- `application-YYYY-MM-DD.log`: Tất cả logs (debug, info, warn, error)
- `error-YYYY-MM-DD.log`: Chỉ logs lỗi (error level)

### Format log:

```
[YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [Context] Message metadata
```

Ví dụ:
```
[2024-01-15 10:30:45.123] [INFO] [EventParticipantsService] Starting Excel import for event abc-123 with 10 rows
[2024-01-15 10:30:45.456] [ERROR] [EventParticipantsService] Error processing row 5: Invalid data
```

## Cách sử dụng

### 1. Sử dụng Logger trong Service/Controller

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  someMethod() {
    this.logger.log('This is a log message');
    this.logger.warn('This is a warning');
    this.logger.error('This is an error', 'Stack trace here');
    this.logger.debug('This is a debug message');
  }
}
```

### 2. Log với context và metadata

```typescript
this.logger.log(`Processing user ${userId}`, { userId, action: 'update' });
this.logger.error(`Failed to save data`, error.stack, { userId, data });
```

### 3. Log levels

- `log()`: Thông tin chung
- `warn()`: Cảnh báo
- `error()`: Lỗi (có thể kèm stack trace)
- `debug()`: Debug (chỉ trong development)
- `verbose()`: Chi tiết (chỉ trong development)

## Log Rotation

- Logs được rotate hàng ngày
- Mỗi file log tối đa 20MB
- Giữ lại logs trong 14 ngày (application) và 30 ngày (error)
- Tự động xóa logs cũ

## Environment

- Development: Logs hiển thị cả trên console và file
- Production: Chỉ ghi vào file
