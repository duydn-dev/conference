// Notification Receiver Interface
export interface NotificationReceiver {
  id: string
  notification_id: string
  participant_id: string
  sent_at?: string | Date | null
  read_at?: string | Date | null
  created_at?: string
}

// Create Notification Receiver DTO
export interface CreateNotificationReceiverDto {
  notification_id: string
  participant_id: string
  sent_at?: string | Date | null
  read_at?: string | Date | null
}

// Update Notification Receiver DTO
export interface UpdateNotificationReceiverDto extends Partial<CreateNotificationReceiverDto> {
  id: string
}
