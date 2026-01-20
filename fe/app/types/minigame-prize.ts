// Minigame Prize Interface
export interface MinigamePrize {
  id: string
  minigame_id: string
  prize_name: string
  quantity: number
  remaining_quantity?: number
  created_at?: string
}

// Create Minigame Prize DTO
export interface CreateMinigamePrizeDto {
  minigame_id: string
  prize_name: string
  quantity: number
  remaining_quantity?: number
}

// Update Minigame Prize DTO
export interface UpdateMinigamePrizeDto extends Partial<CreateMinigamePrizeDto> {
  id: string
}
