export const useEventParticipants = () => {
  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    participant_id?: string
    status?: 'registered' | 'checked_in' | 'absent'
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.participant_id) query.participant_id = options.participant_id
    if (options?.status) query.status = options.status
    if (options?.relations) query.relations = 'true'
    return await useFetch('/api/event-participants', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/event-participants/${id}`, { query })
  }

  const create = async (data: {
    event_id: string
    participant_id: string
    checkin_time?: string | Date
    checkout_time?: string | Date
    status?: 'registered' | 'checked_in' | 'absent'
    source?: 'manual' | 'excel_import' | 'api'
  }) => {
    return await useFetch('/api/event-participants', {
      method: 'POST',
      body: data
    })
  }

  const update = async (
    id: string,
    data: {
      checkin_time?: string | Date
      checkout_time?: string | Date
      status?: 'registered' | 'checked_in' | 'absent'
    }
  ) => {
    return await useFetch(`/api/event-participants/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/event-participants/${id}`, {
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
