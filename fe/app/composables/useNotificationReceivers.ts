export const useNotificationReceivers = () => {
  const getPagination = async (options?: {
    page?: number
    limit?: number
    notification_id?: string
    participant_id?: string
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.notification_id) query.notification_id = options.notification_id
    if (options?.participant_id) query.participant_id = options.participant_id
    if (options?.relations) query.relations = 'true'
    return await useFetch('/api/notification-receivers', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/notification-receivers/${id}`, { query })
  }

  const create = async (data: {
    notification_id: string
    participant_id: string
    sent_at?: string | Date
    read_at?: string | Date
  }) => {
    return await useFetch('/api/notification-receivers', {
      method: 'POST',
      body: data
    })
  }

  const update = async (
    id: string,
    data: {
      sent_at?: string | Date
      read_at?: string | Date
    }
  ) => {
    return await useFetch(`/api/notification-receivers/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/notification-receivers/${id}`, {
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
