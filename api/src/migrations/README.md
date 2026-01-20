# Database Migrations

Thư mục này chứa các migration scripts cho database.

## Cách sử dụng

### 1. Sync database từ entities (Tự động)

Chạy script để tự động sync database dựa trên các entity:

```bash
npm run migration:sync
```

Script này sẽ:
- Đọc tất cả các entity files
- So sánh với database hiện tại
- Tự động thêm các columns/tables còn thiếu

### 2. Chạy migrations thủ công

```bash
# Chạy tất cả migrations chưa được apply
npm run migration:run

# Revert migration cuối cùng
npm run migration:revert
```

### 3. Generate migration mới

```bash
npm run migration:generate -- MigrationName
```

## Migration Files

- `1705740000000-AddIsReceptionistToParticipants.ts` - Thêm cột `is_receptionist` vào bảng `participants`

## Lưu ý

- Luôn backup database trước khi chạy migrations
- Kiểm tra migration files trước khi chạy
- Trong production, không sử dụng `synchronize: true`
