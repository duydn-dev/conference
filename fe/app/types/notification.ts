// Notification Type Enum (sync with API)
export enum NotificationType {
  REMINDER = 0,  // Nhắc nhở
  CHANGE = 1,    // Thay đổi thông tin
  CHECKIN = 2,   // Check-in
}

// Notification Type Labels for UI
export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.REMINDER]: 'Nhắc nhở',
  [NotificationType.CHANGE]: 'Thay đổi thông tin',
  [NotificationType.CHECKIN]: 'Check-in',
}

// Notification Interface
export interface Notification {
  id: string
  event_id: string
  title: string
  content: string
  type: NotificationType
  scheduled_at?: string | Date
  sent_at?: string | Date
  created_at?: string
  updated_at?: string
}

// Create Notification DTO
export interface CreateNotificationDto {
  event_id: string
  title: string
  content: string
  type: NotificationType
  scheduled_at?: string | Date
}

// Update Notification DTO
export interface UpdateNotificationDto extends Partial<CreateNotificationDto> {
  id: string
}
