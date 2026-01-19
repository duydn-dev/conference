# Database-First Approach

## Tổng quan

Dự án sử dụng **Database-First** approach với TypeORM:
- Schema được quản lý trực tiếp trong PostgreSQL
- Entities được định nghĩa để map với database schema
- Không sử dụng migrations để tạo schema

## Workflow

### 1. Tạo Database Schema

Chạy SQL script để tạo schema:

```bash
# Với Docker
npm run db:init:docker

# Hoặc thủ công
psql -U postgres -d conference -f server/utils/schema.sql
```

File schema: `server/utils/schema.sql`

### 2. Entities

Entities đã được định nghĩa sẵn trong `server/entities/` để map với database schema.

### 3. Sử dụng trong Code

```typescript
import { getRepository } from '../utils/database'
import { Event } from '../entities/Event.entity'

export default defineEventHandler(async (event) => {
  const eventRepository = await getRepository<Event>(Event)
  const events = await eventRepository.find({
    relations: ['organizerUnit']
  })
  return events
})
```

## Thay đổi Schema

1. **Sửa trực tiếp trong database** (pgAdmin, psql, etc.)
2. **Cập nhật file `schema.sql`** để giữ sync
3. **Cập nhật entities** nếu cần (thêm/sửa fields, relationships)

## Lưu ý

- ⚠️ `synchronize: false` - TypeORM không tự động sync schema
- ⚠️ Luôn backup database trước khi thay đổi schema
- ⚠️ Cập nhật `schema.sql` sau mỗi thay đổi để giữ version control

## So sánh với Code-First

| Database-First | Code-First |
|----------------|------------|
| Schema trong DB | Schema trong code |
| Không cần migrations | Cần migrations |
| Linh hoạt hơn | Type-safe hơn |
| Dễ thay đổi schema | Cần tạo migration |
