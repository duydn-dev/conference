export const useMinigames = () => {
  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    status?: 'pending' | 'running' | 'finished'
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.status) query.status = options.status
    if (options?.relations) query.relations = 'true'
    return await useFetch('/api/minigames', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/minigames/${id}`, { query })
  }

  const create = async (data: {
    event_id: string
    name: string
    type: string
    start_time: string | Date
    end_time: string | Date
    status?: 'pending' | 'running' | 'finished'
  }) => {
    return await useFetch('/api/minigames', {
      method: 'POST',
      body: data
    })
  }

  const update = async (
    id: string,
    data: {
      name?: string
      type?: string
      start_time?: string | Date
      end_time?: string | Date
      status?: 'pending' | 'running' | 'finished'
    }
  ) => {
    return await useFetch(`/api/minigames/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/minigames/${id}`, {
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
