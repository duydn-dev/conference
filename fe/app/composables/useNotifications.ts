export const useNotifications = () => {
  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    type?: 'reminder' | 'change' | 'checkin'
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.type) query.type = options.type
    if (options?.relations) query.relations = 'true'
    return await useFetch('/api/notifications', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/notifications/${id}`, { query })
  }

  const create = async (data: {
    event_id: string
    title: string
    message: string
    type: 'reminder' | 'change' | 'checkin'
    scheduled_time?: string | Date
  }) => {
    return await useFetch('/api/notifications', {
      method: 'POST',
      body: data
    })
  }

  const update = async (
    id: string,
    data: {
      title?: string
      message?: string
      type?: 'reminder' | 'change' | 'checkin'
      scheduled_time?: string | Date
    }
  ) => {
    return await useFetch(`/api/notifications/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/notifications/${id}`, {
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
