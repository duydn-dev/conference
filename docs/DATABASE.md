# Database Schema Documentation

## Tổng quan

Database schema cho hệ thống quản lý sự kiện (Event Management System) sử dụng PostgreSQL và TypeORM.

> 📌 **Database-First Approach**: Schema được quản lý trực tiếp trong PostgreSQL. Entities được định nghĩa để map với database schema có sẵn. Xem [DATABASE-FIRST.md](./DATABASE-FIRST.md) để biết thêm chi tiết.

> 🔄 **Migrations**: Để quản lý và sync database schema, xem [MIGRATIONS.md](./MIGRATIONS.md) để biết cách sử dụng hệ thống migration.

## Cấu trúc Entities

### 1. OrganizerUnit (Đơn vị tổ chức)
**Table:** `organizer_units`

Quản lý thông tin các đơn vị tổ chức sự kiện.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | varchar | Tên đơn vị |
| contact_person | varchar | Người liên hệ |
| contact_email | varchar | Email liên hệ |
| contact_phone | varchar | Số điện thoại |
| created_at | timestamp | Ngày tạo |

**Relationships:**
- One-to-Many với `Event`

---

### 2. Event (Sự kiện)
**Table:** `events`

Thông tin chính về các sự kiện.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| code | varchar | Mã sự kiện (unique) |
| name | varchar | Tên sự kiện |
| description | text | Mô tả |
| start_time | timestamp | Thời gian bắt đầu |
| end_time | timestamp | Thời gian kết thúc |
| location_name | varchar | Tên địa điểm |
| location | varchar | Địa chỉ |
| organizer_unit_id | uuid | FK → organizer_units |
| representative_name | varchar | Tên người đại diện |
| representative_identity | varchar | CMND/CCCD người đại diện |
| status | event_status | Trạng thái (draft/published/closed/cancelled) |
| created_at | timestamp | Ngày tạo |
| updated_at | timestamp | Ngày cập nhật |

**Relationships:**
- Many-to-One với `OrganizerUnit`
- One-to-Many với `EventContent`, `EventDocument`, `EventParticipant`, `Notification`, `Minigame`, `ImportLog`

**ENUM:** `event_status`
- `draft` - Nháp
- `published` - Đã xuất bản
- `closed` - Đã đóng
- `cancelled` - Đã hủy

---

### 3. EventContent (Nội dung sự kiện)
**Table:** `event_contents`

Nội dung chi tiết của sự kiện (agenda, chương trình).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| title | varchar | Tiêu đề |
| content | text | Nội dung |
| start_time | timestamp | Thời gian bắt đầu |
| end_time | timestamp | Thời gian kết thúc |
| order_no | int | Thứ tự |

**Relationships:**
- Many-to-One với `Event`

---

### 4. EventDocument (Tài liệu sự kiện)
**Table:** `event_documents`

Các file tài liệu liên quan đến sự kiện.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| file_name | varchar | Tên file |
| file_path | text | Đường dẫn file |
| file_type | varchar | Loại file |
| user_files | varchar | File người dùng |
| uploaded_at | timestamp | Ngày upload |

**Relationships:**
- Many-to-One với `Event`

---

### 5. Participant (Người tham dự)
**Table:** `participants`

Thông tin người tham dự sự kiện.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| identity_number | varchar | CMND/CCCD (unique) |
| full_name | varchar | Họ và tên |
| email | varchar | Email |
| phone | varchar | Số điện thoại |
| organization | varchar | Tổ chức |
| position | varchar | Chức vụ |
| created_at | timestamp | Ngày tạo |

**Relationships:**
- One-to-Many với `EventParticipant`, `NotificationReceiver`, `MinigameResult`

---

### 6. EventParticipant (Đăng ký tham dự)
**Table:** `event_participants`

Bảng liên kết giữa Event và Participant (many-to-many).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| participant_id | uuid | FK → participants |
| checkin_time | timestamp | Thời gian check-in |
| checkout_time | timestamp | Thời gian check-out |
| status | participant_status | Trạng thái |
| source | import_source | Nguồn đăng ký |
| created_at | timestamp | Ngày tạo |

**Relationships:**
- Many-to-One với `Event` và `Participant`
- Unique constraint trên (`event_id`, `participant_id`)

**ENUM:** `participant_status`
- `registered` - Đã đăng ký
- `checked_in` - Đã check-in
- `absent` - Vắng mặt

**ENUM:** `import_source`
- `manual` - Nhập thủ công
- `excel_import` - Import từ Excel
- `api` - Từ API

