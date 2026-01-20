import type { MinigameResult, CreateMinigameResultDto } from '~/types/minigame-result'

export const useMinigameResults = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    minigame_id?: string
    participant_id?: string
    prize_id?: string
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.minigame_id) query.minigame_id = options.minigame_id
    if (options?.participant_id) query.participant_id = options.participant_id
    if (options?.prize_id) query.prize_id = options.prize_id
    if (options?.relations) query.relations = 'true'
    return await useFetch('/minigame-results', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/minigame-results/${id}`, { baseURL, query })
  }

  const create = async (data: CreateMinigameResultDto) => {
    return await useFetch('/minigame-results', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/minigame-results/${id}`, {
      method: 'DELETE',
      baseURL
    })
  }

  return {
    getPagination,
    getById,
    create,
    remove
  }
}
