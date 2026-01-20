// Import Log Interface
export interface ImportLog {
  id: string
  event_id: string
  file_name: string
  imported_by?: string
  total_rows: number
  success_rows: number
  failed_rows: number
  error_details?: string
  imported_at?: string
  created_at?: string
}

// Create Import Log DTO
export interface CreateImportLogDto {
  event_id: string
  file_name: string
  imported_by?: string
  total_rows: number
  success_rows: number
  failed_rows: number
  error_details?: string
}
