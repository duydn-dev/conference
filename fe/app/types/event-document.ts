// Event Document Interface
export interface EventDocument {
  id: string
  event_id: string
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
  uploaded_at?: string
  created_at?: string
}

// Create Event Document DTO
export interface CreateEventDocumentDto {
  event_id: string
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
}

// Update Event Document DTO
export interface UpdateEventDocumentDto extends Partial<CreateEventDocumentDto> {
  id: string
}