---

### 7. Notification (Thông báo)
**Table:** `notifications`

Thông báo gửi cho người tham dự.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| title | varchar | Tiêu đề |
| message | text | Nội dung |
| type | notification_type | Loại thông báo |
| scheduled_time | timestamp | Thời gian lên lịch |
| created_at | timestamp | Ngày tạo |

**Relationships:**
- Many-to-One với `Event`
- One-to-Many với `NotificationReceiver`

**ENUM:** `notification_type`
- `reminder` - Nhắc nhở
- `change` - Thay đổi
- `checkin` - Check-in

---

### 8. NotificationReceiver (Người nhận thông báo)
**Table:** `notification_receivers`

Bảng liên kết giữa Notification và Participant.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| notification_id | uuid | FK → notifications |
| participant_id | uuid | FK → participants |
| sent_at | timestamp | Thời gian gửi |
| read_at | timestamp | Thời gian đọc |

**Relationships:**
- Many-to-One với `Notification` và `Participant`

---

### 9. Minigame (Trò chơi mini)
**Table:** `minigames`

Các trò chơi mini trong sự kiện.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| name | varchar | Tên trò chơi |
| type | varchar | Loại trò chơi |
| start_time | timestamp | Thời gian bắt đầu |
| end_time | timestamp | Thời gian kết thúc |
| status | minigame_status | Trạng thái |

**Relationships:**
- Many-to-One với `Event`
- One-to-Many với `MinigamePrize`, `MinigameResult`

**ENUM:** `minigame_status`
- `pending` - Chờ
- `running` - Đang chạy
- `finished` - Đã kết thúc

---

### 10. MinigamePrize (Giải thưởng)
**Table:** `minigame_prizes`

Giải thưởng cho các trò chơi mini.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| minigame_id | uuid | FK → minigames |
| prize_name | varchar | Tên giải thưởng |
| quantity | int | Số lượng |

**Relationships:**
- Many-to-One với `Minigame`
- One-to-Many với `MinigameResult`

---

### 11. MinigameResult (Kết quả trò chơi)
**Table:** `minigame_results`

Kết quả trúng thưởng của người tham dự.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| minigame_id | uuid | FK → minigames |
| prize_id | uuid | FK → minigame_prizes |
| participant_id | uuid | FK → participants |
| drawn_at | timestamp | Thời gian quay |

**Relationships:**
- Many-to-One với `Minigame`, `MinigamePrize`, `Participant`

---

### 12. ImportLog (Nhật ký import)
**Table:** `import_logs`

Lịch sử import dữ liệu.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| file_name | varchar | Tên file |
| imported_by | varchar | Người import |
| total_rows | int | Tổng số dòng |
| success_rows | int | Số dòng thành công |
| failed_rows | int | Số dòng thất bại |
| imported_at | timestamp | Thời gian import |

**Relationships:**
- Many-to-One với `Event`

---

## Database-First Approach

Dự án sử dụng **Database-First** approach:
- Schema được quản lý trực tiếp trong PostgreSQL
- Không sử dụng migrations để tạo schema
- Xem chi tiết tại [DATABASE-FIRST.md](./DATABASE-FIRST.md)

---

## Sử dụng trong Code

### Ví dụ: Lấy danh sách events

```typescript
import { getRepository } from '../utils/database'
import { Event } from '../entities/Event.entity'

export default defineEventHandler(async (event) => {
  const eventRepository = await getRepository<Event>(Event)
  const events = await eventRepository.find({
    relations: ['organizerUnit', 'eventParticipants']
  })
  return events
})
```

### Ví dụ: Tạo event mới

```typescript
import { getRepository } from '../utils/database'
import { Event, EventStatus } from '../entities/Event.entity'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const eventRepository = await getRepository<Event>(Event)
  
  const newEvent = eventRepository.create({
    id: crypto.randomUUID(),
    code: body.code,
    name: body.name,
    start_time: new Date(body.start_time),
    end_time: new Date(body.end_time),
    status: EventStatus.DRAFT
  })
  
  const savedEvent = await eventRepository.save(newEvent)
  return savedEvent
})
```

---

## Lưu ý

- Tất cả Primary Keys sử dụng `uuid` thay vì auto-increment
- Sử dụng ENUM types cho các trường có giá trị cố định
- Foreign keys được định nghĩa rõ ràng với relationships
- Timestamps tự động với `created_at` và `updated_at`
- Unique constraint trên `event_participants(event_id, participant_id)` để tránh trùng lặp
