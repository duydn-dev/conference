export const useMinigamePrizes = () => {
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
    return await useFetch('/api/minigame-prizes', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/minigame-prizes/${id}`, { query })
  }

  const create = async (data: {
    minigame_id: string
    prize_name: string
    quantity: number
  }) => {
    return await useFetch('/api/minigame-prizes', {
      method: 'POST',
      body: data
    })
  }

  const update = async (
    id: string,
    data: {
      prize_name?: string
      quantity?: number
    }
  ) => {
    return await useFetch(`/api/minigame-prizes/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/minigame-prizes/${id}`, {
      method: 'DELETE'
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
