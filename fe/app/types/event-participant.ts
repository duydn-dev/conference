// Participant Status Enum (sync with API)
export enum ParticipantStatus {
  REGISTERED = 0,    // Đã đăng ký
  CHECKED_IN = 1,    // Đã check-in
  ABSENT = 2,        // Vắng mặt
}

// Import Source Enum (sync with API)
export enum ImportSource {
  MANUAL = 0,        // Nhập thủ công
  EXCEL_IMPORT = 1,  // Import từ Excel
  API = 2,           // Từ API
}

// Status Labels
export const ParticipantStatusLabels: Record<ParticipantStatus, string> = {
  [ParticipantStatus.REGISTERED]: 'Đã đăng ký',
  [ParticipantStatus.CHECKED_IN]: 'Đã check-in',
  [ParticipantStatus.ABSENT]: 'Vắng mặt',
}

export const ImportSourceLabels: Record<ImportSource, string> = {
  [ImportSource.MANUAL]: 'Nhập thủ công',
  [ImportSource.EXCEL_IMPORT]: 'Import từ Excel',
  [ImportSource.API]: 'Từ API',
}

// Event Participant Interface
export interface EventParticipant {
  id: string
  event_id: string
  participant_id: string
  checkin_time?: string | Date | null
  checkout_time?: string | Date | null
  status: ParticipantStatus
  source: ImportSource
  created_at?: string
}

// Create Event Participant DTO
export interface CreateEventParticipantDto {
  event_id: string
  participant_id: string
  checkin_time?: string | Date | null
  checkout_time?: string | Date | null
  status?: ParticipantStatus
  source?: ImportSource
}

// Update Event Participant DTO
export interface UpdateEventParticipantDto extends Partial<CreateEventParticipantDto> {
  id: string
}
