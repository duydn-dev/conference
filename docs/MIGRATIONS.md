# Database Migrations Guide

Hướng dẫn sử dụng hệ thống migration để quản lý database schema.

## Tổng quan

Hệ thống migration cho phép bạn:
- Tự động sync database từ entities
- Quản lý các thay đổi schema một cách có kiểm soát
- Rollback các thay đổi khi cần thiết
- Theo dõi lịch sử thay đổi database

## Cài đặt

Không cần cài đặt thêm, các dependencies đã có sẵn trong project.

## Các lệnh Migration

### 1. Sync Database từ Entities (Tự động)

Lệnh này sẽ tự động so sánh các entity với database hiện tại và thêm các columns/tables còn thiếu:

```bash
npm run migration:sync
```

**Khi nào sử dụng:**
- Khi bạn đã thêm field mới vào entity và muốn sync với database
- Khi bạn muốn đảm bảo database đã có đầy đủ các columns theo định nghĩa trong entities
- Trong môi trường development

**Ví dụ output:**
```
Found 11 entity files:
  - \participants\entities\participant.entity.ts
  - \events\entities\event.entity.ts
  ...

⚠️  Column is_receptionist is missing in participants table
Running migration to add is_receptionist column...
✅ Column is_receptionist added successfully
✅ Database sync completed!
```

### 2. Chạy Migrations Thủ công

Chạy tất cả các migration files chưa được apply:

```bash
npm run migration:run
```

**Khi nào sử dụng:**
- Khi bạn có các migration files đã được tạo sẵn
- Khi deploy lên production
- Khi muốn apply các thay đổi từ migration files cụ thể

**Lưu ý:**
- Script sẽ tự động tìm tất cả migration files trong `src/migrations/`
- Chỉ chạy các migrations chưa được apply
- Migrations sẽ được chạy theo thứ tự timestamp

### 3. Generate Migration Mới

Tạo migration file mới từ sự khác biệt giữa entities và database:

```bash
npm run migration:generate -- MigrationName
```

**Ví dụ:**
```bash
npm run migration:generate -- AddIsReceptionistToParticipants
```

**Khi nào sử dụng:**
- Khi bạn muốn tạo migration file để review trước khi apply
- Khi bạn muốn version control các thay đổi database
- Trong môi trường production

**Lưu ý:**
- Migration name phải là PascalCase
- File sẽ được tạo trong `src/migrations/` với format: `{timestamp}-{MigrationName}.ts`

### 4. Revert Migration Cuối cùng

Hoàn tác migration cuối cùng đã được apply:

```bash
npm run migration:revert
```

**Khi nào sử dụng:**
- Khi migration gây ra lỗi và bạn muốn rollback
- Khi bạn muốn test lại migration

**Lưu ý:**
- Chỉ revert migration cuối cùng
- Đảm bảo backup database trước khi revert

## Cấu trúc Migration Files

Migration files được lưu trong `api/src/migrations/` với format:

```
{timestamp}-{MigrationName}.ts
```

Ví dụ: `1705740000000-AddIsReceptionistToParticipants.ts`

### Cấu trúc Migration Class

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1705740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Code để apply migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Code để revert migration
  }
}
```

## Workflow Khuyến nghị

### Development Environment

1. Thêm/sửa field trong entity
2. Chạy `npm run migration:sync` để tự động sync database
3. Test các thay đổi

### Production Environment

1. Thêm/sửa field trong entity
2. Chạy `npm run migration:generate -- MigrationName` để tạo migration file
3. Review migration file
4. Commit migration file vào git
5. Deploy code
6. Chạy `npm run migration:run` để apply migration

## Troubleshooting

### Lỗi: Column already exists

Nếu bạn gặp lỗi "column already exists" khi chạy migration:

```bash
# Kiểm tra xem column đã tồn tại chưa
npm run migration:sync
```

Script sync sẽ tự động skip các columns đã tồn tại.

### Lỗi: Cannot find migration file

Đảm bảo migration files nằm trong `api/src/migrations/` và có extension `.ts`.

### Lỗi: Database connection failed

Kiểm tra file `.env` có đúng thông tin kết nối database:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=conference
```

## Best Practices

1. **Luôn backup database** trước khi chạy migration trong production
2. **Test migrations** trong development/staging trước khi deploy
3. **Review migration files** trước khi commit
4. **Không sử dụng `synchronize: true`** trong production
5. **Version control migration files** để theo dõi lịch sử thay đổi
6. **Viết migration `down()` method** để có thể rollback khi cần

## Ví dụ Migration

### Thêm Column

```typescript
export class AddIsReceptionistToParticipants1705740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'participants',
      new TableColumn({
        name: 'is_receptionist',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('participants', 'is_receptionist');
  }
}
```

### Tạo Table

```typescript
export class CreateUsersTable1705740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

## Liên kết

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [Database Schema Documentation](./DATABASE.md)
