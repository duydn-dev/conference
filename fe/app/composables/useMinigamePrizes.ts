import type { MinigamePrize, CreateMinigamePrizeDto, UpdateMinigamePrizeDto } from '~/types/minigame-prize'

export const useMinigamePrizes = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    minigame_id?: string
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.minigame_id) query.minigame_id = options.minigame_id
    if (options?.relations) query.relations = 'true'
    return await useFetch('/minigame-prizes', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/minigame-prizes/${id}`, { baseURL, query })
  }

  const create = async (data: CreateMinigamePrizeDto) => {
    return await useFetch('/minigame-prizes', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateMinigamePrizeDto>) => {
    return await useFetch(`/minigame-prizes/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/minigame-prizes/${id}`, {
      method: 'DELETE',
      baseURL
    })
  }

  return {
    getPagination,
    getById,
    create,
    update,
    remove
  }
}
