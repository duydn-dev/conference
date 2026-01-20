// Event Status Enum (sync with API)
export enum EventStatus {
  DRAFT = 0,         // Bản nháp
  PUBLISHED = 1,     // Đã xuất bản
  CLOSED = 2,        // Đã đóng
  CANCELLED = 3,     // Đã hủy
}

// Event Status Labels for UI
export const EventStatusLabels: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: 'Bản nháp',
  [EventStatus.PUBLISHED]: 'Đã xuất bản',
  [EventStatus.CLOSED]: 'Đã đóng',
  [EventStatus.CANCELLED]: 'Đã hủy',
}

// Event Interface
export interface Event {
  id: string
  code: string
  name: string
  description?: string
  avatar?: string | null
  start_time: string | Date
  end_time: string | Date
  location_name?: string
  location?: string
  organizer_unit_id?: string
  representative_name?: string
  representative_identity?: string
  status: EventStatus
  created_at?: string
  updated_at?: string
}

// Create Event DTO
export interface CreateEventDto {
  code: string
  name: string
  description?: string
  avatar?: string | null
  start_time: string | Date
  end_time: string | Date
  location_name?: string
  location?: string
  organizer_unit_id?: string
  representative_name?: string
  representative_identity?: string
  status?: EventStatus
}

// Update Event DTO
export interface UpdateEventDto extends Partial<CreateEventDto> {
  id: string
}
