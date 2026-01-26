// Minigame Prize Interface
export interface MinigamePrize {
  id: string
  minigame_id: string
  prize_name: string
  quantity: number
  description?: string | null
  image?: string | null
  remaining_quantity?: number
  order?: number | null
  created_at?: string
}

// Create Minigame Prize DTO
export interface CreateMinigamePrizeDto {
  id: string
  minigame_id: string
  prize_name: string
  quantity: number
  description?: string
  image?: string
  remaining_quantity?: number
  order?: number
}

// Update Minigame Prize DTO
export interface UpdateMinigamePrizeDto extends Partial<CreateMinigamePrizeDto> {
  id: string
}
