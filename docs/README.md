# Documentation

Tài liệu dự án Conference Management System.

## 📚 Danh sách tài liệu

### [Database Schema](./DATABASE.md)
Tài liệu chi tiết về database schema, entities, relationships và cách sử dụng TypeORM.

### [Database Setup](./DATABASE-SETUP.md)
Hướng dẫn setup PostgreSQL và cấu hình TypeORM.

### [Database-First Guide](./DATABASE-FIRST.md)
Hướng dẫn sử dụng Database-First approach với TypeORM.

### [Docker Setup](./DOCKER.md)
Hướng dẫn sử dụng Docker Compose để chạy PostgreSQL và pgAdmin.

### [Project Structure](./README-STRUCTURE.md)
Cấu trúc thư mục dự án Nuxt 4 và cách sử dụng các thư mục.

## 🚀 Quick Start

1. **Setup Database với Docker (Khuyến nghị):**
   ```bash
   # Khởi động PostgreSQL và pgAdmin
   docker-compose up -d
   
   # Tạo schema từ SQL script
   npm run db:init:docker
   ```
   
   Hoặc setup thủ công:
   ```bash
   # Tạo database
   createdb conference
   
   # Chạy schema SQL
   psql -U postgres -d conference -f server/utils/schema.sql
   ```

2. **Cấu hình môi trường:**
   - Copy `.env.example` thành `.env`
   - Điền thông tin database

3. **Chạy dự án:**
   ```bash
   npm run dev
   ```

## 📖 Tham khảo

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [PrimeVue Documentation](https://primevue.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
