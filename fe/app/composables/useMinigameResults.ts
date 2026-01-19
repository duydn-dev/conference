export const useMinigameResults = () => {
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
    return await useFetch('/api/minigame-results', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/minigame-results/${id}`, { query })
  }

  const create = async (data: {
    minigame_id: string
    prize_id: string
    participant_id: string
  }) => {
    return await useFetch('/api/minigame-results', {
      method: 'POST',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/minigame-results/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    getPagination,
    getById,
    create,
    remove
  }
}
