// Participant Interface
export interface Participant {
  id: string
  identity_number: string
  full_name: string
  email?: string
  phone?: string
  organization?: string
  position?: string
  is_receptionist?: boolean // Người đón tiếp
  created_at?: string
  updated_at?: string
}

// Create Participant DTO
export interface CreateParticipantDto {
  identity_number: string
  full_name: string
  email?: string
  phone?: string
  organization?: string
  position?: string
  is_receptionist?: boolean
}

// Update Participant DTO
export interface UpdateParticipantDto extends Partial<CreateParticipantDto> {
  id: string
}
