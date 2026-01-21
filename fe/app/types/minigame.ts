// Minigame Status Enum (sync with API)
export enum MinigameStatus {
  PENDING = 0,   // Chờ bắt đầu
  RUNNING = 1,   // Đang chạy
  FINISHED = 2,  // Đã kết thúc
}

// Minigame Status Labels for UI
export const MinigameStatusLabels: Record<MinigameStatus, string> = {
  [MinigameStatus.PENDING]: 'Chờ bắt đầu',
  [MinigameStatus.RUNNING]: 'Đang chạy',
  [MinigameStatus.FINISHED]: 'Đã kết thúc',
}

// Minigame Interface
export interface Minigame {
  id: string
  event_id: string
  name: string
  type: string
  description?: string
  config?: any
  start_time?: string | Date
  end_time?: string | Date
  status: MinigameStatus
  event?: any
  created_at?: string
  updated_at?: string
}

// Create Minigame DTO
export interface CreateMinigameDto {
  event_id: string
  name: string
  type: string
  description?: string
  config?: any
  start_time?: string | Date
  end_time?: string | Date
  status?: MinigameStatus
}

// Update Minigame DTO
export interface UpdateMinigameDto extends Partial<CreateMinigameDto> {
  id: string
}
