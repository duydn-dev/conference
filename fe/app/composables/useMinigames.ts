import type { Minigame, CreateMinigameDto, UpdateMinigameDto } from '~/types/minigame'

export const useMinigames = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    status?: number // MinigameStatus enum value
    search?: string
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.status !== undefined) query.status = options.status
    if (options?.search) query.search = options.search
    if (options?.relations) query.relations = 'true'
    return await $fetch('/minigames', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await $fetch(`/minigames/${id}`, { baseURL, query })
  }

  const create = async (data: CreateMinigameDto) => {
    return await useFetch('/minigames', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateMinigameDto>) => {
    return await useFetch(`/minigames/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/minigames/${id}`, {
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
