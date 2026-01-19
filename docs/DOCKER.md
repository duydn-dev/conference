# Docker Setup Guide

Hướng dẫn sử dụng Docker Compose để chạy PostgreSQL và pgAdmin.

## Yêu cầu

- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose

## Cấu hình

### 1. Cập nhật file `.env`

Copy `.env.example` thành `.env` và cập nhật các giá trị:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=conference
DB_USER=postgres
DB_PASSWORD=postgres

PGADMIN_EMAIL=admin@conference.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

### 2. Khởi động services

```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down

# Dừng và xóa volumes (xóa dữ liệu)
docker-compose down -v
```

## Truy cập Services

### PostgreSQL

- **Host:** `localhost`
- **Port:** `5432` (hoặc port trong `.env`)
- **Database:** `conference`
- **Username:** `postgres`
- **Password:** `postgres` (hoặc password trong `.env`)

**Connection string:**
```
postgresql://postgres:postgres@localhost:5432/conference
```

### pgAdmin

- **URL:** http://localhost:5050
- **Email:** `admin@conference.com` (hoặc email trong `.env`)
- **Password:** `admin` (hoặc password trong `.env`)

## Kết nối pgAdmin với PostgreSQL

1. Mở pgAdmin tại http://localhost:5050
2. Đăng nhập với email và password
3. Click chuột phải vào **Servers** → **Register** → **Server**
4. Điền thông tin:
   - **Name:** Conference Database
   - **Host:** `postgres` (tên service trong docker-compose)
   - **Port:** `5432`
   - **Username:** `postgres`
   - **Password:** `postgres`
   - **Database:** `conference`

## Khởi tạo Database Schema

Sau khi database đã chạy, tạo schema từ SQL script:

```bash
# Chạy schema SQL script
npm run db:init:docker
```

Hoặc schema sẽ tự động được tạo khi container khởi động lần đầu (nếu file `server/utils/schema.sql` được mount vào `/docker-entrypoint-initdb.d/`).

## Lệnh hữu ích

```bash
# Xem trạng thái containers
docker-compose ps

# Xem logs PostgreSQL
docker-compose logs postgres

# Xem logs pgAdmin
docker-compose logs pgadmin

# Restart một service cụ thể
docker-compose restart postgres

# Vào shell của PostgreSQL container
docker-compose exec postgres psql -U postgres -d conference

# Backup database
docker-compose exec postgres pg_dump -U postgres conference > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres conference < backup.sql
```

## Troubleshooting

### Port đã được sử dụng

Nếu port 5432 hoặc 5050 đã được sử dụng, thay đổi trong `.env`:

```env
DB_PORT=5433
PGADMIN_PORT=5051
```

### Xóa và tạo lại database

```bash
# Dừng và xóa tất cả
docker-compose down -v

# Khởi động lại
docker-compose up -d
```

### Kiểm tra kết nối

```bash
# Test connection từ host
docker-compose exec postgres psql -U postgres -d conference -c "SELECT version();"
```

## Volumes

Dữ liệu được lưu trong Docker volumes:

- `postgres_data` - Database data
- `pgadmin_data` - pgAdmin settings

Để xóa dữ liệu:

```bash
docker-compose down -v
```

## Production

⚠️ **Lưu ý:** Cấu hình này chỉ dùng cho development. Cho production:

1. Sử dụng strong passwords
2. Không expose ports ra ngoài
3. Sử dụng Docker secrets hoặc environment variables
4. Setup SSL/TLS
5. Backup định kỳ
