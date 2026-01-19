# Database Setup với TypeORM (Database-First)

> 📖 Xem chi tiết schema tại [DATABASE.md](./DATABASE.md)

## Database-First Approach

Dự án sử dụng **Database-First** approach:
- Schema được quản lý trực tiếp trong PostgreSQL
- Entities được tạo từ database schema có sẵn
- Không sử dụng migrations để tạo schema

## Cấu trúc Files

- **`database.ts`** - File chính để sử dụng trong code (API, plugins, etc.)
  - `getDataSource()` - Lấy DataSource instance
  - `getRepository()` - Helper để lấy repository
  - `closeDataSource()` - Đóng connection

- **`data-source.ts`** - DataSource configuration
  - `AppDataSource` - Export DataSource
  - Không dùng migrations (database-first)

- **`schema.sql`** - SQL script để tạo database schema

## Setup PostgreSQL

1. **Cài đặt PostgreSQL** (nếu chưa có):
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Tạo database**:
   ```sql
   CREATE DATABASE conference;
   ```

3. **Tạo schema từ SQL script**:
   
   **Với Docker:**
   ```bash
   npm run db:init:docker
   ```
   
   **Hoặc thủ công:**
   ```bash
   psql -U postgres -d conference -f server/utils/schema.sql
   ```
   
   Hoặc chạy trực tiếp trong pgAdmin hoặc psql:
   ```sql
   -- Copy và paste nội dung từ server/utils/schema.sql
   ```

4. **Cấu hình biến môi trường** (`.env`):
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=conference
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

## Sử dụng TypeORM

### Tạo Entity

```typescript
// server/entities/User.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string
}
```

### Sử dụng trong API

```typescript
// server/api/users.get.ts
import { getRepository } from '../utils/database'
import { User } from '../entities/User.entity'

export default defineEventHandler(async (event) => {
  const userRepository = await getRepository<User>(User)
  const users = await userRepository.find()
  return users
})
```

## Database-First Workflow

### 1. Tạo/Update Schema trong Database

Sửa trực tiếp trong PostgreSQL hoặc chạy SQL script:

```bash
# Chạy schema script
npm run db:init:docker
```

### 2. Generate Entities từ Database (Optional)

Nếu muốn generate entities từ database:

```bash
# Cần cài typeorm-model-generator hoặc dùng TypeORM CLI
npx typeorm-model-generator -h localhost -d conference -u postgres -x postgres -e postgres -o server/entities
```

### 3. Sử dụng Entities

Entities đã được định nghĩa sẵn trong `server/entities/`. Chỉ cần sử dụng trực tiếp.

## Lợi ích của Database-First

✅ **Schema Control** - Quản lý schema trực tiếp trong database
✅ **Flexibility** - Dễ dàng thay đổi schema mà không cần migrations
✅ **Type Safety** - TypeScript support đầy đủ với entities
✅ **Relations** - Dễ dàng định nghĩa relationships
✅ **Query Builder** - Type-safe query builder
✅ **No Migration Conflicts** - Không cần quản lý migration files

## So sánh với Raw SQL

**Raw SQL (cũ):**
```typescript
const result = await query('SELECT * FROM users WHERE id = $1', [1])
```

**TypeORM (mới):**
```typescript
const user = await userRepository.findOne({ where: { id: 1 } })
```
