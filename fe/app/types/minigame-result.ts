// Minigame Result Interface
export interface MinigameResult {
  id: string
  minigame_id: string
  prize_id: string
  participant_id: string
  won_at?: string | Date
  created_at?: string
}

// Create Minigame Result DTO
export interface CreateMinigameResultDto {
  minigame_id: string
  prize_id: string
  participant_id: string
  won_at?: string | Date
}
