// Organizer Unit Interface
export interface OrganizerUnit {
  id: string
  name: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
  created_at?: string
  updated_at?: string
}

// Create Organizer Unit DTO
export interface CreateOrganizerUnitDto {
  name: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
}

// Update Organizer Unit DTO
export interface UpdateOrganizerUnitDto extends Partial<CreateOrganizerUnitDto> {
  id: string
}
